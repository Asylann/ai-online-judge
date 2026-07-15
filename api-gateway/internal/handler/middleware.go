// Package handler — JWT auth middleware for the api-gateway.
// RequireAuth validates the Bearer token and injects the user_id into the Gin context.
// All protected route groups must use this middleware before their handler functions.
package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// contextKeyUserID is the Gin context key used to store the authenticated user's UUID.
// Use handler.GetUserID(c) to read it inside downstream handlers.
const contextKeyUserID = "user_id"
const contextKeyRole = "role"

// jwtAuthClaims mirrors the claims produced by auth_service.go.
// Both must stay in sync — any field added to the token must appear here.
type jwtAuthClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// RequireAuth returns a Gin middleware that enforces JWT authentication.
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing Authorization header",
			})
			return
		}

		// Expect "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid Authorization header format — expected 'Bearer <token>'",
			})
			return
		}
		tokenStr := parts[1]

		// Parse and validate token — rejects expired, tampered, or wrong-algorithm tokens
		claims := &jwtAuthClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			// Enforce HMAC signing method to prevent "alg:none" attacks
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return secret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			return
		}

		// Inject authenticated user_id and role into Gin context for use in downstream handlers
		c.Set(contextKeyUserID, claims.UserID)
		c.Set(contextKeyRole, claims.Role)
		c.Next()
	}
}

// RequireAdmin returns a Gin middleware that checks if the JWT claims contain an admin role.
func RequireAdmin(jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		role := c.GetString(contextKeyRole)
		if role == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "missing Authorization header",
				})
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "invalid Authorization header format — expected 'Bearer <token>'",
				})
				return
			}
			tokenStr := parts[1]

			claims := &jwtAuthClaims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, errors.New("unexpected signing method")
				}
				return secret, nil
			})

			if err != nil || !token.Valid {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "invalid or expired token",
				})
				return
			}

			c.Set(contextKeyUserID, claims.UserID)
			c.Set(contextKeyRole, claims.Role)
			role = claims.Role
		}

		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "admin access required",
			})
			return
		}

		c.Next()
	}
}

// GetContextKeyUserID returns the context key used to store the authenticated user_id.
// Call c.GetString(handler.GetContextKeyUserID()) inside any protected handler.
func GetContextKeyUserID() string {
	return contextKeyUserID
}

// GetContextKeyRole returns the context key used to store the authenticated user's role.
func GetContextKeyRole() string {
	return contextKeyRole
}


// OptionalAuth parses the Bearer token if present and sets user_id in the context without aborting on missing/invalid token.
func OptionalAuth(jwtSecret string) gin.HandlerFunc {
	secret := []byte(jwtSecret)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				tokenStr := parts[1]
				claims := &jwtAuthClaims{}
				if token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
					if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
						return nil, errors.New("unexpected signing method")
					}
					return secret, nil
				}); err == nil && token.Valid {
					c.Set(contextKeyUserID, claims.UserID)
					c.Set(contextKeyRole, claims.Role)
				}
			}
		}
		c.Next()
	}
}

// CORSMiddleware enables CORS across localhost and frontend origins.
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
