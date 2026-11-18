"""Saans application configuration loaded from environment."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Data provider
    open_meteo_timeout_seconds: int = 10
    data_mode: str = "live"  # "live" or "fixture"

    # Rate limiting
    max_plan_requests_per_minute: int = 10
    max_concurrent_gemini_calls: int = 2

    # Optional Google AQ
    google_aq_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @property
    def gemini_available(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key != "your-gemini-api-key-here")

    @property
    def is_fixture_mode(self) -> bool:
        return self.data_mode == "fixture"


settings = Settings()
