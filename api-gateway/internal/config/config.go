// Package config loads all environment variables into a typed Config struct.
// It is the ONLY place in the api-gateway that reads os.Getenv directly.
// All other packages receive config as a function argument — never call os.Getenv elsewhere.
package config

import (
	"fmt"
	"os"
)

// Config holds all runtime configuration for the api-gateway.
// Values are loaded once at startup from environment variables.
type Config struct {
	// Server
	Port string // HTTP listen port (default: 8080)

	// PostgreSQL — primary data store for users, problems, submissions (EDM)
	DatabaseURL string // e.g. postgres://judge:pass@postgres:5432/aionlinejudge

	// Redis — rate limiting + leaderboard cache + WebSocket Pub/Sub
	RedisURL string // e.g. redis:6379

	// RabbitMQ — AMQP broker for judge task queue
	RabbitMQURL string // e.g. amqp://judge:pass@rabbitmq:5672/

	// JWT — HS256 signing secret for stateless auth
	JWTSecret string
}

// Load reads environment variables and returns a validated Config.
// Returns an error if any required variable is missing.
func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnvOrDefault("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		RabbitMQURL: os.Getenv("RABBITMQ_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
