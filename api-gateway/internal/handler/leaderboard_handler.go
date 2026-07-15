package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-online-judge/api-gateway/internal/service"
)

// LeaderboardHandler handles HTTP requests for global student rankings.
type LeaderboardHandler struct {
	svc service.LeaderboardService
}

// NewLeaderboardHandler constructs a new LeaderboardHandler.
func NewLeaderboardHandler(svc service.LeaderboardService) *LeaderboardHandler {
	return &LeaderboardHandler{svc: svc}
}

// GetLeaderboard handles GET /api/v1/leaderboard.
func (h *LeaderboardHandler) GetLeaderboard(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 10
	}

	entries, err := h.svc.GetTopUsers(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"leaderboard": entries,
	})
}
