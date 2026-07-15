// Package service implements the problem, submission, and module business logic.
package service

import (
	"context"
	"fmt"
	"sort"

	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/models"
)

// ModuleService defines the contract for curriculum module and progression logic.
type ModuleService interface {
	ListModulesWithProblems(ctx context.Context, userID uuid.UUID) ([]models.Module, error)
}

type moduleService struct {
	moduleRepo  repository.ModuleRepository
	problemRepo repository.ProblemRepository
}

// NewModuleService constructs a ModuleService orchestrator.
func NewModuleService(moduleRepo repository.ModuleRepository, problemRepo repository.ProblemRepository) ModuleService {
	return &moduleService{
		moduleRepo:  moduleRepo,
		problemRepo: problemRepo,
	}
}

// ListModulesWithProblems retrieves curriculum modules with nested problems and backend-enforced lock progression.
// A problem is IsLocked if its immediate predecessor in the curriculum sequential order has not been Accepted by the user.
func (s *moduleService) ListModulesWithProblems(ctx context.Context, userID uuid.UUID) ([]models.Module, error) {
	modules, err := s.moduleRepo.ListModules(ctx)
	if err != nil {
		return nil, fmt.Errorf("module_service.ListModulesWithProblems modules: %w", err)
	}

	problems, err := s.problemRepo.ListProblems(ctx)
	if err != nil {
		return nil, fmt.Errorf("module_service.ListModulesWithProblems problems: %w", err)
	}

	solvedMap, err := s.moduleRepo.GetAcceptedProblemIDsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("module_service.ListModulesWithProblems solvedMap: %w", err)
	}

	// Group problems by module ID
	problemsByModule := make(map[uuid.UUID][]models.Problem)
	for _, p := range problems {
		if p.ModuleID != nil {
			problemsByModule[*p.ModuleID] = append(problemsByModule[*p.ModuleID], p)
		}
	}

	// Sort modules by sequential order ascending
	sort.Slice(modules, func(i, j int) bool {
		return modules[i].SequentialOrder < modules[j].SequentialOrder
	})

	var prevProblemID uuid.UUID
	for i := range modules {
		mProblems := problemsByModule[modules[i].ID]
		// Sort problems inside module by sequential order ascending
		sort.Slice(mProblems, func(a, b int) bool {
			return mProblems[a].SequentialOrder < mProblems[b].SequentialOrder
		})

		var problemsWithStatus []models.ProblemWithStatus
		for _, p := range mProblems {
			isSolved := solvedMap[p.ID]
			isLocked := false

			// If there is a preceding problem in the curriculum progression, this problem is locked unless predecessor is solved
			if prevProblemID != uuid.Nil {
				if !solvedMap[prevProblemID] {
					isLocked = true
				}
			}

			problemsWithStatus = append(problemsWithStatus, models.ProblemWithStatus{
				Problem:  p,
				IsLocked: isLocked,
				IsSolved: isSolved,
			})

			prevProblemID = p.ID
		}
		modules[i].Problems = problemsWithStatus
	}

	return modules, nil
}
