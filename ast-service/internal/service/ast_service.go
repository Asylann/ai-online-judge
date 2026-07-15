// Package service implements the AST analysis business logic for the ast-service.
// In Watanobe lab terminology, this layer performs "structural deviation" detection:
// parsing student code into an Abstract Syntax Tree (AST) and computing metrics
// that feed into the Educational Data Mining (EDM) pipeline.
//
// This package must NEVER import gin or any HTTP transport concerns.
// HTTP concerns live in /handler — this layer only handles business logic.
package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"

	"github.com/ai-online-judge/ast-service/internal/repository"
)

// ASTFeatures holds the structured output from gotreesitter analysis.
// These are the Educational Data Mining (EDM) features stored in the submissions
// table and forwarded to the AI Tutor's RAG pipeline for hint generation.
type ASTFeatures struct {
	SubmissionID       uuid.UUID       `json:"submission_id"`
	Language           string          `json:"language"`
	ComplexityScore    float64         `json:"complexity_score"`    // gotreesitter structural complexity
	MaxLoopDepth       int             `json:"max_loop_depth"`      // deepest nested loop — structural deviation signal
	RecursionUsed      bool            `json:"recursion_used"`      // recursion vs iteration pattern
	StructuralDeviation bool           `json:"structural_deviation"` // true if pattern deviates from canonical solution
	ASTSnapshotJSON    string          `json:"ast_snapshot_json"`   // full tree as JSON (ML training corpus)
}

// hintRequest is the payload sent to the Python Virtual TA (ai-tutor).
// The AI Tutor uses this for RAG retrieval + GPT-4o Socratic hint generation.
type hintRequest struct {
	SubmissionID        string      `json:"submission_id"`
	Language            string      `json:"language"`
	ASTFeatures         ASTFeatures `json:"ast_features"`
	StructuralDeviation bool        `json:"structural_deviation"`
}

// ASTService defines the contract for AST analysis business logic.
type ASTService interface {
	// Analyze fetches a submission's code, parses its Abstract Syntax Tree (AST),
	// persists the EDM metrics, and forwards results to the AI Tutor (Virtual TA).
	Analyze(ctx context.Context, submissionID uuid.UUID) error
}

type astService struct {
	repo       repository.SubmissionRepository
	aiTutorURL string
	httpClient *http.Client
}

// NewASTService constructs an ASTService. Called from main.go (DI root).
func NewASTService(repo repository.SubmissionRepository, aiTutorURL string) ASTService {
	return &astService{
		repo:       repo,
		aiTutorURL: aiTutorURL,
		httpClient: &http.Client{Timeout: 15 * time.Second},
	}
}

