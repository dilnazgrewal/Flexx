"""Application settings, loaded from environment variables / .env file."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Flexx Commerce API"
    api_prefix: str = "/api"
    debug: bool = True

    # SQLite by default so the project runs with zero external services.
    # Point this at postgresql+psycopg://... to move to Postgres - nothing
    # else in the codebase has to change.
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'flexx.db').as_posix()}"

    jwt_secret: str = "flexx-dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # NoDecode stops pydantic-settings JSON-decoding this before the
    # validator below runs, so CORS_ORIGINS can be plain comma-separated text.
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # Storefront commercial rules
    free_shipping_threshold: float = 50.0
    shipping_flat_rate: float = 4.99
    tax_rate: float = 0.08

    seed_admin_email: str = "admin@flexx.com"
    seed_admin_password: str = "FlexxAdmin123!"


    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, v):
        """Accept "a,b" as well as JSON, so CORS_ORIGINS can be typed into a
        hosting dashboard without JSON quoting."""
        if not isinstance(v, str):
            return v
        text = v.strip()
        if text.startswith("["):
            import json

            return json.loads(text)
        return [o.strip() for o in text.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
