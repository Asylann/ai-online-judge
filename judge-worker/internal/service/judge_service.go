// Package service implements the core judging logic for the judge-worker.
// In AOJ terminology this layer orchestrates the Launcher (compilation setup),
// Executor (sandbox run), and Judge (verdict comparison) via the Judge0 REST API.
//
// This package must NEVER import gin, amqp, or any transport layer.
// Transport concerns live in /consumer — this layer only handles business logic.
package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/ai-online-judge/judge-worker/internal/repository"
	"github.com/ai-online-judge/pkg/models"
)

// judge0LanguageIDs maps our canonical language identifiers to Judge0's numeric language IDs.
// Full list: https://github.com/judge0/judge0/blob/master/docs/api/languages.md
var judge0LanguageIDs = map[string]int{
	"cpp":     54, // C++ (GCC 9.2.0)
	"c":       50, // C (GCC 9.2.0)
	"python3": 71, // Python (3.8.1)
	"go":      60, // Go (1.13.5)
	"java":    62, // Java (OpenJDK 13.0.1)
	"js":      63, // JavaScript (Node.js 12.14.0)
	"rust":    73, // Rust (1.40.0)
}

// judge0Submission is the request body sent to POST /submissions on the Judge0 API.
// source_code must be Base64 encoded — Judge0 expects encoded input by default.
type judge0Submission struct {
	SourceCode     string  `json:"source_code"`     // Base64-encoded source
	LanguageID     int     `json:"language_id"`
	Stdin          string  `json:"stdin"`           // Base64-encoded test input
	ExpectedOutput string  `json:"expected_output"` // Base64-encoded expected test output
	CPUTimeLimit   float64 `json:"cpu_time_limit"`  // seconds
	MemoryLimit    int     `json:"memory_limit"`    // kilobytes
}

// judge0Result is the response from GET /submissions/:token on the Judge0 API.
// Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=WA, 5=TLE, 6=CE, etc.
type judge0Result struct {
	Token  string `json:"token"`
	Status struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
	Stdout        string `json:"stdout"`
	Stderr        string `json:"stderr"`
	CompileOutput string `json:"compile_output"`
	Time          string `json:"time"`   // CPU time in seconds as string, e.g. "0.042"
	Memory        int    `json:"memory"` // Peak memory in KB
}

// judge0StatusToVerdict maps Judge0 status IDs to our canonical verdict strings.
// Aligned with the submissions.status field in deployments/init.sql.
var judge0StatusToVerdict = map[int]string{
	3:  "Accepted",
	4:  "WA",  // Wrong Answer
	5:  "TLE", // Time Limit Exceeded
	6:  "CE",  // Compilation Error
	7:  "RE",  // Runtime Error (SIGSEGV)
	8:  "RE",  // Runtime Error (SIGXFSZ)
	9:  "RE",  // Runtime Error (SIGFPE)
	10: "RE",  // Runtime Error (SIGABRT)
	11: "RE",  // Runtime Error (NZEC)
	12: "RE",  // Runtime Error (other)
	13: "RE",  // Internal Error
	14: "MLE", // Memory Limit Exceeded
}

// verdictEvent is the JSON payload published to Redis Pub/Sub after every execution.
// The websocket-service subscribes to "submissions.events.<user_id>" and forwards
// this payload to the student's browser in real time (Phase 7).
type verdictEvent struct {
	Type            string `json:"type"`
	SubmissionID    string `json:"submission_id"`
	UserID          string `json:"user_id"`
	Status          string `json:"status"`
	TestsPassed     int    `json:"tests_passed"`
	TestsTotal      int    `json:"tests_total"`
	ExecutionTimeMs int    `json:"execution_time_ms"`
	MemoryKB        int    `json:"memory_kb"`
}

// analyzeRequest is the JSON body sent to ast-service POST /api/analyze.
// Triggered asynchronously after every finalized verdict for EDM metric computation.
type analyzeRequest struct {
	SubmissionID string `json:"submission_id"`
}

// JudgeService is the core Executor in AOJ terminology.
// It orchestrates: Base64 decode → fetch test cases → Judge0 loop → persist EDM metrics
// → publish Redis event → trigger AST Service for structural deviation analysis.
type JudgeService interface {
	// Execute sends a task to the Judge0 sandbox and persists the result.
	// This is the main entry point called by the AMQP consumer for each message.
	Execute(ctx context.Context, task models.JudgeTask) error
}

