// Package handler implements the HTTP layer for auth endpoints.
// Responsibilities: parse JSON, validate input, call service layer, write HTTP response.
// This package must NEVER contain business logic or SQL queries.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-online-judge/api-gateway/internal/service"
)

// AuthHandler holds injected service dependencies for auth routes.
type AuthHandler struct {
	authSvc service.AuthService
}

// NewAuthHandler constructs an AuthHandler. Called from main.go (DI root).
func NewAuthHandler(authSvc service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

// registerRequest is the JSON body for POST /api/v1/auth/register.
type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// Register handles POST /api/v1/auth/register
// Creates a new student account. Returns 201 with user data on success.
//
//	@Summary     Register a new user
//	@Tags        auth
//	@Accept      json
//	@Produce     json
//	@Param       body body registerRequest true "Registration payload"
//	@Success     201  {object} models.User
//	@Failure     400  {object} gin.H
//	@Router      /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, token, err := h.authSvc.Register(c.Request.Context(), req.Username, req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  user,
	})
}

// loginRequest is the JSON body for POST /api/v1/auth/login.
type loginRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password" binding:"required"`
}

// Login handles POST /api/v1/auth/login
// Validates credentials against email or username and returns a signed JWT token and user profile.
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	identifier := req.Email
	if identifier == "" {
		identifier = req.Username
	}
	if identifier == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "either email or username is required"})
		return
	}

	user, token, err := h.authSvc.Login(c.Request.Context(), identifier, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}
