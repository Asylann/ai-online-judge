// ast-service: Static code analysis using gotreesitter (pure Go, no CGO).
//
// Called by the judge-worker when a "Wrong Answer" (WA) verdict is returned.
// Extracts Abstract Syntax Tree (AST) structural features and forwards them
// to the Python Virtual TA (ai-tutor) for Socratic hint generation.
//
// Architecture (Adaptive Go Microservice — HTTP API role):
//   config → connections → repository → service → handler → gin.Engine
//
// This service has NO consumer/ or ws/ layers — it is a pure HTTP API.
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-online-judge/ast-service/internal/config"
	"github.com/ai-online-judge/ast-service/internal/handler"
	"github.com/ai-online-judge/ast-service/internal/repository"
	"github.com/ai-online-judge/ast-service/internal/service"
	"github.com/ai-online-judge/pkg/database"
)

func main() {
	// ── Step 1: Load Configuration ──────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[ast-service] Config error: %v", err)
	}

	// ── Step 2: Establish External Connections ───────────────────────────────────
	ctx := context.Background()

	// PostgreSQL — fetch code_base64 for parsing; write back AST metrics (EDM)
	db, err := database.NewPostgresPool(ctx)
	if err != nil {
		log.Fatalf("[ast-service] PostgreSQL connection failed: %v", err)
	}
	defer db.Close()
	log.Println("[ast-service] PostgreSQL connected")

	// ── Step 3: Dependency Injection (top-down: repo → service → handler) ────────

	// Repository layer — SQL queries: GetSubmissionCode + UpdateASTMetrics
	submissionRepo := repository.NewSubmissionRepository(db)

	// Service layer — Analyze pipeline: gotreesitter parse → EDM persist → AI Tutor notify
	astSvc := service.NewASTService(submissionRepo, cfg.AITutorURL)

	// Handler layer — HTTP: POST /api/analyze → 202 Accepted (async analysis)
	astHandler := handler.NewASTHandler(astSvc)

	// ── Step 4: Configure Gin and Register Routes ────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// Health check — polled by Docker Compose and the Observer daemon
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "ast-service",
		})
	})

	// Register API routes (POST /api/analyze)
	handler.RegisterRoutes(r, astHandler)

	// ── Step 5: Start HTTP Server ────────────────────────────────────────────────
	addr := ":" + cfg.Port
	log.Printf("[ast-service] Starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("[ast-service] Server failed: %v", err)
	}
}
