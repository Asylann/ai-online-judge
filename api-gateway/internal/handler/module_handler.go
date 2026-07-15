// Package handler implements HTTP endpoints for curriculum modules and learning path progression.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/service"
)

// ModuleHandler handles HTTP routes for the modules domain.
type ModuleHandler struct {
	moduleSvc service.ModuleService
}

// NewModuleHandler constructs a ModuleHandler. Called from main.go (DI root).
func NewModuleHandler(moduleSvc service.ModuleService) *ModuleHandler {
	return &ModuleHandler{moduleSvc: moduleSvc}
}

// ListModules handles GET /api/v1/modules (plus aliases /api/modules, /modules)
// Returns all modules with nested problems and computed locked progression state.
func (h *ModuleHandler) ListModules(c *gin.Context) {
	var userID uuid.UUID
	if idVal, exists := c.Get(contextKeyUserID); exists {
		if idStr, ok := idVal.(string); ok {
			if id, err := uuid.Parse(idStr); err == nil {
				userID = id
			}
		} else if id, ok := idVal.(uuid.UUID); ok {
			userID = id
		}
	}

	modules, err := h.moduleSvc.ListModulesWithProblems(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve modules and learning paths"})
		return
	}

	c.JSON(http.StatusOK, modules)
}