// Analyze is the full AST pipeline:
//  1. Fetch code_base64 + language from PostgreSQL via repository
//  2. Decode Base64 → raw source code
//  3. Parse with gotreesitter → compute structural complexity + deviation metrics
//  4. Persist ast_complexity_score + ast_snapshot (JSONB) to PostgreSQL (EDM)
//  5. POST ASTFeatures to AI Tutor → triggers Socratic hint generation (Virtual TA)
func (s *astService) Analyze(ctx context.Context, submissionID uuid.UUID) error {
	// Step 1: Fetch submission code from PostgreSQL
	sub, err := s.repo.GetSubmissionCode(ctx, submissionID)
	if err != nil {
		return fmt.Errorf("ast_service.Analyze: fetch submission: %w", err)
	}

	// Step 2: Decode Base64 → raw source code
	// All code is stored as Base64 per Critical Rule #1 (api-gateway encoding).
	sourceBytes, err := base64.StdEncoding.DecodeString(sub.CodeBase64)
	if err != nil {
		return fmt.Errorf("ast_service.Analyze: base64 decode: %w", err)
	}
	sourceCode := string(sourceBytes)

	// Step 3: Parse with gotreesitter to extract Abstract Syntax Tree features.
	//
	// TODO (Phase 4 full implementation): Replace the stub below with the real
	// gotreesitter call via pkg/astparser.ParseCode(sourceCode, sub.Language).
	// gotreesitter is a pure-Go Tree-sitter runtime (no CGO) — it parses the code
	// into a concrete syntax tree in microseconds, enabling:
	//   - Loop depth measurement (structural_deviation signal for iteration patterns)
	//   - Recursion detection (algorithm_tag for CBRS Zone of Proximal Development)
	//   - Complexity scoring (ast_complexity_score stored in submissions EDM table)
	//   - Structural deviation vs canonical solution (triggers AI Tutor hint)
	//
	// Current stub: returns a placeholder complexity score based on code length.
	_ = sourceCode // consumed by gotreesitter in full Phase 4 implementation
	features := computeASTFeatures(submissionID, sub.Language, sourceCode)

	log.Printf("[ast-service] AST parsed for submission %s: complexity=%.2f deviation=%v",
		submissionID, features.ComplexityScore, features.StructuralDeviation)

	// Step 4: Persist EDM metrics to PostgreSQL.
	// ast_complexity_score feeds the CBRS difficulty model (Zone of Proximal Development).
	// ast_snapshot (JSONB) forms the ML training corpus for future Transformer models.
	if err := s.repo.UpdateASTMetrics(ctx, repository.ASTUpdate{
		SubmissionID:       submissionID,
		ASTComplexityScore: features.ComplexityScore,
		ASTSnapshot:        features.ASTSnapshotJSON,
	}); err != nil {
		return fmt.Errorf("ast_service.Analyze: persist metrics: %w", err)
	}

	// Step 5: POST to AI Tutor (Python Virtual TA) for Socratic hint generation.
	// The AI Tutor uses RAG to retrieve similar past structural errors from PostgreSQL,
	// then prompts GPT-4o with the strict "no full solution" system prompt.
	if err := s.notifyAITutor(ctx, sub, features); err != nil {
		// Non-fatal — log and continue. The hint can be re-requested by the frontend.
		log.Printf("[ast-service] notifyAITutor: failed for submission %s: %v", submissionID, err)
	}

	return nil
}

// computeASTFeatures is the gotreesitter parsing stub.
// Phase 4 full implementation replaces this with pkg/astparser.ParseCode().
// The stub produces a deterministic placeholder score based on source length,
// which is sufficient for end-to-end EDM pipeline testing before Phase 4.
func computeASTFeatures(submissionID uuid.UUID, language, sourceCode string) ASTFeatures {
	// Stub: complexity proportional to code length — real impl uses gotreesitter node count
	complexity := float64(len(sourceCode)) / 100.0

	// Build minimal AST snapshot JSON for storage in submissions.ast_snapshot (JSONB)
	snapshot := map[string]interface{}{
		"stub":        true,
		"language":    language,
		"char_count":  len(sourceCode),
		"complexity":  complexity,
		"note":        "Full gotreesitter AST replaces this in Phase 4",
	}
	snapshotJSON, _ := json.Marshal(snapshot)

	return ASTFeatures{
		SubmissionID:        submissionID,
		Language:            language,
		ComplexityScore:     complexity,
		MaxLoopDepth:        0,   // gotreesitter: count nested for/while nodes
		RecursionUsed:       false, // gotreesitter: detect recursive call nodes
		StructuralDeviation: false, // gotreesitter: diff vs canonical solution AST
		ASTSnapshotJSON:     string(snapshotJSON),
	}
}

// notifyAITutor sends the AST analysis results to the Python Virtual TA.
// The AI Tutor (FastAPI + OpenAI GPT-4o) generates a Socratic hint based on:
//   - The structural deviation patterns detected by gotreesitter
//   - Similar past errors retrieved from PostgreSQL via RAG
//   - A strict system prompt that forbids returning the full solution
func (s *astService) notifyAITutor(ctx context.Context, sub *repository.SubmissionCode, features ASTFeatures) error {
	req := hintRequest{
		SubmissionID:        sub.ID.String(),
		Language:            sub.Language,
		ASTFeatures:         features,
		StructuralDeviation: features.StructuralDeviation,
	}

	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	url := fmt.Sprintf("%s/api/hint", s.aiTutorURL)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(httpReq.Header))

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("POST to ai-tutor: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("[ast-service] notifyAITutor: ai-tutor responded %d for submission %s",
		resp.StatusCode, sub.ID)
	return nil
}
