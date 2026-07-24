"""
Centralized application configuration.

Why this file exists:
Hardcoding values like database URLs or secret keys directly in code is a
security anti-pattern (OWASP A05:2021 - Security Misconfiguration). Instead,
we load everything from environment variables via a single Settings object.
This means:
  1. Secrets never get committed to Git.
  2. The same code runs in dev/staging/prod just by changing env vars.
  3. There is ONE place to see every config value the app depends on.
"""

from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App metadata ---
    APP_NAME: str = "CyberGuard AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "postgresql://cyberguard:cyberguard@db:5432/cyberguard_ai"

    # --- Redis ---
    REDIS_URL: str = "redis://redis:6379/0"

    # --- Security (placeholders for Module 1 - Authentication) ---
    SECRET_KEY: str = "change-me-in-env-file"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- CORS ---
    # On cloud platforms (Render, Railway, etc.) env vars must be plain strings,
    # not JSON arrays. Set CORS_ORIGINS as a comma-separated list:
    #   CORS_ORIGINS=https://myapp.vercel.app,http://localhost:5173
    # The validator below splits it into a proper list automatically.
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            # Strip surrounding brackets if someone passed JSON-style value
            value = value.strip().strip("[]")
            return [origin.strip().strip('"').strip("'") for origin in value.split(",") if origin.strip()]
        raise ValueError("CORS_ORIGINS must be a list or comma-separated string")

    # --- Threat Intelligence (Module 5) ---
    # Free tier key from https://www.virustotal.com/gui/join-us - never
    # commit a real value here. Empty string means the feature will return
    # a clear "not configured" error instead of crashing.
    VIRUSTOTAL_API_KEY: str = ""

    # --- AI Security Assistant / Phishing Detection (Module 7) ---
    # Paid API, small usage-based cost. Empty string means the app falls
    # back to heuristics-only phishing analysis rather than crashing.
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Instantiated once, imported everywhere else. This is the "Singleton" pattern -
# every module that needs config imports this same `settings` object instead of
# re-reading environment variables repeatedly.
settings = Settings()
