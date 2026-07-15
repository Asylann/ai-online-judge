// Package repository implements the submission update queries for the judge-worker.
// This is the ONLY layer permitted to execute SQL against PostgreSQL.
// The service layer calls this via the SubmissionRepository interface.
package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-online-judge/pkg/models"
)

// VerdictUpdate carries the fields the Executor writes back after running all test cases.
// Includes multi-test scoring and failure context for the Virtual TA pipeline.
type VerdictUpdate struct {
	SubmissionID             uuid.UUID
	Status                   string  // Accepted | WA | TLE | CE | MLE | RE
	TestsPassed              int     // number of test cases passed
	TestsTotal               int     // total test cases attempted
	FailedTestStdin          string  // stdin of the first failing test case (for Virtual TA context)
	FailedTestExpectedOutput string  // expected output of the first failing test case
	ExecutionTimeMs          int     // CPU time from last test case run (effort_based_metric)
	MemoryKB                 int     // Peak RAM from last test case run (effort_based_metric)
}

// SubmissionRepository defines the persistence contract for the judge-worker.
type SubmissionRepository interface {
	// UpdateVerdict persists the multi-test verdict and effort_based_metrics to PostgreSQL.
	// Called after all test cases complete — all attempts are logged (EDM).
	UpdateVerdict(ctx context.Context, v VerdictUpdate) error

	// HasPriorAcceptedSubmission checks if the user already solved this exact problem previously (status = 'Accepted').
	// Used by Executor to award +10 leaderboard points only on the first solve.
	HasPriorAcceptedSubmission(ctx context.Context, userID, problemID, currentSubmissionID uuid.UUID) (bool, error)
}

// TestCaseRepository defines the contract for fetching ranked test cases.
type TestCaseRepository interface {
	// GetTestCasesForProblem returns all test cases for a problem ordered by difficulty_rank ASC.
	// The Executor runs them sequentially: 1 (easiest) → 10 (hardest).
	GetTestCasesForProblem(ctx context.Context, problemID uuid.UUID) ([]models.TestCase, error)
}

// pgSubmissionRepository is the PostgreSQL-backed implementation.
type pgSubmissionRepository struct {
	db *pgxpool.Pool
}

// pgTestCaseRepository is the PostgreSQL-backed TestCaseRepository.
type pgTestCaseRepository struct {
	db *pgxpool.Pool
}

// NewSubmissionRepository constructs a PostgreSQL-backed SubmissionRepository.
func NewSubmissionRepository(db *pgxpool.Pool) SubmissionRepository {
	return &pgSubmissionRepository{db: db}
}

// NewTestCaseRepository constructs a PostgreSQL-backed TestCaseRepository.
func NewTestCaseRepository(db *pgxpool.Pool) TestCaseRepository {
	return &pgTestCaseRepository{db: db}
}

// UpdateVerdict writes the multi-test Judge0 results back to the submissions table.
// Updates status, tests_passed, tests_total, failed_test context, execution_time_ms, and memory_kb —
// the core effort_based_metrics tracked per the Watanobe lab EDM framework.
func (r *pgSubmissionRepository) UpdateVerdict(ctx context.Context, v VerdictUpdate) error {
	query := `
		UPDATE submissions
		SET
			status                      = $2,
			tests_passed                = $3,
			tests_total                 = $4,
			failed_test_stdin           = NULLIF($5, ''),
			failed_test_expected_output = NULLIF($6, ''),
			execution_time_ms           = $7,
			memory_kb                   = $8
		WHERE id = $1`

	tag, err := r.db.Exec(ctx, query,
		v.SubmissionID,
		v.Status,
		v.TestsPassed,
		v.TestsTotal,
		v.FailedTestStdin,
		v.FailedTestExpectedOutput,
		v.ExecutionTimeMs,
		v.MemoryKB,
	)
	if err != nil {
		return fmt.Errorf("submission_repository.UpdateVerdict: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("submission_repository.UpdateVerdict: no row found for id %s", v.SubmissionID)
	}
	return nil
}

// HasPriorAcceptedSubmission returns true if the user has an existing Accepted submission for this problem other than currentSubmissionID.
func (r *pgSubmissionRepository) HasPriorAcceptedSubmission(ctx context.Context, userID, problemID, currentSubmissionID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM submissions
			WHERE user_id = $1 AND problem_id = $2 AND status = 'Accepted' AND id != $3
		)`
	var exists bool
	err := r.db.QueryRow(ctx, query, userID, problemID, currentSubmissionID).Scan(&exists)
	return exists, err
}

// GetTestCasesForProblem fetches all ranked test cases for a given problem,
// ordered from easiest (rank 1) to hardest (rank 10).
// The Executor runs them in this order, stopping only on Compilation Error.
func (r *pgTestCaseRepository) GetTestCasesForProblem(ctx context.Context, problemID uuid.UUID) ([]models.TestCase, error) {
	query := `
		SELECT id, problem_id, stdin, expected_output, difficulty_rank, is_sample, created_at
		FROM test_cases
		WHERE problem_id = $1
		ORDER BY difficulty_rank ASC`

	rows, err := r.db.Query(ctx, query, problemID)
	if err != nil {
		return nil, fmt.Errorf("test_case_repository.GetTestCasesForProblem: %w", err)
	}
	defer rows.Close()

	var cases []models.TestCase
	for rows.Next() {
		var tc models.TestCase
		if err := rows.Scan(
			&tc.ID, &tc.ProblemID, &tc.Stdin, &tc.ExpectedOutput,
			&tc.DifficultyRank, &tc.IsSample, &tc.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("test_case_repository.GetTestCasesForProblem scan: %w", err)
		}
		cases = append(cases, tc)
	}
	if len(cases) == 0 {
		return nil, fmt.Errorf("test_case_repository.GetTestCasesForProblem: no test cases found for problem %s", problemID)
	}
	return cases, nil
}
