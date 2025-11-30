"""Application configuration settings."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_role_key: str = ""
    supabase_database_url: str = ""

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # Anthropic (alternative)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-haiku-latest"

    # Upstash Redis (optional)
    upstash_url: str = ""
    upstash_token: str = ""

    # Application
    environment: str = "development"
    log_level: str = "INFO"
    api_version: str = "v1"

    # Question extraction
    question_image_dir: str = "../data/raw/images"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
