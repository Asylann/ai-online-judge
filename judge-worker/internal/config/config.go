// Package config loads all environment variables for the judge-worker.
// This is the ONLY file in the service that reads os.Getenv.
// All other packages receive *Config as a parameter — never call os.Getenv elsewhere.
package config

import (
	"fmt"
	"os"
)

// Config holds all runtime configuration for the judge-worker.
// Populated once at startup from environment variables (injected by Docker Compose).
type Config struct {
	// DatabaseURL — PostgreSQL DSN for persisting submission verdicts and effort_based_metrics.
	// Written by the Executor after the Judge0 sandbox returns a result.
	DatabaseURL string // e.g. postgres://judge:pass@postgres:5432/aionlinejudge

	// RabbitMQURL — AMQP broker URL. The consumer subscribes to "judge.tasks" queue.
	// ACK/NACK guarantees ensure no submission is lost if the Executor crashes mid-flight.
	RabbitMQURL string // e.g. amqp://judge:pass@rabbitmq:5672/

	// Judge0URL — Base URL of the Judge0 sandbox REST API.
	// Judge0 wraps isolate: Linux namespaces + cgroups v2 + seccomp-bpf.
	// MUST NOT be exposed publicly — only reachable within the Docker bridge network.
	Judge0URL string // e.g. http://judge0:2358

	// RedisURL — for publishing verdict events to the WebSocket service via Pub/Sub.
	// Phase 7 (websocket-service) subscribes to the "verdicts" channel.
	RedisURL string // e.g. redis:6379
	// ASTServiceURL — Base URL of the AST Service.
	// POSTed to asynchronously when a "WA" verdict is received, triggering
	// gotreesitter structural deviation analysis and the AI Tutor hint pipeline.
	ASTServiceURL string // e.g. http://ast-service:8083

}

// Load reads environment variables and returns a validated Config.
// Returns an error if any required variable is missing.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		RabbitMQURL:    os.Getenv("RABBITMQ_URL"),
		Judge0URL:      os.Getenv("JUDGE0_URL"),
		ASTServiceURL:  getEnvOrDefault("AST_SERVICE_URL", "http://ast-service:8083"),
		RedisURL:       getEnvOrDefault("REDIS_URL", "redis:6379"),

	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.RabbitMQURL == "" {
		return nil, fmt.Errorf("RABBITMQ_URL is required")
	}
	if cfg.Judge0URL == "" {
		return nil, fmt.Errorf("JUDGE0_URL is required")
	}

	return cfg, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
