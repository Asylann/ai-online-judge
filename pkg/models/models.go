// Package models defines shared structs used across all Go microservices.
// These map directly to the PostgreSQL schema in deployments/init.sql.
package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered student or admin on the platform.
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         string    `json:"role" db:"role"` // "student" | "admin"
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// LeaderboardEntry represents a user's rank and score on the global leaderboard.
type LeaderboardEntry struct {
	Rank     int       `json:"rank"`
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Score    int       `json:"score"`
}

// Problem represents an algorithmic task stored in the system.
type Problem struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	ModuleID        *uuid.UUID `json:"module_id,omitempty" db:"module_id"`
	SequentialOrder int        `json:"sequential_order" db:"sequential_order"`
	Title           string     `json:"title" db:"title"`
	Description     string     `json:"description" db:"description"`
	Difficulty      string     `json:"difficulty" db:"difficulty"` // "easy" | "medium" | "hard"
	TimeLimit       int        `json:"time_limit_ms" db:"time_limit_ms"`
	MemoryLimit     int        `json:"memory_limit_kb" db:"memory_limit_kb"`
	Tags            []string   `json:"tags" db:"tags"`
	ASTComplexity   float64    `json:"ast_complexity_score" db:"ast_complexity_score"`
	DifficultyScore float64    `json:"difficulty_score" db:"difficulty_score"`
	Stdin           string     `json:"stdin" db:"stdin"`             // sample only — shown in UI sidebar
	ExpectedOutput  string     `json:"expected_output" db:"expected_output"` // sample only
	TestCases       []TestCase `json:"test_cases,omitempty" db:"-"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
}

// ProblemWithStatus extends Problem with curriculum progression status (is_locked, is_solved).
type ProblemWithStatus struct {
	Problem
	IsLocked bool `json:"is_locked"`
	IsSolved bool `json:"is_solved"`
}

// Module represents a curriculum learning path or grouping of problems.
type Module struct {
	ID              uuid.UUID           `json:"id" db:"id"`
	Title           string              `json:"title" db:"title"`
	Description     string              `json:"description" db:"description"`
	SequentialOrder int                 `json:"sequential_order" db:"sequential_order"`
	Problems        []ProblemWithStatus `json:"problems" db:"-"`
	CreatedAt       time.Time           `json:"created_at" db:"created_at"`
}

// TestCase is a single ranked test case for a Problem.
// The Executor runs all 10 test cases sequentially (stops early on CE).
// difficulty_rank: 1 = simplest edge case, 10 = most complex/adversarial.
type TestCase struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ProblemID      uuid.UUID `json:"problem_id" db:"problem_id"`
	Stdin          string    `json:"stdin" db:"stdin"`
	ExpectedOutput string    `json:"expected_output" db:"expected_output"`
	DifficultyRank int       `json:"difficulty_rank" db:"difficulty_rank"` // 1–10
	IsSample       bool      `json:"is_sample" db:"is_sample"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// Submission is the core EDM (Educational Data Mining) record.
