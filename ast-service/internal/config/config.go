// Package config loads all environment variables for the ast-service.
// This is the ONLY file in the service that reads os.Getenv.
// All other packages receive *Config as a parameter — never call os.Getenv elsewhere.
package config

import (
	"fmt"
	"os"
)

// Config holds all runtime configuration for the ast-service.
// Populated once at startup from environment variables (injected by Docker Compose).
type Config struct {
	// Port — HTTP listen port for the Gin server (default: 8083)
	Port string

	// DatabaseURL — PostgreSQL DSN for fetching submission code_base64 and
	// writing back ast_complexity_score + ast_snapshot (JSONB) after parsing.
	DatabaseURL string // e.g. postgres://judge:pass@postgres:5432/aionlinejudge

	// AITutorURL — Base URL of the Python Virtual TA (FastAPI + OpenAI GPT-4o).
	// The AST Service POSTs structural deviation analysis here to trigger
	// Socratic hint generation (Educational Data Mining pipeline).
	AITutorURL string // e.g. http://ai-tutor:8081

	// JaegerEndpoint for OpenTelemetry OTLP HTTP trace exporting
	JaegerEndpoint string
}

// Load reads environment variables and returns a validated Config.
// Returns an error if any required variable is missing.
func Load() (*Config, error) {
	cfg := &Config{
		Port:           getEnvOrDefault("PORT", "8083"),
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		AITutorURL:     os.Getenv("AI_TUTOR_URL"),
		JaegerEndpoint: getEnvOrDefault("JAEGER_ENDPOINT", "jaeger:4318"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.AITutorURL == "" {
		return nil, fmt.Errorf("AI_TUTOR_URL is required")
	}

	return cfg, nil
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
