// Package repository implements the PostgreSQL queries for the ast-service.
// It fetches submission code and writes back parsed AST metrics.
// The service layer calls this via interfaces — never pgxpool directly.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SubmissionCode holds the fields the AST Service needs from the submissions table
// to perform structural analysis.
type SubmissionCode struct {
	ID         uuid.UUID
	CodeBase64 string // Base64-encoded source code (Critical Rule #1)
	Language   string
	UserID     uuid.UUID
	ProblemID  uuid.UUID
}

// ASTUpdate carries the Educational Data Mining (EDM) metrics computed by the
// gotreesitter parser to be persisted back to the submissions table.
type ASTUpdate struct {
	SubmissionID       uuid.UUID
	ASTComplexityScore float64 // gotreesitter structural complexity (CBRS feature)
	ASTSnapshot        string  // Full AST as JSON — stored in JSONB for ML training corpus
}

// SubmissionRepository defines the persistence contract for the ast-service.
// Only the two operations needed by AST analysis are exposed.
type SubmissionRepository interface {
	// GetSubmissionCode fetches the code_base64 and language for a given submission ID.
	// Called at the start of the analysis pipeline to obtain the source to parse.
	GetSubmissionCode(ctx context.Context, id uuid.UUID) (*SubmissionCode, error)

	// UpdateASTMetrics persists the gotreesitter output back to the submissions table.
	// Populates ast_complexity_score and ast_snapshot (JSONB) — EDM fields used by:
	//   - CBRS recommender (difficulty scoring)
	//   - cognitive_effort_index computation
	//   - AI Tutor RAG context (structural deviation hints)
	UpdateASTMetrics(ctx context.Context, update ASTUpdate) error
}

// pgSubmissionRepository is the PostgreSQL-backed implementation.
type pgSubmissionRepository struct {
	db *pgxpool.Pool
}

// NewSubmissionRepository constructs a PostgreSQL-backed SubmissionRepository.
// Called exclusively from main.go during dependency injection.
func NewSubmissionRepository(db *pgxpool.Pool) SubmissionRepository {
	return &pgSubmissionRepository{db: db}
}

// GetSubmissionCode fetches the minimal submission fields needed for AST parsing.
func (r *pgSubmissionRepository) GetSubmissionCode(ctx context.Context, id uuid.UUID) (*SubmissionCode, error) {
	query := `
		SELECT id, code_base64, language, user_id, problem_id
		FROM submissions
		WHERE id = $1`

	var s SubmissionCode
	err := r.db.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.CodeBase64, &s.Language, &s.UserID, &s.ProblemID,
	)
	if err != nil {
		return nil, fmt.Errorf("ast_repository.GetSubmissionCode: %w", err)
	}
	return &s, nil
}

// UpdateASTMetrics writes the gotreesitter analysis results and cognitive_effort_index back to PostgreSQL.
// ast_snapshot is stored as JSONB — it forms the ML training corpus for
// future LSTM/BiLSTM/Transformer models per Watanobe lab research direction.
func (r *pgSubmissionRepository) UpdateASTMetrics(ctx context.Context, update ASTUpdate) error {
	query := `
		UPDATE submissions
		SET
			ast_complexity_score = $2::float8,
			ast_snapshot         = $3::jsonb,
			cognitive_effort_index = COALESCE(NULLIF(cognitive_effort_index, 0), (
				SELECT (COUNT(*) * 1.5) + COALESCE($2::float8, 1.0)
				FROM submissions s2
				WHERE s2.user_id = submissions.user_id AND s2.problem_id = submissions.problem_id
			))
		WHERE id = $1`

	tag, err := r.db.Exec(ctx, query, update.SubmissionID, update.ASTComplexityScore, update.ASTSnapshot)
	if err != nil {
		return fmt.Errorf("ast_repository.UpdateASTMetrics: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("ast_repository.UpdateASTMetrics: no row found for id %s", update.SubmissionID)
	}
	return nil
}
