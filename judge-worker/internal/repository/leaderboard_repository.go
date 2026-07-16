package repository

import (
	"context"

	"github.com/redis/go-redis/v9"
)

// LeaderboardGlobalKey is the Redis Sorted Set key storing user scores.
const LeaderboardGlobalKey = "leaderboard:global"

// LeaderboardRepository defines the Redis persistence contract for rankings in judge-worker.
type LeaderboardRepository interface {
	UpdateScore(ctx context.Context, userID string, score int) error
}

type redisLeaderboardRepository struct {
	rdb *redis.Client
}

// NewLeaderboardRepository constructs a Redis backed LeaderboardRepository.
func NewLeaderboardRepository(rdb *redis.Client) LeaderboardRepository {
	return &redisLeaderboardRepository{rdb: rdb}
}

// UpdateScore increments a user's score in the global sorted set (O(log(N))).
func (r *redisLeaderboardRepository) UpdateScore(ctx context.Context, userID string, score int) error {
	return r.rdb.ZIncrBy(ctx, LeaderboardGlobalKey, float64(score), userID).Err()
}
