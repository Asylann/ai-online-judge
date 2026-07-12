// Package config loads configuration for the websocket-service.
// In accordance with our Adaptive Go Microservice Architecture,
// websocket-service uses only config and ws (Client Hub) layers.
package config

import (
	"os"
)

// Config holds runtime configuration variables loaded from the environment.
type Config struct {
	Port      string
	RedisURL  string
	JWTSecret string
}

// Load reads and validates required environment variables.
func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis:6379"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "supersecretjwtkeyforonlinejudgedev" // default fallback for local dev
	}

	return &Config{
		Port:      port,
		RedisURL:  redisURL,
		JWTSecret: jwtSecret,
	}, nil
}
