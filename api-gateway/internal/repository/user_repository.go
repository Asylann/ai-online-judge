// Package repository implements all PostgreSQL queries for the user domain.
// This is the ONLY layer permitted to execute raw SQL against the database.
// The service layer calls this via the UserRepository interface — never pgxpool directly.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-online-judge/pkg/models"
)

// UserRepository defines the persistence contract for user data.
// Depending on interface here (not the concrete struct) enables unit-test mocking.
type UserRepository interface {
	CreateUser(ctx context.Context, username, email, passwordHash string) (*models.User, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByUsername(ctx context.Context, username string) (*models.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	// GetUserEffortMetrics returns EDM aggregates for the student dashboard.
	// Computes: attempt_count, avg_execution_time_ms, cognitive_effort_index.
	GetUserEffortMetrics(ctx context.Context, userID uuid.UUID) (*UserEffortMetrics, error)
}

// UserEffortMetrics holds the effort_based_metrics for the student dashboard.
// Aligned with Watanobe lab EDM vocabulary.
type UserEffortMetrics struct {
	UserID               uuid.UUID `json:"user_id"`
	TotalSubmissions     int       `json:"total_submissions"`
	AcceptedSubmissions  int       `json:"accepted_submissions"`
	AttemptCount         int       `json:"attempt_count"`           // Failed tries before first AC
	AvgExecutionTimeMs   float64   `json:"avg_execution_time_ms"`   // Executor CPU time avg
	AvgMemoryKB          float64   `json:"avg_memory_kb"`
	AvgCognitiveEffort   float64   `json:"cognitive_effort_index"`  // Composite EDM score
	AvgASTComplexity     float64   `json:"avg_ast_complexity"`
	HintsReceived        int       `json:"hints_received"`
	SolvedProblems       int       `json:"solved_problems"`
	TotalProblems        int       `json:"total_problems"`
}

// pgUserRepository is the PostgreSQL-backed implementation of UserRepository.
type pgUserRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository constructs a PostgreSQL-backed UserRepository.
// Called exclusively from main.go during dependency injection.
func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &pgUserRepository{db: db}
}

// CreateUser inserts a new user row with password_hash and role. Passwords must already be bcrypt-hashed
// by the auth service before reaching this layer.
func (r *pgUserRepository) CreateUser(ctx context.Context, username, email, passwordHash string) (*models.User, error) {
	query := `
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, 'student')
		RETURNING id, username, email, password_hash, role, created_at`

	var u models.User
	err := r.db.QueryRow(ctx, query, username, email, passwordHash).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repository.CreateUser: %w", err)
	}
	return &u, nil
}

// GetUserByEmail fetches a user along with password_hash by email.
func (r *pgUserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = $1`

	var u models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repository.GetUserByEmail: %w", err)
	}
	return &u, nil
}

// GetUserByUsername fetches a user along with password_hash by username.
func (r *pgUserRepository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `SELECT id, username, email, password_hash, role, created_at FROM users WHERE username = $1`

	var u models.User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repository.GetUserByUsername: %w", err)
	}
	return &u, nil
}

// GetUserByID fetches a user by their UUID primary key.
func (r *pgUserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `SELECT id, username, email, password_hash, role, created_at FROM users WHERE id = $1`

	var u models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repository.GetUserByID: %w", err)
	}
	return &u, nil
}

// GetUserEffortMetrics computes aggregate EDM metrics for a student's dashboard.
// Joins submissions to surface effort_based_metrics: attempt_count, avg CPU time,
// avg memory, and cognitive_effort_index — aligned with Watanobe lab research.
func (r *pgUserRepository) GetUserEffortMetrics(ctx context.Context, userID uuid.UUID) (*UserEffortMetrics, error) {
	query := `
		SELECT
			COUNT(*)                                                AS total_submissions,
			COUNT(*) FILTER (WHERE status = 'Accepted')            AS accepted_submissions,
			COUNT(*) FILTER (WHERE status != 'Accepted')           AS attempt_count,
			COALESCE(AVG(execution_time_ms), 0)                    AS avg_execution_time_ms,
			COALESCE(AVG(memory_kb), 0)                            AS avg_memory_kb,
			COALESCE(AVG(cognitive_effort_index), 0)               AS cognitive_effort_index,
			COALESCE(AVG(ast_complexity_score), 0)                 AS avg_ast_complexity,
			COUNT(*) FILTER (WHERE ai_hint_given = true OR (ai_hint_text IS NOT NULL AND ai_hint_text != '')) AS hints_received,
			COUNT(DISTINCT problem_id) FILTER (WHERE status = 'Accepted') AS solved_problems,
			(SELECT COUNT(*) FROM problems)                        AS total_problems
		FROM submissions
		WHERE user_id = $1`

	m := &UserEffortMetrics{UserID: userID}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&m.TotalSubmissions,
		&m.AcceptedSubmissions,
		&m.AttemptCount,
		&m.AvgExecutionTimeMs,
		&m.AvgMemoryKB,
		&m.AvgCognitiveEffort,
		&m.AvgASTComplexity,
		&m.HintsReceived,
		&m.SolvedProblems,
		&m.TotalProblems,
	)
	if err != nil {
		return nil, fmt.Errorf("user_repository.GetUserEffortMetrics: %w", err)
	}
	return m, nil
}
