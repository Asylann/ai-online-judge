// Package handler implements the HTTP layer for problem and submission endpoints.
// Responsibilities: parse JSON/path params, validate input, call service layer, write HTTP response.
// This package must NEVER contain business logic or SQL queries.
package handler

import (
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/api-gateway/internal/service"
)

// ProblemHandler handles HTTP routes for the problems domain.
type ProblemHandler struct {
	problemSvc service.ProblemService
}

// NewProblemHandler constructs a ProblemHandler. Called from main.go (DI root).
func NewProblemHandler(problemSvc service.ProblemService) *ProblemHandler {
	return &ProblemHandler{problemSvc: problemSvc}
}

// ListProblems handles GET /api/v1/problems
// Returns all problems sorted by difficulty_score for ZPD-based CBRS ordering.
//
//	@Summary     List all problems
//	@Tags        problems
//	@Produce     json
//	@Success     200 {array}  models.Problem
//	@Router      /api/v1/problems [get]
func (h *ProblemHandler) ListProblems(c *gin.Context) {
	problems, err := h.problemSvc.ListProblems(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch problems"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"problems": problems, "count": len(problems)})
}

// GetProblem handles GET /api/v1/problems/:id
// Returns a single problem by UUID. Used by the Monaco Editor page.
func (h *ProblemHandler) GetProblem(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem id"})
		return
	}

	problem, err := h.problemSvc.GetProblem(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}
	c.JSON(http.StatusOK, problem)
}

// GetRecommendation handles GET /api/problems/:id/recommendation (and /api/v1/problems/:id/recommendation)
// Computes and returns the next recommended problem within the student's Zone of Proximal Development (ZPD)
// using their cognitive_effort_index (EDM) on the current problem.
func (h *ProblemHandler) GetRecommendation(c *gin.Context) {
	problemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem id"})
		return
	}

	// Extract userID injected by RequireAuth JWT middleware into Gin context
	userIDStr := c.GetString(contextKeyUserID)
	if userIDStr == "" {
		// Fallback for dev environment if token wasn't injected
		userIDStr = "00000000-0000-0000-0000-000000000001"
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id format in context"})
		return
	}

	recommendation, err := h.problemSvc.GetNextRecommendation(c.Request.Context(), userID, problemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate recommendation within ZPD"})
		return
	}

	c.JSON(http.StatusOK, recommendation)
}

// ── Submission Handler ─────────────────────────────────────────────────────────

// SubmissionHandler handles HTTP routes for the submission (EDM) domain.
type SubmissionHandler struct {
	submissionSvc service.SubmissionService
	userRepo      repository.UserRepository // for /users/:id/stats EDM dashboard
}

// NewSubmissionHandler constructs a SubmissionHandler. Called from main.go (DI root).
func NewSubmissionHandler(submissionSvc service.SubmissionService, userRepo repository.UserRepository) *SubmissionHandler {
	return &SubmissionHandler{submissionSvc: submissionSvc, userRepo: userRepo}
}

// submitCodeRequest is the JSON body for POST /api/v1/submissions.
type submitCodeRequest struct {
	ProblemID  string `json:"problem_id" binding:"required"`
	Language   string `json:"language"   binding:"required"` // 'cpp', 'python3', 'go', 'java'
	Code       string `json:"code"`       // Raw source code
	CodeBase64 string `json:"code_base64"`// Base64 source code sent per Critical Rule #1
}

// SubmitCode handles POST /api/v1/submissions
// Receives source code from the Monaco Editor, decodes if Base64, and delegates to SubmissionService
// which ensures it is Base64-encoded, persists, and enqueues to RabbitMQ.
func (h *SubmissionHandler) SubmitCode(c *gin.Context) {
	var req submitCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	problemID, err := uuid.Parse(req.ProblemID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem_id"})
		return
	}

	// Extract userID from JWT claims middleware if present, else fallback for dev/testing
	userIDStr := c.GetString(contextKeyUserID)
	if userIDStr == "" {
		userIDStr = "00000000-0000-0000-0000-000000000001"
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id format in context"})
		return
	}

	rawCode := req.Code
	if rawCode == "" && req.CodeBase64 != "" {
		decoded, err := base64.StdEncoding.DecodeString(req.CodeBase64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 encoding in code_base64"})
			return
		}
		rawCode = string(decoded)
	}
	if rawCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either code or code_base64 must be provided"})
		return
	}

	submission, err := h.submissionSvc.SubmitCode(
		c.Request.Context(), userID, problemID, rawCode, req.Language,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit code"})
		return
	}

	// 202 Accepted — verdict is async via WebSocket / GET /submissions/:id polling
	c.JSON(http.StatusAccepted, gin.H{
		"submission_id": submission.ID,
		"status":        submission.Status,
		"message":       "Submission queued for judging. Connect to WebSocket for real-time verdict.",
	})
}

