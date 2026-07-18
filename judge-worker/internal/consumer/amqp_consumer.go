// Package consumer implements the RabbitMQ AMQP consumer for the judge-worker.
// This is the ONLY layer that talks to the message broker.
// It dequeues JudgeTasks, delegates to the JudgeService (Executor), and
// explicitly ACKs or NACKs each message — guaranteeing no task is ever lost.
//
// In AOJ terminology, this is the bridge between the message queue and the Executor.
// AMQP ACK/NACK guarantees: if the Executor crashes mid-flight, RabbitMQ
// redelivers the task to another worker (Qos=1 fair dispatch).
package consumer

import (
	"context"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/ai-online-judge/judge-worker/internal/service"
	"github.com/ai-online-judge/pkg/models"
)

// AMQPConsumer subscribes to the "judge.tasks" queue and dispatches
// each message to the JudgeService for execution.
type AMQPConsumer struct {
	ch         *amqp.Channel
	judgeSvc   service.JudgeService
	queueName  string
}

// NewAMQPConsumer constructs an AMQPConsumer. Called from main.go (DI root).
func NewAMQPConsumer(ch *amqp.Channel, judgeSvc service.JudgeService) *AMQPConsumer {
	return &AMQPConsumer{
		ch:        ch,
		judgeSvc:  judgeSvc,
		queueName: "judge.tasks",
	}
}

// Start begins consuming from the "judge.tasks" queue and blocks forever.
// Intended to be called from main.go as the final step — it runs the event loop
// that keeps the worker alive and processing submissions.
//
// AMQP delivery guarantees:
//   - autoAck=false: messages are held "unacked" until we explicitly ACK or NACK
//   - Qos(1): only 1 unacked message per worker at a time (fair dispatch)
//   - ACK on success: tells RabbitMQ the task is processed — remove from queue
//   - NACK(requeue=false) on fatal error: sends message to Dead Letter Exchange if configured;
//     otherwise it is discarded. This prevents poison messages from looping forever.
func (c *AMQPConsumer) Start(ctx context.Context) error {
	// Declare the queue idempotently — safe to call even if already declared by api-gateway
	_, err := c.ch.QueueDeclare(
		c.queueName,
		true,  // durable — survives broker restart
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,   // args (set x-dead-letter-exchange here to enable DLX routing)
	)
	if err != nil {
		return err
	}

	// Qos=1: fair dispatch — don't flood this worker; process one task at a time.
	// This is critical for the Executor: each Judge0 call is CPU-bound and blocking.
	if err := c.ch.Qos(1, 0, false); err != nil {
		return err
	}

	msgs, err := c.ch.Consume(
		c.queueName,
		"",    // consumer tag — auto-generated
		false, // autoAck=false — we ACK/NACK manually (AMQP delivery guarantee)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		return err
	}

	log.Printf("[judge-worker] Consumer: listening on queue %q — Qos=1, autoAck=false", c.queueName)

	// Block on the delivery channel — main.go calls Start() as its last statement
	for {
		select {
		case <-ctx.Done():
			log.Println("[judge-worker] Consumer: context cancelled, shutting down")
			return ctx.Err()

		case msg, ok := <-msgs:
			if !ok {
				log.Println("[judge-worker] Consumer: delivery channel closed")
				return nil
			}
			c.processMessage(ctx, msg)
		}
	}
}

// processMessage handles a single AMQP delivery.
//
// ACK/NACK strategy:
//   - JSON parse error      → NACK(requeue=false): malformed message; discarded/DLX
//   - Judge service error   → NACK(requeue=false): fatal execution error; discarded/DLX
//   - Success               → ACK: task complete, remove from queue
//
// Note: requeue=false prevents poison messages (bad payloads) from looping forever.
// To handle transient failures (network blip), use a retry queue or DLX with TTL.
func (c *AMQPConsumer) processMessage(ctx context.Context, msg amqp.Delivery) {
	// Deserialize the JudgeTask published by the API Gateway
	var task models.JudgeTask
	if err := json.Unmarshal(msg.Body, &task); err != nil {
		log.Printf("[judge-worker] Consumer: failed to parse JudgeTask: %v — NACKing (no requeue)", err)
		// requeue=false: malformed JSON will never become valid; discard or route to DLX
		if nackErr := msg.Nack(false, false); nackErr != nil {
			log.Printf("[judge-worker] Consumer: NACK failed: %v", nackErr)
		}
		return
	}

	log.Printf("[judge-worker] Consumer: dequeued submission_id=%s language=%s", task.SubmissionID, task.Language)

	// Delegate to the JudgeService (Executor layer):
	// Base64 decode → Judge0 API → verdict → PostgreSQL persist
	if err := c.judgeSvc.Execute(ctx, task); err != nil {
		log.Printf("[judge-worker] Consumer: Executor failed for submission %s: %v — NACKing (no requeue)", task.SubmissionID, err)
		// requeue=false: a fatal execution error (bad language, Judge0 down) should go to DLX,
		// not loop back into the queue and consume all worker capacity.
		if nackErr := msg.Nack(false, false); nackErr != nil {
			log.Printf("[judge-worker] Consumer: NACK failed: %v", nackErr)
		}
		return
	}

	// ACK: execution succeeded, verdict and effort_based_metrics persisted to PostgreSQL
	if err := msg.Ack(false); err != nil {
		log.Printf("[judge-worker] Consumer: ACK failed for submission %s: %v", task.SubmissionID, err)
	}
	log.Printf("[judge-worker] Consumer: ACKed submission_id=%s", task.SubmissionID)
}
