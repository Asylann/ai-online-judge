// Package handler implements the HTTP layer for the ast-service.
// Responsibilities: parse JSON, validate input, trigger service layer asynchronously,
// write HTTP response. This package must NEVER contain AST business logic.
//
// The ast-service exposes a single endpoint:
//   POST /api/analyze — called by judge-worker when verdict == "WA" (Wrong Answer)
//   Returns 202 Accepted immediately; analysis runs asynchronously in a goroutine.
package handler

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"

	"github.com/ai-online-judge/ast-service/internal/service"
)

// ASTHandler handles HTTP routes for the AST analysis endpoint.
type ASTHandler struct {
	astSvc service.ASTService
}

// NewASTHandler constructs an ASTHandler. Called from main.go (DI root).
func NewASTHandler(astSvc service.ASTService) *ASTHandler {
	return &ASTHandler{astSvc: astSvc}
}

// RegisterRoutes registers endpoints on the Gin engine.
func (h *ASTHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/health", h.HealthCheck)
	r.POST("/api/analyze", h.Analyze)
}

// HealthCheck returns 200 OK — used by Docker health checks and Kubernetes liveness probes.
//
//	@Summary     Service health check
//	@Tags        health
//	@Produce     json
//	@Success     200 {object} gin.H
//	@Router      /health [get]
func (h *ASTHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "ast-service",
	})
}

// analyzeRequest is the JSON body for POST /api/analyze.
// Sent by the judge-worker after receiving a "WA" verdict from the Judge0 sandbox.
type analyzeRequest struct {
	SubmissionID string `json:"submission_id" binding:"required"`
}

// Analyze handles POST /api/analyze.
//
// Flow:
//  1. Parse analyzeRequest JSON (contains submission_id)
//  2. Launch service.Analyze in a goroutine (fire-and-forget from HTTP perspective)
//  3. Return HTTP 202 Accepted immediately — analysis is asynchronous
//
// The async model is intentional: the judge-worker does NOT block waiting for
// AST analysis to complete. The verdict is already persisted; the AST metrics
// and AI Tutor hint arrive as a second async enrichment of the EDM record.
//
//	@Summary     Trigger AST structural deviation analysis
//	@Tags        ast
//	@Accept      json
//	@Produce     json
//	@Param       body body analyzeRequest true "Submission to analyze"
//	@Success     202  {object} gin.H{"message": string, "submission_id": string}
//	@Failure     400  {object} gin.H
//	@Router      /api/analyze [post]
func (h *ASTHandler) Analyze(c *gin.Context) {
	var req analyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submissionID, err := uuid.Parse(req.SubmissionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission_id — must be a UUID"})
		return
	}

	parentCtx := otel.GetTextMapPropagator().Extract(c.Request.Context(), propagation.HeaderCarrier(c.Request.Header))
	tracer := otel.Tracer("ast-service")
	reqCtx, span := tracer.Start(parentCtx, "POST /api/analyze")
	defer span.End()

	spanCtx := trace.SpanContextFromContext(reqCtx)

	// Fire the Educational Data Mining (EDM) analysis pipeline asynchronously.
	// The goroutine:
	//   1. Fetches code_base64 from PostgreSQL
	//   2. Decodes Base64 → parses with gotreesitter
	//   3. Detects structural deviations vs canonical solution patterns
	//   4. Persists ast_complexity_score + ast_snapshot (JSONB) to submissions table
	//   5. Notifies AI Tutor (Virtual TA) for Socratic hint generation
	go func() {
		// Preserve trace context while avoiding cancellation when the 202 response is sent.
		bgCtx := trace.ContextWithSpanContext(context.Background(), spanCtx)
		ctx, cancel := context.WithTimeout(bgCtx, 30*time.Second)
		defer cancel()

		ctx, asyncSpan := tracer.Start(ctx, "Analyze_Submission")
		defer asyncSpan.End()

		if err := h.astSvc.Analyze(ctx, submissionID); err != nil {
			log.Printf("[ast-service] Analyze goroutine error for submission %s: %v", submissionID, err)
		}
	}()

	// Return 202 immediately — do not block on analysis completion
	c.JSON(http.StatusAccepted, gin.H{
		"message":       "AST analysis queued",
		"submission_id": submissionID.String(),
	})
}

// RegisterRoutes wires the ASTHandler to its Gin route group.
// Called once from main.go after all handlers are constructed via DI.
func RegisterRoutes(r *gin.Engine, astH *ASTHandler) {
	api := r.Group("/api")
	{
		// POST /api/analyze — triggered by judge-worker on "WA" verdict
		api.POST("/analyze", astH.Analyze)
	}
}
