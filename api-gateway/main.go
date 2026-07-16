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
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/ai-online-judge/api-gateway/internal/config"
	"github.com/ai-online-judge/api-gateway/internal/handler"
	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/api-gateway/internal/service"
	"github.com/ai-online-judge/pkg/database"
	"github.com/ai-online-judge/pkg/telemetry"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// ── Step 1: Load Configuration ──────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[api-gateway] Config error: %v", err)
	}

	// ── Step 1.5: Initialize OpenTelemetry Tracing ──────────────────────────────
	tracerProvider, err := telemetry.InitTracer("api-gateway", cfg.JaegerEndpoint)
	if err != nil {
		log.Fatalf("[api-gateway] Failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tracerProvider.Shutdown(ctx); err != nil {
			log.Printf("[api-gateway] Error shutting down tracer provider: %v", err)
		}
	}()
	log.Printf("[api-gateway] OpenTelemetry initialized (endpoint: %s)", cfg.JaegerEndpoint)

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
	userRepo        := repository.NewUserRepository(db)
	problemRepo     := repository.NewProblemRepository(db)
	submissionRepo  := repository.NewSubmissionRepository(db)
	adminRepo       := repository.NewAdminRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(rdb, db)
	moduleRepo      := repository.NewModuleRepository(db)

	// Service layer — orchestrates business logic + RabbitMQ publishing
	authSvc           := service.NewAuthService(userRepo, cfg.JWTSecret)
	problemSvc        := service.NewProblemService(problemRepo)
	submissionSvc     := service.NewSubmissionService(submissionRepo, problemRepo, amqpCh)
	adminSvc          := service.NewAdminService(adminRepo, cfg.AITutorURL)
	leaderboardSvc    := service.NewLeaderboardService(leaderboardRepo)
	moduleSvc         := service.NewModuleService(moduleRepo, problemRepo)
	dailyChallengeSvc := service.NewDailyChallengeService(problemRepo, rdb)
	dailyChallengeSvc.StartDailyTicker(ctx)

	// Handler layer — HTTP parsing and response writing only
	authHandler        := handler.NewAuthHandler(authSvc)
	problemHandler     := handler.NewProblemHandler(problemSvc, dailyChallengeSvc)
	submissionHandler  := handler.NewSubmissionHandler(submissionSvc, userRepo)
	adminHandler       := handler.NewAdminHandler(adminSvc, moduleRepo)
	leaderboardHandler := handler.NewLeaderboardHandler(leaderboardSvc)
	moduleHandler      := handler.NewModuleHandler(moduleSvc)

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

	// Prometheus metrics scraping endpoint
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Wire all route groups
	handler.RegisterRoutes(r, authHandler, problemHandler, submissionHandler, adminHandler, leaderboardHandler, moduleHandler, cfg.JWTSecret)


	// ── Step 5: Start HTTP Server ────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("[api-gateway] Starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("[api-gateway] Server failed: %v", err)
	}
}