type judgeService struct {
	repo         repository.SubmissionRepository
	tcRepo       repository.TestCaseRepository // fetches ranked test cases from PostgreSQL
	judge0URL    string
	astServiceURL string // POST /api/analyze — triggered after execution for EDM
	rdb          *redis.Client
	httpClient   *http.Client
}

// NewJudgeService constructs a JudgeService. Called from main.go (DI root).
func NewJudgeService(
	repo repository.SubmissionRepository,
	tcRepo repository.TestCaseRepository,
	judge0URL string,
	astServiceURL string,
	rdb *redis.Client,
) JudgeService {
	return &judgeService{
		repo:         repo,
		tcRepo:       tcRepo,
		judge0URL:    judge0URL,
		astServiceURL: astServiceURL,
		rdb:          rdb,
		httpClient: &http.Client{
			Timeout: 30 * time.Second, // overall HTTP timeout — must exceed max CPU time limit
		},
	}
}

// Execute is the multi-test Executor pipeline:
//  1. Map language → Judge0 language ID
//  2. Fetch all ranked test cases from PostgreSQL for this problem
//  3. Loop: submit each test case to Judge0, poll for result
//     - Stop immediately on Compilation Error (CE) — affects all tests
//     - Continue through non-CE failures to get the full score (e.g., 8/10)
//  4. Capture the first failing test case stdin/expected for Virtual TA context
//  5. Persist verdict + tests_passed + tests_total + effort_based_metrics to PostgreSQL
//  6. Publish verdict event to Redis Pub/Sub → websocket-service notifies student browser
//  7. Trigger AST Service for gotreesitter structural complexity + EDM metrics
func (s *judgeService) Execute(ctx context.Context, task models.JudgeTask) error {
	// Step 1: Resolve Judge0 language ID
	langID, ok := judge0LanguageIDs[task.Language]
	if !ok {
		s.failSubmission(ctx, task, "RE", fmt.Sprintf("unsupported language: %s", task.Language))
		return fmt.Errorf("judge_service.Execute: unsupported language %q", task.Language)
	}

	// Step 2: Fetch all ranked test cases for this problem
	testCases, err := s.tcRepo.GetTestCasesForProblem(ctx, task.ProblemID)
	if err != nil {
		s.failSubmission(ctx, task, "RE", fmt.Sprintf("fetch test cases: %v", err))
		return fmt.Errorf("judge_service.Execute: fetch test cases: %w", err)
	}
	log.Printf("[judge-worker] Executor: submission %s — running %d test cases for problem %s",
		task.SubmissionID, len(testCases), task.ProblemID)

	// Step 3: Run each test case sequentially through the Judge0 sandbox
	passed := 0
	total := len(testCases)
	finalVerdict := "Accepted"
	failedStdin := ""
	failedExpected := ""
	var maxExecTimeMs int
	var maxMemoryKB int

	for _, tc := range testCases {
		// Base64-encode this test case's stdin and expected_output for Judge0
		stdinB64 := base64.StdEncoding.EncodeToString([]byte(tc.Stdin))
		expectedB64 := base64.StdEncoding.EncodeToString([]byte(tc.ExpectedOutput))

		// Build a per-test JudgeTask with this test case's stdin/expected
		testTask := models.JudgeTask{
			SubmissionID: task.SubmissionID,
			UserID:       task.UserID,
			ProblemID:    task.ProblemID,
			CodeBase64:   task.CodeBase64,
			Language:     task.Language,
			TimeLimit:    task.TimeLimit,
			MemoryLimit:  task.MemoryLimit,
		}
		// Temporarily embed test case data for submitToJudge0 helper
		token, err := s.submitToJudge0WithTestCase(ctx, testTask, langID, stdinB64, expectedB64)
		if err != nil {
			log.Printf("[judge-worker] Executor: test rank %d submit error: %v", tc.DifficultyRank, err)
			finalVerdict = "RE"
			if failedStdin == "" {
				failedStdin = tc.Stdin
				failedExpected = tc.ExpectedOutput
			}
			break
		}

		result, err := s.pollResult(ctx, token)
		if err != nil {
			log.Printf("[judge-worker] Executor: test rank %d poll error: %v", tc.DifficultyRank, err)
			finalVerdict = "RE"
			if failedStdin == "" {
				failedStdin = tc.Stdin
				failedExpected = tc.ExpectedOutput
			}
			break
		}

		// Parse execution metrics — track the maximum across all test cases
		var execTimeMs int
		if result.Time != "" {
			var secs float64
			fmt.Sscanf(result.Time, "%f", &secs)
			execTimeMs = int(secs * 1000)
		}
		if execTimeMs > maxExecTimeMs {
			maxExecTimeMs = execTimeMs
		}
		if result.Memory > maxMemoryKB {
			maxMemoryKB = result.Memory
		}

		verdict, vok := judge0StatusToVerdict[result.Status.ID]
		if !vok {
			verdict = "RE"
		}

		log.Printf("[judge-worker] Executor: submission %s test rank %d → %s (time=%dms, mem=%dKB)",
			task.SubmissionID, tc.DifficultyRank, verdict, execTimeMs, result.Memory)

		if verdict == "Accepted" {
			passed++
		} else {
			// Capture the first failing test case for Virtual TA context
			if failedStdin == "" {
				failedStdin = tc.Stdin
				failedExpected = tc.ExpectedOutput
			}
			// Record the most severe non-Accepted verdict (CE > TLE/MLE > WA > RE)
			if shouldUpgradeVerdict(finalVerdict, verdict) {
				finalVerdict = verdict
			}
			// Stop immediately on Compilation Error — all tests would fail
			if verdict == "CE" {
				log.Printf("[judge-worker] Executor: CE detected on test rank %d — stopping early", tc.DifficultyRank)
				break
			}
		}
	}

	// If all tests passed, ensure Accepted
	if passed == total {
		finalVerdict = "Accepted"
		failedStdin = ""
		failedExpected = ""
	}

	log.Printf("[judge-worker] Executor: submission %s → final verdict=%s, score=%d/%d",
		task.SubmissionID, finalVerdict, passed, total)

	// Step 5: Persist verdict + effort_based_metrics to PostgreSQL
	if err := s.repo.UpdateVerdict(ctx, repository.VerdictUpdate{
		SubmissionID:             task.SubmissionID,
		Status:                   finalVerdict,
		TestsPassed:              passed,
		TestsTotal:               total,
		FailedTestStdin:          failedStdin,
		FailedTestExpectedOutput: failedExpected,
		ExecutionTimeMs:          maxExecTimeMs,
		MemoryKB:                 maxMemoryKB,
	}); err != nil {
		return fmt.Errorf("judge_service.Execute: persist verdict: %w", err)
	}

	// Step 6: Publish verdict event to Redis Pub/Sub
	s.publishVerdictEvent(ctx, task.SubmissionID, task.UserID, finalVerdict, passed, total, maxExecTimeMs, maxMemoryKB)

	// Step 7: Trigger AST Service for gotreesitter complexity + EDM metrics
	if finalVerdict != "Pending" && finalVerdict != "In Queue" && finalVerdict != "Processing" {
		go s.triggerASTAnalysis(task.SubmissionID)
	}

	return nil
}

