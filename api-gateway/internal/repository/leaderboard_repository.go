package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/ai-online-judge/pkg/models"
)

// LeaderboardGlobalKey is the Redis Sorted Set key storing user scores.
const LeaderboardGlobalKey = "leaderboard:global"

// LeaderboardRepository defines the Redis persistence contract for rankings.
type LeaderboardRepository interface {
	UpdateScore(ctx context.Context, userID string, score int) error
	GetTopUsers(ctx context.Context, limit int) ([]models.LeaderboardEntry, error)
}

type redisLeaderboardRepository struct {
	rdb *redis.Client
	db  *pgxpool.Pool
}

// NewLeaderboardRepository constructs a Redis/PostgreSQL backed LeaderboardRepository.
func NewLeaderboardRepository(rdb *redis.Client, db *pgxpool.Pool) LeaderboardRepository {
	return &redisLeaderboardRepository{rdb: rdb, db: db}
}

// UpdateScore increments a user's score in the global sorted set (O(log(N))).
func (r *redisLeaderboardRepository) UpdateScore(ctx context.Context, userID string, score int) error {
	return r.rdb.ZIncrBy(ctx, LeaderboardGlobalKey, float64(score), userID).Err()
}

// GetTopUsers retrieves the top N ranked users from the sorted set (O(log(N)+M)).
func (r *redisLeaderboardRepository) GetTopUsers(ctx context.Context, limit int) ([]models.LeaderboardEntry, error) {
	if limit <= 0 {
		limit = 10
	}

	results, err := r.rdb.ZRevRangeWithScores(ctx, LeaderboardGlobalKey, 0, int64(limit-1)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch top users from redis: %w", err)
	}

	// If Redis sorted set is currently empty, backfill proactively from PostgreSQL
	// so the leaderboard displays existing Accepted submissions immediately.
	if len(results) == 0 {
		rows, err := r.db.Query(ctx, `
			SELECT s.user_id, u.username, COUNT(*) * 10 as score
			FROM submissions s
			JOIN users u ON s.user_id = u.id
			WHERE s.status = 'Accepted'
			GROUP BY s.user_id, u.username
			ORDER BY score DESC
			LIMIT $1`, limit)
		if err == nil {
			defer rows.Close()
			var entries []models.LeaderboardEntry
			rank := 1
			for rows.Next() {
				var uid uuid.UUID
				var uname string
				var sc int
				if err := rows.Scan(&uid, &uname, &sc); err == nil {
					_ = r.UpdateScore(ctx, uid.String(), sc)
					entries = append(entries, models.LeaderboardEntry{
						Rank:     rank,
						UserID:   uid,
						Username: uname,
						Score:    sc,
					})
					rank++
				}
			}
			if len(entries) > 0 {
				return entries, nil
			}
		}
		return []models.LeaderboardEntry{}, nil
	}

	userIDs := make([]uuid.UUID, 0, len(results))
	for _, res := range results {
		idStr, ok := res.Member.(string)
		if !ok {
			continue
		}
		if id, err := uuid.Parse(idStr); err == nil {
			userIDs = append(userIDs, id)
		}
	}

	usernameMap := make(map[uuid.UUID]string)
	if len(userIDs) > 0 {
		query := `SELECT id, username FROM users WHERE id = ANY($1)`
		rows, err := r.db.Query(ctx, query, userIDs)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id uuid.UUID
				var uname string
				if err := rows.Scan(&id, &uname); err == nil {
					usernameMap[id] = uname
				}
			}
		}
	}

	entries := make([]models.LeaderboardEntry, 0, len(results))
	for i, res := range results {
		idStr, _ := res.Member.(string)
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		uname := usernameMap[id]
		if uname == "" {
			uname = "Anonymous (" + idStr[:8] + ")"
		}

		entries = append(entries, models.LeaderboardEntry{
			Rank:     i + 1,
			UserID:   id,
			Username: uname,
			Score:    int(res.Score),
		})
	}

	return entries, nil
}
