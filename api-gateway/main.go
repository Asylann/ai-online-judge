// api-gateway: Main REST API entrypoint for the AI Online Judge.
//
// This file is intentionally THIN. Its only responsibilities are:
//   1. Load configuration (config layer)
//   2. Establish external connections (PostgreSQL, Redis, RabbitMQ)
//   3. Wire dependencies top-down: repository → service → handler (DI root)
//   4. Register routes and start the Gin HTTP server
//
// No business logic, SQL, or routing logic lives here.
// Architecture: config → repository → service → handler → gin.Engine
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/ai-online-judge/api-gateway/internal/config"
	"github.com/ai-online-judge/api-gateway/internal/handler"
	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/api-gateway/internal/service"
	"github.com/ai-online-judge/pkg/database"
)

func main() {
	ctx := context.Background()

	// ── Step 1: Load Configuration ──────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[api-gateway] Config error: %v", err)
	}

	// ── Step 2: Establish External Connections ───────────────────────────────────

	// PostgreSQL — primary store for users, problems, submissions (EDM)
	db, err := database.NewPostgresPool(ctx)
	if err != nil {
		log.Fatalf("[api-gateway] PostgreSQL connection failed: %v", err)
	}
	defer db.Close()
	log.Println("[api-gateway] PostgreSQL connected")

	// Redis — rate limiting + leaderboard cache
	rdb, err := database.NewRedisClient()
	if err != nil {
		log.Fatalf("[api-gateway] Redis connection failed: %v", err)
	}
	defer rdb.Close()
	log.Println("[api-gateway] Redis connected")

	// RabbitMQ — AMQP broker for judge task queue (JudgeTask → judge-worker)
	amqpConn, err := amqp.Dial(cfg.RabbitMQURL)
	if err != nil {
		log.Fatalf("[api-gateway] RabbitMQ connection failed: %v", err)
	}
	defer amqpConn.Close()

	amqpCh, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("[api-gateway] RabbitMQ channel failed: %v", err)
	}
	defer amqpCh.Close()

	// Declare the judge.tasks queue (idempotent — safe to call on every startup)
	_, err = amqpCh.QueueDeclare(
		"judge.tasks", // name
		true,          // durable — survives broker restart
		false,         // auto-delete
		false,         // exclusive
		false,         // no-wait
		nil,           // args
	)
	if err != nil {
		log.Fatalf("[api-gateway] Failed to declare judge.tasks queue: %v", err)
	}
	log.Println("[api-gateway] RabbitMQ connected, judge.tasks queue ready")

	// ── Step 3: Dependency Injection (top-down: repo → service → handler) ────────

	// Repository layer — owns all SQL queries
	userRepo       := repository.NewUserRepository(db)
	problemRepo    := repository.NewProblemRepository(db)
	submissionRepo := repository.NewSubmissionRepository(db)

	// Service layer — orchestrates business logic + RabbitMQ publishing
	authSvc       := service.NewAuthService(userRepo, cfg.JWTSecret)
	problemSvc    := service.NewProblemService(problemRepo)
	submissionSvc := service.NewSubmissionService(submissionRepo, problemRepo, amqpCh)

	// Handler layer — HTTP parsing and response writing only
	authHandler       := handler.NewAuthHandler(authSvc)
	problemHandler    := handler.NewProblemHandler(problemSvc)
	submissionHandler := handler.NewSubmissionHandler(submissionSvc, userRepo)

	// Suppress unused variable warning for rdb (used by future JWT middleware)
	_ = rdb

	// ── Step 4: Configure Gin and Register Routes ────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), handler.CORSMiddleware())

	// Health check — polled by Docker Compose and the Observer daemon
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "api-gateway",
		})
	})

	// Wire all route groups
	handler.RegisterRoutes(r, authHandler, problemHandler, submissionHandler, cfg.JWTSecret)

	// ── Step 5: Start HTTP Server ────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("[api-gateway] Starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("[api-gateway] Server failed: %v", err)
	}
}
