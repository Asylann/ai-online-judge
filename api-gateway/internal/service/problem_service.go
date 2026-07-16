// Package service implements the problem and submission business logic.
// This layer orchestrates: repository calls, Base64 encoding, and RabbitMQ publishing.
// It must NEVER import gin or touch HTTP — those concerns live in /handler.
package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/models"
	"github.com/ai-online-judge/pkg/telemetry"
)

// ProblemService defines the contract for problem business logic.
type ProblemService interface {
	ListProblems(ctx context.Context) ([]models.Problem, error)
	GetProblem(ctx context.Context, id uuid.UUID) (*models.Problem, error)
	GetNextRecommendation(ctx context.Context, userID uuid.UUID, currentProblemID uuid.UUID) (*models.Problem, error)
}

// SubmissionService defines the contract for code submission business logic.
type SubmissionService interface {
	// SubmitCode encodes source code in Base64, persists a Pending record to PostgreSQL,
	// and publishes a JudgeTask to RabbitMQ for the Judge Worker (Launcher + Executor).
	// CRITICAL: All code MUST be Base64 encoded before any JSON transmission (Critical Rule #1).
	SubmitCode(ctx context.Context, userID, problemID uuid.UUID, rawCode, language string) (*models.Submission, error)
	GetSubmission(ctx context.Context, id uuid.UUID) (*models.Submission, error)
	ListSubmissionsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.SubmissionHistoryItem, error)
}

// ── Problem Service ────────────────────────────────────────────────────────────

type problemService struct {
	problemRepo repository.ProblemRepository
}

// NewProblemService constructs a ProblemService. Called from main.go (DI root).
func NewProblemService(problemRepo repository.ProblemRepository) ProblemService {
	return &problemService{problemRepo: problemRepo}
}

func (s *problemService) ListProblems(ctx context.Context) ([]models.Problem, error) {
	return s.problemRepo.ListProblems(ctx)
}

func (s *problemService) GetProblem(ctx context.Context, id uuid.UUID) (*models.Problem, error) {
	return s.problemRepo.GetProblemByID(ctx, id)
}

func (s *problemService) GetNextRecommendation(ctx context.Context, userID uuid.UUID, currentProblemID uuid.UUID) (*models.Problem, error) {
	return s.problemRepo.GetRecommendationZPD(ctx, userID, currentProblemID)
}

// ── Submission Service ─────────────────────────────────────────────────────────

type submissionService struct {
	submissionRepo repository.SubmissionRepository
	problemRepo    repository.ProblemRepository
	amqpCh         *amqp.Channel // RabbitMQ channel for publishing JudgeTasks
}

// NewSubmissionService constructs a SubmissionService with RabbitMQ channel injected.
// The AMQP channel is opened once in main.go and shared (channels are goroutine-unsafe —
// use one per goroutine for concurrent publishers).
func NewSubmissionService(
	submissionRepo repository.SubmissionRepository,
	problemRepo repository.ProblemRepository,
	amqpCh *amqp.Channel,
) SubmissionService {
	return &submissionService{
		submissionRepo: submissionRepo,
		problemRepo:    problemRepo,
		amqpCh:         amqpCh,
	}
}

// SubmitCode is the core EDM entry point. Every call creates a submission record,
// regardless of future verdict — enabling attempt_count and latency tracking.
//
// Flow:
//  1. Base64-encode raw source code (Critical Rule #1)
//  2. Persist submission with status="Pending" (starts the EDM chain)
//  3. Build JudgeTask and publish to RabbitMQ "judge.tasks" queue
//  4. Return the Pending submission to the handler for HTTP 202 response
func (s *submissionService) SubmitCode(
	ctx context.Context,
	userID, problemID uuid.UUID,
	rawCode, language string,
) (*models.Submission, error) {
	// Step 1: Base64-encode the raw source code.
	// This prevents special chars (Windows \r\n, Unicode) from corrupting JSON.
	codeBase64 := base64.StdEncoding.EncodeToString([]byte(rawCode))

	// Step 2: Persist the initial Pending record.
	// EDM fields (execution_time_ms, cognitive_effort_index) are NULL — populated later.
	sub := &models.Submission{
		UserID:     userID,
		ProblemID:  problemID,
		CodeBase64: codeBase64,
		Language:   language,
		Status:     "Pending",
	}
	created, err := s.submissionRepo.CreateSubmission(ctx, sub)
	if err != nil {
		return nil, fmt.Errorf("submission_service.SubmitCode: persist: %w", err)
	}

	// Step 3: Fetch problem metadata for time/memory limits.
	problem, err := s.problemRepo.GetProblemByID(ctx, problemID)
	if err != nil {
		return nil, fmt.Errorf("submission_service.SubmitCode: get problem: %w", err)
	}

	// Step 4: Build and publish JudgeTask to RabbitMQ.
	// The Judge Worker fetches all 10 ranked test cases from PostgreSQL by ProblemID.
	// Stdin / ExpectedOutput are NOT sent here — they live in the test_cases table.
	task := models.JudgeTask{
		SubmissionID: created.ID,
		UserID:       userID,
		ProblemID:    problemID,
		CodeBase64:   codeBase64,
		Language:     language,
		TimeLimit:    problem.TimeLimit,
		MemoryLimit:  problem.MemoryLimit,
	}

	body, err := json.Marshal(task)
	if err != nil {
		return nil, fmt.Errorf("submission_service.SubmitCode: marshal task: %w", err)
	}

	headers := make(amqp.Table)
	otel.GetTextMapPropagator().Inject(ctx, telemetry.AMQPHeadersCarrier(headers))

	if err := s.amqpCh.PublishWithContext(ctx,
		"",            // default exchange
		"judge.tasks", // routing key = queue name
		false,         // mandatory
		false,         // immediate
		amqp.Publishing{
			Headers:      headers,
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent, // survive broker restart
			Body:         body,
		},
	); err != nil {
		return nil, fmt.Errorf("submission_service.SubmitCode: publish to RabbitMQ: %w", err)
	}

	return created, nil
}

// GetSubmission returns the full submission record including EDM fields.
// The verdict and cognitive_effort_index arrive asynchronously — poll this endpoint
// or use the WebSocket service for real-time updates.
func (s *submissionService) GetSubmission(ctx context.Context, id uuid.UUID) (*models.Submission, error) {
	return s.submissionRepo.GetSubmissionByID(ctx, id)
}

func (s *submissionService) ListSubmissionsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.SubmissionHistoryItem, error) {
	return s.submissionRepo.ListSubmissionsByUserID(ctx, userID, limit)
}
