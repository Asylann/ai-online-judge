// Package repository implements PostgreSQL queries for the admin domain.
// Enables CRUD operations on users, problems, test cases, and submissions.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-online-judge/pkg/models"
)

// AdminRepository defines the contract for admin data access.
type AdminRepository interface {
	ListUsers(ctx context.Context) ([]models.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	DeleteSubmission(ctx context.Context, id uuid.UUID) error
	CreateProblemWithTestCases(ctx context.Context, p *models.Problem, testCases []models.TestCase) (*models.Problem, error)
	UpdateProblem(ctx context.Context, id uuid.UUID, p *models.Problem) (*models.Problem, error)
	DeleteProblem(ctx context.Context, id uuid.UUID) error
	GetAcceptedSubmissionsForProblem(ctx context.Context, problemID uuid.UUID) ([]models.AcceptedSubmission, error)
}

type pgAdminRepository struct {
	db *pgxpool.Pool
}

// NewAdminRepository constructs a PostgreSQL-backed AdminRepository.
func NewAdminRepository(db *pgxpool.Pool) AdminRepository {
	return &pgAdminRepository{db: db}
}

func (r *pgAdminRepository) ListUsers(ctx context.Context) ([]models.User, error) {
	query := `SELECT id, username, email, COALESCE(role, 'student'), created_at FROM users ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("admin_repository.ListUsers query: %w", err)
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("admin_repository.ListUsers scan: %w", err)
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *pgAdminRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete user's submissions first to avoid FK constraint violations
	if _, err := tx.Exec(ctx, `DELETE FROM submissions WHERE user_id = $1`, id); err != nil {
		return fmt.Errorf("delete submissions for user: %w", err)
	}

	res, err := tx.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return tx.Commit(ctx)
}

func (r *pgAdminRepository) DeleteSubmission(ctx context.Context, id uuid.UUID) error {
	res, err := r.db.Exec(ctx, `DELETE FROM submissions WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete submission: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("submission not found")
	}
	return nil
}

func (r *pgAdminRepository) CreateProblemWithTestCases(ctx context.Context, p *models.Problem, testCases []models.TestCase) (*models.Problem, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO problems (title, description, stdin, expected_output, difficulty_score)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`

	err = tx.QueryRow(ctx, query, p.Title, p.Description, p.Stdin, p.ExpectedOutput, p.DifficultyScore).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert problem: %w", err)
	}

	batch := &pgx.Batch{}
	for idx, tc := range testCases {
		rank := tc.DifficultyRank
		if rank <= 0 {
			rank = idx + 1
		}
		batch.Queue(`
			INSERT INTO test_cases (problem_id, stdin, expected_output, difficulty_rank, is_sample)
			VALUES ($1, $2, $3, $4, $5)`,
			p.ID, tc.Stdin, tc.ExpectedOutput, rank, tc.IsSample,
		)
	}

	br := tx.SendBatch(ctx, batch)
	for i := 0; i < len(testCases); i++ {
		if _, err := br.Exec(); err != nil {
			br.Close()
			return nil, fmt.Errorf("insert test case %d: %w", i, err)
		}
	}
	br.Close()

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return p, nil
}

func (r *pgAdminRepository) UpdateProblem(ctx context.Context, id uuid.UUID, p *models.Problem) (*models.Problem, error) {
	query := `
		UPDATE problems
		SET title = $1, description = $2, stdin = $3, expected_output = $4, difficulty_score = $5
		WHERE id = $6
		RETURNING id, title, description, COALESCE(stdin, ''), COALESCE(expected_output, ''), difficulty_score, created_at`

	err := r.db.QueryRow(ctx, query, p.Title, p.Description, p.Stdin, p.ExpectedOutput, p.DifficultyScore, id).Scan(
		&p.ID, &p.Title, &p.Description, &p.Stdin, &p.ExpectedOutput, &p.DifficultyScore, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update problem: %w", err)
	}
	return p, nil
}

func (r *pgAdminRepository) DeleteProblem(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM test_cases WHERE problem_id = $1`, id); err != nil {
		return fmt.Errorf("delete test cases: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM submissions WHERE problem_id = $1`, id); err != nil {
		return fmt.Errorf("delete submissions for problem: %w", err)
	}
	res, err := tx.Exec(ctx, `DELETE FROM problems WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete problem: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("problem not found")
	}
	return tx.Commit(ctx)
}

func (r *pgAdminRepository) GetAcceptedSubmissionsForProblem(ctx context.Context, problemID uuid.UUID) ([]models.AcceptedSubmission, error) {
	query := `
		SELECT s.id, s.user_id, u.username, s.code_base64, s.ast_snapshot::text, s.created_at
		FROM submissions s
		JOIN users u ON s.user_id = u.id
		WHERE s.problem_id = $1 AND s.status = 'Accepted'
		ORDER BY s.created_at DESC`
	rows, err := r.db.Query(ctx, query, problemID)
	if err != nil {
		return nil, fmt.Errorf("GetAcceptedSubmissionsForProblem query: %w", err)
	}
	defer rows.Close()

	subs := make([]models.AcceptedSubmission, 0)
	for rows.Next() {
		var sub models.AcceptedSubmission
		var snap *string
		if err := rows.Scan(&sub.ID, &sub.UserID, &sub.Username, &sub.CodeBase64, &snap, &sub.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetAcceptedSubmissionsForProblem scan: %w", err)
		}
		sub.ASTSnapshot = snap
		subs = append(subs, sub)
	}
	return subs, rows.Err()
}
