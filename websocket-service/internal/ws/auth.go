// Package ws implements the Client Hub, WebSocket upgrader, and Redis bridge.
// This file provides JWT authentication for WebSocket handshakes via query param (?token=<jwt>).
package ws

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// ParseToken verifies a JWT string and extracts the user_id claim.
// Since WebSocket handshakes initiated by browsers cannot easily pass Authorization headers,
// the token is passed via query string (?token=<jwt>).
func ParseToken(tokenString string, jwtSecret string) (string, error) {
	if tokenString == "" {
		return "", fmt.Errorf("token parameter is required")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Enforce HMAC signing algorithm to prevent alg:none attacks
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token claims structure")
	}

	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("user_id claim missing or invalid")
	}

	return userID, nil
}
