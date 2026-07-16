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
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

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
