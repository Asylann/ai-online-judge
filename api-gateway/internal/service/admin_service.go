// Package service implements the admin business logic for the api-gateway.
package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/ai-online-judge/api-gateway/internal/repository"
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