// shouldUpgradeVerdict returns true if newVerdict is "worse" (more severe) than current.
// Priority: CE > TLE > MLE > RE > WA > Accepted.
func shouldUpgradeVerdict(current, next string) bool {
	priority := map[string]int{
		"Accepted": 0, "WA": 1, "RE": 2, "MLE": 3, "TLE": 4, "CE": 5,
	}
	return priority[next] > priority[current]
}

// publishVerdictEvent publishes the judge result to Redis Pub/Sub.
// The channel name is "submissions.events.<user_id>" so the websocket-service
// can route it to the specific student's WebSocket connection.
// Errors here are non-fatal — the AMQP ACK proceeds even if Redis is temporarily down.
func (s *judgeService) publishVerdictEvent(
	ctx context.Context,
	submissionID uuid.UUID,
	userID uuid.UUID,
	verdict string,
	testsPassed int,
	testsTotal int,
	execTimeMs int,
	memoryKB int,
) {
	event := verdictEvent{
		Type:            "verdict",
		SubmissionID:    submissionID.String(),
		UserID:          userID.String(),
		Status:          verdict,
		TestsPassed:     testsPassed,
		TestsTotal:      testsTotal,
		ExecutionTimeMs: execTimeMs,
		MemoryKB:        memoryKB,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		log.Printf("[judge-worker] publishVerdictEvent: marshal error: %v", err)
		return
	}

	channel := fmt.Sprintf("submissions.events.%s", userID.String())
	if err := s.rdb.Publish(ctx, channel, payload).Err(); err != nil {
		log.Printf("[judge-worker] publishVerdictEvent: Redis publish error on channel %s: %v", channel, err)
		return
	}
	log.Printf("[judge-worker] publishVerdictEvent: published to %s", channel)
}

