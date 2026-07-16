// Package repository implements database persistence for the curriculum modules and learning paths.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-online-judge/pkg/models"
)

// ModuleRepository defines persistence for curriculum modules and problem progression.
type ModuleRepository interface {
	ListModules(ctx context.Context) ([]models.Module, error)
	CreateModule(ctx context.Context, title, description string, order int) (*models.Module, error)
	UpdateModule(ctx context.Context, id uuid.UUID, title, description string, order int) (*models.Module, error)
	DeleteModule(ctx context.Context, id uuid.UUID) error
	ReorderModuleProblems(ctx context.Context, moduleID uuid.UUID, problemIDs []uuid.UUID) error
	GetAcceptedProblemIDsByUserID(ctx context.Context, userID uuid.UUID) (map[uuid.UUID]bool, error)
}

type pgModuleRepository struct {
	db *pgxpool.Pool
}

// NewModuleRepository constructs a PostgreSQL-backed ModuleRepository.
func NewModuleRepository(db *pgxpool.Pool) ModuleRepository {
	return &pgModuleRepository{db: db}
}

// ListModules retrieves all curriculum modules ordered sequentially.
func (r *pgModuleRepository) ListModules(ctx context.Context) ([]models.Module, error) {
	query := `
		SELECT id, title, description, sequential_order, created_at
		FROM modules
		ORDER BY sequential_order ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("module_repository.ListModules: %w", err)
	}
	defer rows.Close()

	var modules []models.Module
	for rows.Next() {
		var m models.Module
		if err := rows.Scan(&m.ID, &m.Title, &m.Description, &m.SequentialOrder, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("module_repository.ListModules scan: %w", err)
		}
		modules = append(modules, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return modules, nil
}

// CreateModule inserts a new curriculum module.
func (r *pgModuleRepository) CreateModule(ctx context.Context, title, description string, order int) (*models.Module, error) {
	query := `
		INSERT INTO modules (title, description, sequential_order)
		VALUES ($1, $2, $3)
		RETURNING id, title, description, sequential_order, created_at`
	var m models.Module
	err := r.db.QueryRow(ctx, query, title, description, order).Scan(
		&m.ID, &m.Title, &m.Description, &m.SequentialOrder, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("module_repository.CreateModule: %w", err)
	}
	return &m, nil
}

// UpdateModule updates an existing curriculum module's properties.
func (r *pgModuleRepository) UpdateModule(ctx context.Context, id uuid.UUID, title, description string, order int) (*models.Module, error) {
	query := `
		UPDATE modules
		SET title = $1, description = $2, sequential_order = $3
		WHERE id = $4
		RETURNING id, title, description, sequential_order, created_at`
	var m models.Module
	err := r.db.QueryRow(ctx, query, title, description, order, id).Scan(
		&m.ID, &m.Title, &m.Description, &m.SequentialOrder, &m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("module_repository.UpdateModule: %w", err)
	}
	return &m, nil
}

// ReorderModuleProblems updates the sequential_order of problems assigned to a module according to the provided slice order.
func (r *pgModuleRepository) ReorderModuleProblems(ctx context.Context, moduleID uuid.UUID, problemIDs []uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for idx, pid := range problemIDs {
		if _, err := tx.Exec(ctx, `UPDATE problems SET sequential_order = $1 WHERE id = $2 AND module_id = $3`, idx+1, pid, moduleID); err != nil {
			return fmt.Errorf("update problem order %d: %w", idx, err)
		}
	}
	return tx.Commit(ctx)
}

// DeleteModule deletes a module and un-assigns its problems (sets module_id = NULL).
func (r *pgModuleRepository) DeleteModule(ctx context.Context, id uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE problems SET module_id = NULL WHERE module_id = $1`, id); err != nil {
		return fmt.Errorf("unlink problems: %w", err)
	}
	res, err := tx.Exec(ctx, `DELETE FROM modules WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete module: %w", err)
	}
	if res.RowsAffected() == 0 {
		return fmt.Errorf("module not found")
	}
	return tx.Commit(ctx)
}

// GetAcceptedProblemIDsByUserID returns a set of all problem IDs where the user has an "Accepted" verdict.
func (r *pgModuleRepository) GetAcceptedProblemIDsByUserID(ctx context.Context, userID uuid.UUID) (map[uuid.UUID]bool, error) {
	solved := make(map[uuid.UUID]bool)
	if userID == uuid.Nil {
		return solved, nil
	}

	query := `
		SELECT DISTINCT problem_id
		FROM submissions
		WHERE user_id = $1 AND status = 'Accepted'`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("module_repository.GetAcceptedProblemIDsByUserID: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var pid uuid.UUID
		if err := rows.Scan(&pid); err != nil {
			return nil, fmt.Errorf("module_repository.GetAcceptedProblemIDsByUserID scan: %w", err)
		}
		solved[pid] = true
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return solved, nil
}
