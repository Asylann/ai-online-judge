// Package service implements the admin business logic for the api-gateway.
package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/astparser"
	"github.com/ai-online-judge/pkg/models"
)

// AdminService defines the business logic contract for admin operations.
type AdminService interface {
	ListUsers(ctx context.Context) ([]models.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	DeleteSubmission(ctx context.Context, id uuid.UUID) error
	CreateProblem(ctx context.Context, title, description, difficulty string, timeLimit, memoryLimit int, tags []string, sampleStdin, sampleOutput string, testCases []models.TestCase) (*models.Problem, error)
	UpdateProblem(ctx context.Context, id uuid.UUID, title, description, difficulty string, timeLimit, memoryLimit int, tags []string, sampleStdin, sampleOutput string) (*models.Problem, error)
	DeleteProblem(ctx context.Context, id uuid.UUID) error
	GenerateTestCases(ctx context.Context, payload []byte) ([]byte, error)
	CheckSubmissionSimilarity(ctx context.Context, problemID uuid.UUID) ([]models.SubmissionSimilarityPair, error)
}

type adminService struct {
	adminRepo  repository.AdminRepository
	aiTutorURL string
	httpClient *http.Client
}

// NewAdminService constructs an AdminService with its required dependencies.
func NewAdminService(adminRepo repository.AdminRepository, aiTutorURL string) AdminService {
	return &adminService{
		adminRepo:  adminRepo,
		aiTutorURL: aiTutorURL,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *adminService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.adminRepo.ListUsers(ctx)
}

func (s *adminService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return s.adminRepo.DeleteUser(ctx, id)
}

func (s *adminService) DeleteSubmission(ctx context.Context, id uuid.UUID) error {
	return s.adminRepo.DeleteSubmission(ctx, id)
}

func (s *adminService) CreateProblem(ctx context.Context, title, description, difficulty string, timeLimit, memoryLimit int, tags []string, sampleStdin, sampleOutput string, testCases []models.TestCase) (*models.Problem, error) {
	if title == "" || description == "" {
		return nil, fmt.Errorf("title and description are required")
	}
	if timeLimit <= 0 {
		timeLimit = 2000
	}
	if memoryLimit <= 0 {
		memoryLimit = 128000
	}

	diffScore := 1.5
	if difficulty == "medium" {
		diffScore = 2.5
	} else if difficulty == "hard" {
		diffScore = 4.0
	}

	p := &models.Problem{
		Title:           title,
		Description:     description,
		Difficulty:      difficulty,
		TimeLimit:       timeLimit,
		MemoryLimit:     memoryLimit,
		Tags:            tags,
		ASTComplexity:   diffScore,
		DifficultyScore: diffScore,
		Stdin:           sampleStdin,
		ExpectedOutput:  sampleOutput,
	}

	// Ensure at least sample test case exists if testCases is empty
	if len(testCases) == 0 && (sampleStdin != "" || sampleOutput != "") {
		testCases = append(testCases, models.TestCase{
			Stdin:          sampleStdin,
			ExpectedOutput: sampleOutput,
			DifficultyRank: 1,
			IsSample:       true,
		})
	}

	return s.adminRepo.CreateProblemWithTestCases(ctx, p, testCases)
}

func (s *adminService) UpdateProblem(ctx context.Context, id uuid.UUID, title, description, difficulty string, timeLimit, memoryLimit int, tags []string, sampleStdin, sampleOutput string) (*models.Problem, error) {
	diffScore := 1.5
	if difficulty == "medium" {
		diffScore = 2.5
	} else if difficulty == "hard" {
		diffScore = 4.0
	}

	p := &models.Problem{
		Title:           title,
		Description:     description,
		Difficulty:      difficulty,
		TimeLimit:       timeLimit,
		MemoryLimit:     memoryLimit,
		Tags:            tags,
		ASTComplexity:   diffScore,
		DifficultyScore: diffScore,
		Stdin:           sampleStdin,
		ExpectedOutput:  sampleOutput,
	}
	return s.adminRepo.UpdateProblem(ctx, id, p)
}

func (s *adminService) DeleteProblem(ctx context.Context, id uuid.UUID) error {
	return s.adminRepo.DeleteProblem(ctx, id)
}

func (s *adminService) GenerateTestCases(ctx context.Context, payload []byte) ([]byte, error) {
	targetURL := fmt.Sprintf("%s/api/admin/generate-tests", s.aiTutorURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("create proxy request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ai tutor proxy request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read ai tutor response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("ai tutor error (%d): %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func (s *adminService) CheckSubmissionSimilarity(ctx context.Context, problemID uuid.UUID) ([]models.SubmissionSimilarityPair, error) {
	subs, err := s.adminRepo.GetAcceptedSubmissionsForProblem(ctx, problemID)
	if err != nil {
		return nil, fmt.Errorf("CheckSubmissionSimilarity: fetch submissions: %w", err)
	}

	pairs := make([]models.SubmissionSimilarityPair, 0)
	if len(subs) < 2 {
		return pairs, nil
	}

	// Precompute structural AST bytes/features for all accepted submissions for this problem
	astBytesList := make([][]byte, len(subs))
	decodedCodeList := make([]string, len(subs))
	for i, sub := range subs {
		astBytesList[i] = getOrExtractASTBytes(sub)
		codeBytes, err := base64.StdEncoding.DecodeString(sub.CodeBase64)
		if err != nil {
			decodedCodeList[i] = sub.CodeBase64
		} else {
			decodedCodeList[i] = string(codeBytes)
		}
	}

	// Restrict comparison strictly within this problem_id to prevent O(N^2) global DB scan
	for i := 0; i < len(subs); i++ {
		for j := i + 1; j < len(subs); j++ {
			if subs[i].UserID == subs[j].UserID {
				// Only report similarities across different students
				continue
			}

			score := astparser.CalculateASTSimilarity(astBytesList[i], astBytesList[j])

			// If structural score is > 0.85 (85%), flag as potential logic copying
			if score > 0.85 {
				pairs = append(pairs, models.SubmissionSimilarityPair{
					UserAID:         subs[i].UserID,
					UserAUsername:   subs[i].Username,
					SubmissionAID:   subs[i].ID,
					SubmissionACode: decodedCodeList[i],
					UserBID:         subs[j].UserID,
					UserBUsername:   subs[j].Username,
					SubmissionBID:   subs[j].ID,
					SubmissionBCode: decodedCodeList[j],
					SimilarityScore: math.Round(score*100) / 100, // round to two decimal places
				})
			}
		}
	}

	return pairs, nil
}

// getOrExtractASTBytes returns the AST snapshot if it contains rich structural metrics,
// otherwise extracts structural token frequencies directly from the source code.
func getOrExtractASTBytes(sub models.AcceptedSubmission) []byte {
	if sub.ASTSnapshot != nil && *sub.ASTSnapshot != "" && *sub.ASTSnapshot != "{}" {
		// Check if the snapshot contains actual structural metrics beyond stub defaults
		if strings.Contains(*sub.ASTSnapshot, "for_statement") || strings.Contains(*sub.ASTSnapshot, "if_statement") || strings.Contains(*sub.ASTSnapshot, "binary_expression") {
			return []byte(*sub.ASTSnapshot)
		}
	}

	// Fallback/enrichment: extract structural keyword and operator frequencies from decoded source code
	codeBytes, err := base64.StdEncoding.DecodeString(sub.CodeBase64)
	if err != nil {
		codeBytes = []byte(sub.CodeBase64)
	}
	codeStr := string(codeBytes)

	freqMap := map[string]float64{
		"for_statement":      float64(strings.Count(codeStr, "for ") + strings.Count(codeStr, "for(")),
		"while_statement":    float64(strings.Count(codeStr, "while ") + strings.Count(codeStr, "while(")),
		"if_statement":       float64(strings.Count(codeStr, "if ") + strings.Count(codeStr, "if(")),
		"return_statement":   float64(strings.Count(codeStr, "return ") + strings.Count(codeStr, "return;")),
		"function_definition": float64(strings.Count(codeStr, "def ") + strings.Count(codeStr, "func ") + strings.Count(codeStr, "void ") + strings.Count(codeStr, "int main")),
		"binary_expression":  float64(strings.Count(codeStr, "+") + strings.Count(codeStr, "-") + strings.Count(codeStr, "*") + strings.Count(codeStr, "/") + strings.Count(codeStr, "==") + strings.Count(codeStr, "<=") + strings.Count(codeStr, ">=")),
		"assignment_expression": float64(strings.Count(codeStr, "=") - strings.Count(codeStr, "==")),
		"call_expression":    float64(strings.Count(codeStr, "(") - strings.Count(codeStr, "if(") - strings.Count(codeStr, "for(") - strings.Count(codeStr, "while(")),
	}

	// Estimate max loop depth (n-fold nesting checks)
	loopDepth := 0.0
	if freqMap["for_statement"] > 0 || freqMap["while_statement"] > 0 {
		loopDepth = 1.0
		if strings.Contains(codeStr, "for ") && strings.Count(codeStr, "for ") > 1 {
			// Check if loops are nested via indentation or braces
			lines := strings.Split(codeStr, "\n")
			currDepth := 0
			maxD := 0
			for _, line := range lines {
				trimmed := strings.TrimSpace(line)
				if strings.HasPrefix(trimmed, "for ") || strings.HasPrefix(trimmed, "while ") {
					currDepth++
					if currDepth > maxD {
						maxD = currDepth
					}
				} else if trimmed == "}" || (len(line) > 0 && !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t")) {
					if currDepth > 0 {
						currDepth--
					}
				}
			}
			if maxD > 1 {
				loopDepth = float64(maxD)
			}
		}
	}
	freqMap["max_loop_depth"] = loopDepth

	enrichedJSON, _ := json.Marshal(freqMap)
	return enrichedJSON
}
