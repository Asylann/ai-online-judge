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
