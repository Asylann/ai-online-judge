package service

import (
	"context"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/models"
)

// LeaderboardService orchestrates ranking retrieval and score updates.
type LeaderboardService interface {
	GetTopUsers(ctx context.Context, limit int) ([]models.LeaderboardEntry, error)
	UpdateScore(ctx context.Context, userID string, score int) error
}

type leaderboardService struct {
	repo repository.LeaderboardRepository
}

// NewLeaderboardService constructs a new LeaderboardService.
func NewLeaderboardService(repo repository.LeaderboardRepository) LeaderboardService {
	return &leaderboardService{repo: repo}
}

func (s *leaderboardService) GetTopUsers(ctx context.Context, limit int) ([]models.LeaderboardEntry, error) {
	return s.repo.GetTopUsers(ctx, limit)
}

func (s *leaderboardService) UpdateScore(ctx context.Context, userID string, score int) error {
	return s.repo.UpdateScore(ctx, userID, score)
}