// GetSubmission handles GET /api/v1/submissions/:id
// Returns the current verdict and all effort_based_metrics for a submission.
func (h *SubmissionHandler) GetSubmission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission id"})
		return
	}

	sub, err := h.submissionSvc.GetSubmission(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "submission not found"})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// GetUserStats handles GET /api/v1/users/:id/stats
// Returns EDM effort_based_metrics for the student dashboard (Recharts visualization).
func (h *SubmissionHandler) GetUserStats(c *gin.Context) {
	userIDStr := c.Param("id")
	if userIDStr == "" || userIDStr == "me" {
		userIDStr = c.GetString(contextKeyUserID)
		if userIDStr == "" {
			userIDStr = "00000000-0000-0000-0000-000000000001"
		}
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	metrics, err := h.userRepo.GetUserEffortMetrics(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch effort metrics"})
		return
	}
	c.JSON(http.StatusOK, metrics)
}

// ListUserSubmissions handles GET /api/v1/users/:id/submissions
// Returns recent submissions for the student's EDM profile dashboard.
func (h *SubmissionHandler) ListUserSubmissions(c *gin.Context) {
	userIDStr := c.Param("id")
	if userIDStr == "" || userIDStr == "me" {
		userIDStr = c.GetString(contextKeyUserID)
		if userIDStr == "" {
			userIDStr = "00000000-0000-0000-0000-000000000001"
		}
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	subs, err := h.submissionSvc.ListSubmissionsByUser(c.Request.Context(), userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user submissions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"submissions": subs, "count": len(subs)})
}

// ListSubmissions handles GET /api/v1/submissions (with optional ?user_id=...)
func (h *SubmissionHandler) ListSubmissions(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		userIDStr = c.GetString(contextKeyUserID)
		if userIDStr == "" {
			userIDStr = "00000000-0000-0000-0000-000000000001"
		}
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id query param"})
		return
	}
	subs, err := h.submissionSvc.ListSubmissionsByUser(c.Request.Context(), userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch submissions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"submissions": subs, "count": len(subs)})
}

// RegisterRoutes wires all handlers to their Gin route groups.
// Called once from main.go after all handlers are constructed via DI.
// jwtSecret is forwarded to RequireAuth middleware — it never touches config directly.
func RegisterRoutes(
	r *gin.Engine,
	authH *AuthHandler,
	problemH *ProblemHandler,
	submissionH *SubmissionHandler,
	jwtSecret string,
) {
	// Register route groups across /api/v1, /api, and root (/) prefixes
	// to ensure compatibility across all frontend API_URL configurations.
	for _, prefix := range []string{"/api/v1/problems", "/api/problems", "/problems"} {
		g := r.Group(prefix)
		g.GET("", problemH.ListProblems)
		g.GET("/:id", problemH.GetProblem)
		g.GET("/:id/recommendation", RequireAuth(jwtSecret), problemH.GetRecommendation)
	}

	// Direct /api/auth and root /auth aliases
	for _, prefix := range []string{"/api/v1/auth", "/api/auth", "/auth"} {
		g := r.Group(prefix)
		g.POST("/register", authH.Register)
		g.POST("/login", authH.Login)
	}

	// Direct /api/submissions and root /submissions aliases — JWT required
	for _, prefix := range []string{"/api/v1/submissions", "/api/submissions", "/submissions"} {
		g := r.Group(prefix)
		g.Use(RequireAuth(jwtSecret))
		g.GET("", submissionH.ListSubmissions)
		g.POST("", submissionH.SubmitCode)
		g.GET("/:id", submissionH.GetSubmission)
	}

	// Direct /api/users and root /users aliases
	for _, prefix := range []string{"/api/v1/users", "/api/users", "/users"} {
		g := r.Group(prefix)
		g.GET("/:id/stats", submissionH.GetUserStats)
		g.GET("/:id/submissions", submissionH.ListUserSubmissions)
	}
}
