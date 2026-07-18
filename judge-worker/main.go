// judge-worker: The Executor in AOJ terminology.
//
// This file is intentionally THIN. Its only responsibilities are:
//   1. Load configuration (config layer)
//   2. Establish external connections (PostgreSQL, RabbitMQ, Redis)
//   3. Wire dependencies top-down: repository → service → consumer (DI root)
//   4. Start the AMQP consumer and block forever
//
// Architecture (Adaptive Go Microservice — AMQP Worker role):
//   config → connections → repository → service → consumer → block
//
// There is NO HTTP server here. This service is a pure AMQP consumer.
// It receives JudgeTasks from RabbitMQ, executes them in the Judge0 sandbox,
// persists the verdict + effort_based_metrics back to PostgreSQL, then
// publishes the event to Redis Pub/Sub for real-time WebSocket delivery.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/ai-online-judge/judge-worker/internal/config"
	"github.com/ai-online-judge/judge-worker/internal/consumer"
	"github.com/ai-online-judge/judge-worker/internal/repository"
	"github.com/ai-online-judge/judge-worker/internal/service"
	"github.com/ai-online-judge/pkg/database"
)

func main() {
	// ── Step 1: Load Configuration ──────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[judge-worker] Config error: %v", err)
	}

	// ── Step 2: Establish External Connections ───────────────────────────────────

	// Context for graceful shutdown — cancelled on SIGINT/SIGTERM
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()


	// PostgreSQL — stores verdict and effort_based_metrics after every execution
	db, err := database.NewPostgresPool(ctx)
	if err != nil {
		log.Fatalf("[judge-worker] PostgreSQL connection failed: %v", err)
	}
	defer db.Close()
	log.Println("[judge-worker] PostgreSQL connected")

	// Redis — Pub/Sub channel for real-time verdict delivery to websocket-service
	rdb, err := database.NewRedisClient()
	if err != nil {
		log.Fatalf("[judge-worker] Redis connection failed: %v", err)
	}
	defer rdb.Close()
	log.Println("[judge-worker] Redis connected")

	// RabbitMQ — dequeue JudgeTasks published by the API Gateway
	amqpConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("[judge-worker] RabbitMQ connection failed: %v", err)
	}
	defer amqpConn.Close()

	amqpCh, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("[judge-worker] RabbitMQ channel failed: %v", err)
	}
	defer amqpCh.Close()
	log.Println("[judge-worker] RabbitMQ connected")

	// ── Step 3: Dependency Injection (top-down: repo → service → consumer) ────────

	// Repository layer — owns all SQL queries (UpdateVerdict, GetTestCasesForProblem)
	submissionRepo := repository.NewSubmissionRepository(db)
	tcRepo := repository.NewTestCaseRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(rdb)

	// Service layer — Executor: fetch test cases → Judge0 loop → verdict persist → Redis event → AST trigger
	judgeSvc := service.NewJudgeService(submissionRepo, tcRepo, leaderboardRepo, cfg.Judge0URL, cfg.ASTServiceURL, rdb)

	// Consumer layer — AMQP transport: dequeue, dispatch to service, ACK/NACK
	amqpConsumer := consumer.NewAMQPConsumer(amqpCh, judgeSvc)


	// ── Step 4: Start Consumer (blocks until context is cancelled) ───────────────
	// There is no HTTP server. The goroutine model here is:
	//   main goroutine → Start() blocks on AMQP delivery channel
	//   OS signal       → ctx.Done() fires → Start() returns → defer cleanup runs
	log.Println("[judge-worker] Starting Executor — waiting for judge tasks on queue: judge.tasks")
	if err := amqpConsumer.Start(ctx); err != nil && err != context.Canceled {
		log.Fatalf("[judge-worker] Consumer exited with error: %v", err)
	}
	log.Println("[judge-worker] Graceful shutdown complete")
}
