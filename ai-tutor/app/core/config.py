"""
Configuration module for the AI Tutor (Virtual TA) service.
Uses pydantic-settings BaseSettings to load environment variables from the environment
injected by Docker Compose or run locally.

In Watanobe lab terminology, this configuration powers the Virtual TA microservice,
enabling Socratic pedagogy, minimal edits, and Educational Data Mining (EDM) data logging.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Runtime settings for the Virtual TA microservice.
    Loads DATABASE_URL, OPENAI_API_KEY, REDIS_URL, and PORT from environment variables.
    """
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_online_judge"
    OPENAI_API_KEY: str = "sk-placeholder-for-testing"
    REDIS_URL: str = "redis://localhost:6379/0"
    PORT: int = 8081

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


def get_settings() -> Settings:
    """Returns a cached or instantiated Settings object."""
    return Settings()


settings = get_settings()
