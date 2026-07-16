// Package repository implements all PostgreSQL queries for the problem and submission domains.
// The service layer calls these via interfaces — never pgxpool directly.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-online-judge/pkg/models"
)

// ProblemRepository defines persistence for the problems table.
type ProblemRepository interface {
	ListProblems(ctx context.Context) ([]models.Problem, error)
	GetProblemByID(ctx context.Context, id uuid.UUID) (*models.Problem, error)
	GetRandomProblem(ctx context.Context) (*models.Problem, error)
	GetRecommendationZPD(ctx context.Context, userID uuid.UUID, currentProblemID uuid.UUID) (*models.Problem, error)
}

// SubmissionRepository defines persistence for the submissions (EDM) table.
// Every attempt is stored — not just accepted ones (effort_based_metrics requirement).
type SubmissionRepository interface {
	CreateSubmission(ctx context.Context, sub *models.Submission) (*models.Submission, error)
	GetSubmissionByID(ctx context.Context, id uuid.UUID) (*models.Submission, error)
	ListSubmissionsByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.SubmissionHistoryItem, error)
}

// ── Problem Repository ─────────────────────────────────────────────────────────

type pgProblemRepository struct {
	db *pgxpool.Pool
}

// NewProblemRepository constructs a PostgreSQL-backed ProblemRepository.
func NewProblemRepository(db *pgxpool.Pool) ProblemRepository {
	return &pgProblemRepository{db: db}
}