// Every submission attempt is stored — not just accepted ones.
// This enables effort-based metrics and cognitive_effort_index computation.
type Submission struct {
	ID                       uuid.UUID `json:"id" db:"id"`
	UserID                   uuid.UUID `json:"user_id" db:"user_id"`
	ProblemID                uuid.UUID `json:"problem_id" db:"problem_id"`
	CodeBase64               string    `json:"code_base64" db:"code_base64"` // Always Base64 encoded
	Language                 string    `json:"language" db:"language"`        // e.g., "cpp", "python3", "go"
	Status                   string    `json:"status" db:"status"`            // "Accepted", "WA", "TLE", "CE", "MLE", "RE"
	// Multi-test scoring — breaks binary pass/fail for ZPD alignment
	TestsPassed              int       `json:"tests_passed" db:"tests_passed"`
	TestsTotal               int       `json:"tests_total" db:"tests_total"`
	// Failure context for Virtual TA Socratic hint generation
	FailedTestStdin          *string   `json:"failed_test_stdin" db:"failed_test_stdin"`
	FailedTestExpectedOutput *string   `json:"failed_test_expected_output" db:"failed_test_expected_output"`
	FailedTestActualOutput   *string   `json:"failed_test_actual_output" db:"failed_test_actual_output"`
	ErrorOutput              *string   `json:"error_output" db:"error_output"`
	// effort_based_metrics
	ExecutionTimeMs          *int      `json:"execution_time_ms" db:"execution_time_ms"`
	MemoryKB                 *int      `json:"memory_kb" db:"memory_kb"`
	// EDM / AST fields
	ASTComplexityScore       *float64  `json:"ast_complexity_score" db:"ast_complexity_score"`
	CognitiveEffortIndex     *float64  `json:"cognitive_effort_index" db:"cognitive_effort_index"`
	ASTSnapshot              *string   `json:"ast_snapshot" db:"ast_snapshot"` // JSONB stored as string
	// Virtual TA fields
	AIHintGiven              bool      `json:"ai_hint_given" db:"ai_hint_given"`
	AIHintText               *string   `json:"ai_hint_text" db:"ai_hint_text"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
}

// ASTResult is the output from the ast-service for a given code submission.
type ASTResult struct {
	SubmissionID    uuid.UUID `json:"submission_id"`
	Language        string    `json:"language"`
	ComplexityScore float64   `json:"complexity_score"`
	MaxLoopDepth    int       `json:"max_loop_depth"`
	RecursionUsed   bool      `json:"recursion_used"`
	ErrorPatterns   []string  `json:"error_patterns"`    // Structural anomalies detected
	ASTSnapshotJSON string    `json:"ast_snapshot_json"` // Full tree as JSON
}

// JudgeTask is the message published to RabbitMQ by the API Gateway.
// The Judge Worker consumes this and fetches test cases from PostgreSQL directly,
// then runs each test case against the Judge0 sandbox sequentially.
// Note: Stdin and ExpectedOutput are NOT included here — the worker fetches
// all 10 ranked test cases from the test_cases table by ProblemID.
type JudgeTask struct {
	SubmissionID uuid.UUID `json:"submission_id"`
	UserID       uuid.UUID `json:"user_id"`
	ProblemID    uuid.UUID `json:"problem_id"`
	CodeBase64   string    `json:"code_base64"` // Base64 encoded source
	Language     string    `json:"language"`
	TimeLimit    int       `json:"time_limit_ms"`
	MemoryLimit  int       `json:"memory_limit_kb"`
}

// JudgeResult is the verdict returned by Judge0 and processed by the Judge Worker.
type JudgeResult struct {
	SubmissionID    uuid.UUID `json:"submission_id"`
	Status          string    `json:"status"`
	TestsPassed     int       `json:"tests_passed"`
	TestsTotal      int       `json:"tests_total"`
	ExecutionTimeMs int       `json:"execution_time_ms"`
	MemoryKB        int       `json:"memory_kb"`
	Stdout          string    `json:"stdout"`
	Stderr          string    `json:"stderr"`
	CompileOutput   string    `json:"compile_output"`
}

// SubmissionHistoryItem holds the joined submission + problem title for the student profile & EDM dashboard.
type SubmissionHistoryItem struct {
	ID                   uuid.UUID `json:"id"`
	ProblemID            uuid.UUID `json:"problem_id"`
	ProblemTitle         string    `json:"problem_title"`
	Language             string    `json:"language"`
	Status               string    `json:"status"`
	TestsPassed          int       `json:"tests_passed"`
	TestsTotal           int       `json:"tests_total"`
	ExecutionTimeMs      int       `json:"execution_time_ms"`
	MemoryKB             int       `json:"memory_kb"`
	ASTComplexityScore   float64   `json:"ast_complexity_score"`
	CognitiveEffortIndex float64   `json:"cognitive_effort_index"`
	AIHintText           string    `json:"ai_hint_text"`
	CreatedAt            time.Time `json:"created_at"`
}
