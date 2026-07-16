// Package handler implements HTTP endpoints for the admin domain.
// All endpoints under /api/v1/admin require both authentication and admin role.
package handler

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/service"
	"github.com/ai-online-judge/pkg/models"
)

// AdminHandler handles HTTP requests for admin management.
type AdminHandler struct {
	adminService service.AdminService
}

// NewAdminHandler constructs an AdminHandler.
func NewAdminHandler(adminService service.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

// ListUsers handles GET /api/v1/admin/users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	users, err := h.adminService.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// DeleteUser handles DELETE /api/v1/admin/users/:id
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
		return
	}

	if err := h.adminService.DeleteUser(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user and associated submissions deleted"})
}

// DeleteSubmission handles DELETE /api/v1/admin/submissions/:id
func (h *AdminHandler) DeleteSubmission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission ID format"})
		return
	}

	if err := h.adminService.DeleteSubmission(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "submission deleted"})
}

type createProblemRequest struct {
	Title          string            `json:"title" binding:"required"`
	Description    string            `json:"description" binding:"required"`
	Difficulty     string            `json:"difficulty"`
	TimeLimit      int               `json:"time_limit_ms"`
	MemoryLimit    int               `json:"memory_limit_kb"`
	Tags           []string          `json:"tags"`
	Stdin          string            `json:"stdin"`
	ExpectedOutput string            `json:"expected_output"`
	TestCases      []models.TestCase `json:"test_cases"`
}

// CreateProblem handles POST /api/v1/admin/problems
func (h *AdminHandler) CreateProblem(c *gin.Context) {
	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.adminService.CreateProblem(
		c.Request.Context(),
		req.Title, req.Description, req.Difficulty,
		req.TimeLimit, req.MemoryLimit, req.Tags,
		req.Stdin, req.ExpectedOutput, req.TestCases,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"problem": p})
}

// UpdateProblem handles PUT /api/v1/admin/problems/:id
func (h *AdminHandler) UpdateProblem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem ID format"})
		return
	}

	var req createProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.adminService.UpdateProblem(
		c.Request.Context(), id,
		req.Title, req.Description, req.Difficulty,
		req.TimeLimit, req.MemoryLimit, req.Tags,
		req.Stdin, req.ExpectedOutput,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"problem": p})
}

// DeleteProblem handles DELETE /api/v1/admin/problems/:id
func (h *AdminHandler) DeleteProblem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem ID format"})
		return
	}

	if err := h.adminService.DeleteProblem(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "problem and associated test cases deleted"})
}

// GenerateTestCases handles POST /api/v1/admin/generate-tests and /api/v1/admin/problems/generate-tests
// Reverse-proxies request to Python AI Tutor service to generate 9 ranked test cases using GPT-4o.
func (h *AdminHandler) GenerateTestCases(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request payload"})
		return
	}

	respBody, err := h.adminService.GenerateTestCases(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "application/json", respBody)
}

// CheckSubmissionSimilarity handles GET /api/v1/admin/submissions/similarity?problem_id=XYZ
// Queries all Accepted submissions for the given problem and cross-references their AST snapshots.
func (h *AdminHandler) CheckSubmissionSimilarity(c *gin.Context) {
	problemIDStr := c.Query("problem_id")
	if problemIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_id query parameter is required"})
		return
	}
	problemID, err := uuid.Parse(problemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem_id format"})
		return
	}

	pairs, err := h.adminService.CheckSubmissionSimilarity(c.Request.Context(), problemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"pairs": pairs})
}