// ListProblems returns all problems ordered by difficulty_score ascending.
// The CBRS recommender uses difficulty_score to find problems in the student's
// Zone of Proximal Development (ZPD).
func (r *pgProblemRepository) ListProblems(ctx context.Context) ([]models.Problem, error) {
	query := `
		SELECT id, module_id, COALESCE(sequential_order, 1), title, description, COALESCE(stdin, ''), COALESCE(expected_output, ''), difficulty_score, created_at
		FROM problems
		ORDER BY COALESCE(sequential_order, 999) ASC, difficulty_score ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("problem_repository.ListProblems: %w", err)
	}
	defer rows.Close()

	var problems []models.Problem
	for rows.Next() {
		var p models.Problem
		if err := rows.Scan(&p.ID, &p.ModuleID, &p.SequentialOrder, &p.Title, &p.Description, &p.Stdin, &p.ExpectedOutput, &p.ASTComplexity, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("problem_repository.ListProblems scan: %w", err)
		}
		p.DifficultyScore = p.ASTComplexity
		if p.DifficultyScore < 2.0 {
			p.Difficulty = "easy"
		} else if p.DifficultyScore < 3.5 {
			p.Difficulty = "medium"
		} else {
			p.Difficulty = "hard"
		}
		p.TimeLimit = 2000
		p.MemoryLimit = 128000
		problems = append(problems, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range problems {
		if tcs, _ := r.fetchTestCases(ctx, problems[i].ID); tcs != nil {
			problems[i].TestCases = tcs
		}
	}

	return problems, nil
}

func (r *pgProblemRepository) fetchTestCases(ctx context.Context, problemID uuid.UUID) ([]models.TestCase, error) {
	query := `
		SELECT id, problem_id, stdin, expected_output, difficulty_rank, COALESCE(is_sample, false), created_at
		FROM test_cases
		WHERE problem_id = $1
		ORDER BY difficulty_rank ASC`
	rows, err := r.db.Query(ctx, query, problemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tcs []models.TestCase
	for rows.Next() {
		var tc models.TestCase
		if err := rows.Scan(&tc.ID, &tc.ProblemID, &tc.Stdin, &tc.ExpectedOutput, &tc.DifficultyRank, &tc.IsSample, &tc.CreatedAt); err != nil {
			return nil, err
		}
		tcs = append(tcs, tc)
	}
	return tcs, nil
}

// GetProblemByID fetches a single problem by UUID along with its 10 test cases.
func (r *pgProblemRepository) GetProblemByID(ctx context.Context, id uuid.UUID) (*models.Problem, error) {
	query := `
		SELECT id, module_id, COALESCE(sequential_order, 1), title, description, COALESCE(stdin, ''), COALESCE(expected_output, ''), difficulty_score, created_at
		FROM problems
		WHERE id = $1`

	var p models.Problem
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.ModuleID, &p.SequentialOrder, &p.Title, &p.Description, &p.Stdin, &p.ExpectedOutput, &p.ASTComplexity, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("problem_repository.GetProblemByID: %w", err)
	}
	p.DifficultyScore = p.ASTComplexity
	if p.DifficultyScore < 2.0 {
		p.Difficulty = "easy"
	} else if p.DifficultyScore < 3.5 {
		p.Difficulty = "medium"
	} else {
		p.Difficulty = "hard"
	}
	p.TimeLimit = 2000
	p.MemoryLimit = 128000
	if tcs, _ := r.fetchTestCases(ctx, id); tcs != nil {
		p.TestCases = tcs
	}
	return &p, nil
}

// GetRandomProblem fetches a random problem from PostgreSQL for the Daily Challenge.
func (r *pgProblemRepository) GetRandomProblem(ctx context.Context) (*models.Problem, error) {
	query := `
		SELECT id, module_id, COALESCE(sequential_order, 1), title, description, COALESCE(stdin, ''), COALESCE(expected_output, ''), difficulty_score, created_at
		FROM problems
		ORDER BY RANDOM()
		LIMIT 1`

	var p models.Problem
	err := r.db.QueryRow(ctx, query).Scan(
		&p.ID, &p.ModuleID, &p.SequentialOrder, &p.Title, &p.Description, &p.Stdin, &p.ExpectedOutput, &p.ASTComplexity, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("problem_repository.GetRandomProblem: %w", err)
	}
	p.DifficultyScore = p.ASTComplexity
	if p.DifficultyScore < 2.0 {
		p.Difficulty = "easy"
	} else if p.DifficultyScore < 3.5 {
		p.Difficulty = "medium"
	} else {
		p.Difficulty = "hard"
	}
	p.TimeLimit = 2000
	p.MemoryLimit = 128000
	if tcs, _ := r.fetchTestCases(ctx, p.ID); tcs != nil {
		p.TestCases = tcs
	}
	return &p, nil
}

// GetRecommendationZPD computes a Content-Based Recommendation System (CBRS) target inside the
// student's Zone of Proximal Development based on their cognitive_effort_index on the current problem.
func (r *pgProblemRepository) GetRecommendationZPD(ctx context.Context, userID uuid.UUID, currentProblemID uuid.UUID) (*models.Problem, error) {
	var effortIndex float64
	var currentDiff float64

	// 1. Get current problem difficulty
	err := r.db.QueryRow(ctx, "SELECT difficulty_score FROM problems WHERE id = $1", currentProblemID).Scan(&currentDiff)
	if err != nil {
		currentDiff = 1.5
	}

	// 2. Get latest submission cognitive effort index for current problem
	effortQuery := `
		SELECT cognitive_effort_index
		FROM submissions
		WHERE user_id = $1 AND problem_id = $2 AND cognitive_effort_index IS NOT NULL
		ORDER BY created_at DESC
		LIMIT 1`
	err = r.db.QueryRow(ctx, effortQuery, userID, currentProblemID).Scan(&effortIndex)
	if err != nil {
		effortIndex = 2.5 // default baseline effort
	}

	// 3. Recommendation Logic per Watanobe Lab EDM specification:
	// High effort (>= 3.0) -> target slightly lower or similar ast_complexity_score to build confidence.
	// Low effort (< 3.0)  -> target higher ast_complexity_score to challenge within ZPD.
	var targetDiff float64
	if effortIndex >= 3.0 {
		targetDiff = currentDiff - 0.5
	} else {
		targetDiff = currentDiff + 0.8
	}

	// 4. Find unsolved problem closest to target AST complexity score
	recQuery := `
		SELECT id, module_id, COALESCE(sequential_order, 1), title, description, difficulty_score, created_at
		FROM problems
		WHERE id != $1
		  AND id NOT IN (SELECT problem_id FROM submissions WHERE user_id = $2 AND status = 'Accepted')
		ORDER BY ABS(difficulty_score - $3) ASC
		LIMIT 1`

	var p models.Problem
	err = r.db.QueryRow(ctx, recQuery, currentProblemID, userID, targetDiff).Scan(
		&p.ID, &p.ModuleID, &p.SequentialOrder, &p.Title, &p.Description, &p.ASTComplexity, &p.CreatedAt,
	)
	if err != nil {
		// Fallback: if all problems solved or query returned no rows, pick closest other problem
		fallbackQuery := `
			SELECT id, module_id, COALESCE(sequential_order, 1), title, description, difficulty_score, created_at
			FROM problems
			WHERE id != $1
			ORDER BY ABS(difficulty_score - $2) ASC
			LIMIT 1`
		err = r.db.QueryRow(ctx, fallbackQuery, currentProblemID, targetDiff).Scan(
			&p.ID, &p.ModuleID, &p.SequentialOrder, &p.Title, &p.Description, &p.ASTComplexity, &p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("problem_repository.GetRecommendationZPD: %w", err)
		}
	}
	p.DifficultyScore = p.ASTComplexity
	return &p, nil
}

// ── Submission Repository ──────────────────────────────────────────────────────

type pgSubmissionRepository struct {
	db *pgxpool.Pool
}

// NewSubmissionRepository constructs a PostgreSQL-backed SubmissionRepository.
func NewSubmissionRepository(db *pgxpool.Pool) SubmissionRepository {
	return &pgSubmissionRepository{db: db}
}

// CreateSubmission inserts a new submission record with status="Pending".
// EDM fields (execution_time_ms, cognitive_effort_index, ast_snapshot) are NULL
// at this stage — they are populated progressively by the Judge Worker and AST Service.
func (r *pgSubmissionRepository) CreateSubmission(ctx context.Context, sub *models.Submission) (*models.Submission, error) {
	query := `
		INSERT INTO submissions (user_id, problem_id, code_base64, language, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`

	err := r.db.QueryRow(ctx, query,
		sub.UserID, sub.ProblemID, sub.CodeBase64, sub.Language, sub.Status,
	).Scan(&sub.ID, &sub.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("submission_repository.CreateSubmission: %w", err)
	}
	return sub, nil
}

// GetSubmissionByID fetches a submission record including all EDM fields and multi-test score.
func (r *pgSubmissionRepository) GetSubmissionByID(ctx context.Context, id uuid.UUID) (*models.Submission, error) {
	query := `
		SELECT
			id, user_id, problem_id, code_base64, language, status,
			COALESCE(tests_passed, 0), COALESCE(tests_total, 0),
			failed_test_stdin, failed_test_expected_output, failed_test_actual_output, error_output,
			execution_time_ms, memory_kb,
			ast_complexity_score, cognitive_effort_index,
			ai_hint_given, ai_hint_text,
			created_at
		FROM submissions
		WHERE id = $1`

	var s models.Submission
	err := r.db.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.UserID, &s.ProblemID, &s.CodeBase64, &s.Language, &s.Status,
		&s.TestsPassed, &s.TestsTotal,
		&s.FailedTestStdin, &s.FailedTestExpectedOutput, &s.FailedTestActualOutput, &s.ErrorOutput,
		&s.ExecutionTimeMs, &s.MemoryKB,
		&s.ASTComplexityScore, &s.CognitiveEffortIndex,
		&s.AIHintGiven, &s.AIHintText,
		&s.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("submission_repository.GetSubmissionByID: %w", err)
	}
	return &s, nil
}

// ListSubmissionsByUserID fetches all recent submissions for a user joined with problem titles.
// Returns tests_passed/tests_total for the profile EDM dashboard "Tests: X/Y" display.
func (r *pgSubmissionRepository) ListSubmissionsByUserID(ctx context.Context, userID uuid.UUID, limit int) ([]models.SubmissionHistoryItem, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `
		SELECT
			s.id, s.problem_id, COALESCE(p.title, 'Unknown Problem') AS problem_title,
			s.language, s.status,
			COALESCE(s.tests_passed, 0), COALESCE(s.tests_total, 0),
			COALESCE(s.execution_time_ms, 0), COALESCE(s.memory_kb, 0),
			COALESCE(s.ast_complexity_score, 0), COALESCE(s.cognitive_effort_index, 0),
			COALESCE(s.ai_hint_text, ''), s.created_at
		FROM submissions s
		LEFT JOIN problems p ON s.problem_id = p.id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
		LIMIT $2`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("submission_repository.ListSubmissionsByUserID: %w", err)
	}
	defer rows.Close()

	list := make([]models.SubmissionHistoryItem, 0)
	for rows.Next() {
		var item models.SubmissionHistoryItem
		if err := rows.Scan(
			&item.ID, &item.ProblemID, &item.ProblemTitle,
			&item.Language, &item.Status,
			&item.TestsPassed, &item.TestsTotal,
			&item.ExecutionTimeMs, &item.MemoryKB,
			&item.ASTComplexityScore, &item.CognitiveEffortIndex,
			&item.AIHintText, &item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("submission_repository.ListSubmissionsByUserID scan: %w", err)
		}
		list = append(list, item)
	}
	return list, nil
}
