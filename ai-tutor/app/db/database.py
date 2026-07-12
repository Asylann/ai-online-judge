"""
Database connection management for the AI Tutor (Virtual TA) service.
Provides synchronous/asynchronous connection pooling via psycopg (v3) for PostgreSQL
and a Redis client for real-time Pub/Sub notifications of generated Socratic hints.

All EDM metrics (such as cognitive_effort_index and ai_hint_text) are persisted
to PostgreSQL via pools managed in this module.
"""

import logging
from typing import Generator
import redis
from psycopg_pool import ConnectionPool
from app.core.config import settings

logger = logging.getLogger("ai-tutor.db")

# Global connection pool instances
_pg_pool: ConnectionPool | None = None
_redis_client: redis.Redis | None = None


def init_db() -> None:
    """Initialize PostgreSQL connection pool and Redis client on application startup."""
    global _pg_pool, _redis_client
    try:
        _pg_pool = ConnectionPool(
            conninfo=settings.DATABASE_URL,
            min_size=1,
            max_size=10,
            open=True
        )
        logger.info("[ai-tutor] PostgreSQL connection pool initialized successfully.")
    except Exception as e:
        logger.error(f"[ai-tutor] Failed to initialize PostgreSQL pool: {e}")

    try:
        _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis_client.ping()
        logger.info("[ai-tutor] Redis client connected and verified via PING.")
    except Exception as e:
        logger.error(f"[ai-tutor] Failed to connect to Redis: {e}")


def close_db() -> None:
    """Close connections during application shutdown."""
    global _pg_pool, _redis_client
    if _pg_pool:
        _pg_pool.close()
        logger.info("[ai-tutor] PostgreSQL pool closed.")
    if _redis_client:
        _redis_client.close()
        logger.info("[ai-tutor] Redis client closed.")


def get_pg_pool() -> ConnectionPool:
    """Returns the PostgreSQL connection pool."""
    global _pg_pool
    if _pg_pool is None:
        init_db()
    if _pg_pool is None:
        raise RuntimeError("PostgreSQL connection pool is not initialized.")
    return _pg_pool


def get_redis() -> redis.Redis:
    """Returns the Redis client for Pub/Sub and caching."""
    global _redis_client
    if _redis_client is None:
        init_db()
    if _redis_client is None:
        raise RuntimeError("Redis client is not initialized.")
    return _redis_client
