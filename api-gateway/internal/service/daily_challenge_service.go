// Package service — Daily Challenge orchestration.
// Selects and caches a featured problem every 24 hours to drive daily student engagement.
package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/ai-online-judge/api-gateway/internal/repository"
	"github.com/ai-online-judge/pkg/models"
)

const dailyChallengeRedisKey = "daily_challenge_id"

// DailyChallengeService manages the 24-hour ticker and caching of the daily problem.
type DailyChallengeService interface {
	StartDailyTicker(ctx context.Context)
	GetDailyChallengeProblem(ctx context.Context) (*models.Problem, error)
}

type dailyChallengeService struct {
	problemRepo repository.ProblemRepository
	redis       *redis.Client
}

// NewDailyChallengeService constructs a new DailyChallengeService.
func NewDailyChallengeService(problemRepo repository.ProblemRepository, redisClient *redis.Client) DailyChallengeService {
	return &dailyChallengeService{
		problemRepo: problemRepo,
		redis:       redisClient,
	}
}

// StartDailyTicker starts a background goroutine that rotates the daily challenge problem every 24 hours.
// If the cache is empty on boot, it immediately selects and seeds a new challenge.
// Shuts down gracefully when ctx is canceled.
func (s *dailyChallengeService) StartDailyTicker(ctx context.Context) {
	// Check on boot if a challenge is already cached
	val, err := s.redis.Get(ctx, dailyChallengeRedisKey).Result()
	if err != nil || val == "" {
		s.refreshDailyChallenge(ctx)
	}

	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.refreshDailyChallenge(ctx)
			}
		}
	}()
}

func (s *dailyChallengeService) refreshDailyChallenge(ctx context.Context) {
	p, err := s.problemRepo.GetRandomProblem(ctx)
	if err != nil || p == nil {
		return
	}
	s.redis.Set(ctx, dailyChallengeRedisKey, p.ID.String(), 24*time.Hour)
}

// GetDailyChallengeProblem fetches the currently featured daily problem from Redis cache.
// If Redis misses, it falls back to selecting a random problem from PostgreSQL, caches it immediately, and returns it.
func (s *dailyChallengeService) GetDailyChallengeProblem(ctx context.Context) (*models.Problem, error) {
	val, err := s.redis.Get(ctx, dailyChallengeRedisKey).Result()
	if err == nil && val != "" {
		if id, parseErr := uuid.Parse(val); parseErr == nil {
			if p, getErr := s.problemRepo.GetProblemByID(ctx, id); getErr == nil && p != nil {
				return p, nil
			}
		}
	}

	// Fallback if cache missed or GetProblemByID failed
	p, err := s.problemRepo.GetRandomProblem(ctx)
	if err != nil {
		return nil, fmt.Errorf("daily_challenge_service.GetDailyChallengeProblem: %w", err)
	}
	s.redis.Set(ctx, dailyChallengeRedisKey, p.ID.String(), 24*time.Hour)
	return p, nil
}