// triggerASTAnalysis fires an async HTTP POST to the AST Service.
// Called in a goroutine so it does not block the AMQP ACK.
//
// The AST Service will:
//  1. Fetch the submission's code_base64 from PostgreSQL
//  2. Decode Base64 → parse with gotreesitter → compute structural complexity
//  3. Detect structural deviations vs canonical solution patterns
//  4. Save ast_complexity_score + ast_snapshot (JSONB) to submissions table (EDM)
//  5. Forward to ai-tutor for Socratic hint generation (Virtual TA pipeline)
func (s *judgeService) triggerASTAnalysis(submissionID uuid.UUID) {
	// Use a fresh background context — the parent ctx may already be cancelled
	// by the time this goroutine executes (e.g., worker shutting down).
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	payload, _ := json.Marshal(analyzeRequest{SubmissionID: submissionID.String()})

	url := fmt.Sprintf("%s/api/analyze", s.astServiceURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		log.Printf("[judge-worker] triggerASTAnalysis: build request error: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		log.Printf("[judge-worker] triggerASTAnalysis: POST to ast-service failed: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[judge-worker] triggerASTAnalysis: ast-service responded %d for submission %s",
		resp.StatusCode, submissionID)
}

// ── Judge0 transport helpers ───────────────────────────────────────────────────

// submitToJudge0WithTestCase posts a single test case to Judge0 and returns the task token.
func (s *judgeService) submitToJudge0WithTestCase(
	ctx context.Context,
	task models.JudgeTask,
	langID int,
	stdinB64 string,
	expectedB64 string,
) (string, error) {
	cpuLimit := float64(task.TimeLimit) / 1000.0
	if cpuLimit <= 0 {
		cpuLimit = 2.0 // default 2 seconds if uninitialized
	}
	memLimit := task.MemoryLimit
	if memLimit < 2048 {
		memLimit = 128000 // default 128 MB (Judge0 requires >= 2048 KB)
	}

	payload := judge0Submission{
		SourceCode:     task.CodeBase64, // already Base64-encoded by api-gateway
		LanguageID:     langID,
		Stdin:          stdinB64,
		ExpectedOutput: expectedB64,
		CPUTimeLimit:   cpuLimit,
		MemoryLimit:    memLimit,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	// ?base64_encoded=true tells Judge0 the source_code field is already Base64-encoded
	url := fmt.Sprintf("%s/submissions?base64_encoded=true&wait=false", s.judge0URL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("judge0 returned %d: %s", resp.StatusCode, respBody)
	}

	var result judge0Result
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}
	return result.Token, nil
}

// pollResult repeatedly GETs /submissions/:token until the sandbox finishes.
// Judge0 status IDs 1 (In Queue) and 2 (Processing) mean the Executor is still running.
func (s *judgeService) pollResult(ctx context.Context, token string) (*judge0Result, error) {
	url := fmt.Sprintf("%s/submissions/%s?base64_encoded=true", s.judge0URL, token)

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}

		resp, err := s.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("poll get: %w", err)
		}

		var result judge0Result
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			resp.Body.Close()
			return nil, fmt.Errorf("decode poll response: %w", err)
		}
		resp.Body.Close()

		// Status IDs 1 and 2 mean the Executor is still running inside the isolate sandbox
		if result.Status.ID != 1 && result.Status.ID != 2 {
			return &result, nil
		}

		// Back-off before polling again — avoids hammering Judge0 under load
		time.Sleep(500 * time.Millisecond)
	}
}

// failSubmission is a safety fallback that persists an immediate error status to PostgreSQL and
// publishes a verdict event to Redis Pub/Sub, ensuring the student's browser never hangs indefinitely.
func (s *judgeService) failSubmission(ctx context.Context, task models.JudgeTask, status, reason string) {
	log.Printf("[judge-worker] Executor fallback: failing submission %s (%s): %s", task.SubmissionID, status, reason)
	_ = s.repo.UpdateVerdict(ctx, repository.VerdictUpdate{
		SubmissionID:             task.SubmissionID,
		Status:                   status,
		TestsPassed:              0,
		TestsTotal:               0,
		FailedTestStdin:          reason,
		FailedTestExpectedOutput: "",
		ExecutionTimeMs:          0,
		MemoryKB:                 0,
	})
	s.publishVerdictEvent(ctx, task.SubmissionID, task.UserID, status, 0, 0, 0, 0)
}

