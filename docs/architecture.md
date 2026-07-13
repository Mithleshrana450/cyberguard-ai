# Architecture — Module 0: Foundation

## Layout: Monorepo
Frontend and backend live in one repository. For a solo project this keeps
setup, versioning, and CI simple — one `docker compose up` runs everything,
and there's a single README/history instead of coordinating two repos.

## Backend: Clean layering
```
app/
├── api/        # Route definitions only — parse request, call service, return response
├── core/        # Config, security helpers, shared settings
├── models/       # SQLAlchemy ORM models (database tables)
├── schemas/      # Pydantic models (request/response validation)
├── services/     # Business logic — the actual "what does this feature do"
└── db/           # Session and Base setup
```

Routes stay thin. Business logic lives in `services/`, which:
- can be unit tested without spinning up HTTP
- can be reused by different callers (e.g. a future AI assistant module
  calling the same `scanner_service` a REST route calls)

## Why FastAPI + SQLAlchemy + PostgreSQL
- FastAPI gives us async support, automatic OpenAPI/Swagger docs, and
  Pydantic validation out of the box — all directly useful for a security
  platform where input validation matters.
- PostgreSQL over SQLite because we need real concurrent writes (multiple
  users, background scan jobs) and JSONB support for flexible scan results.
- Redis is included now for future use: caching scan results and rate
  limiting (Module 1+).

## Why Docker Compose from day one
Building with Docker from Module 0 — rather than bolting it on later —
means the dev environment matches what you'd deploy, and "works on my
machine" problems get caught immediately instead of at the end.

## Config via environment variables
All secrets and environment-specific values (DB URL, JWT secret) load from
`.env` via `pydantic-settings`, never hardcoded. This follows OWASP
guidance on avoiding security misconfiguration and means the same code
works in dev/staging/prod.

## What's deliberately NOT built yet
No auth, no real database models, no business features. Module 0's only
job is proving the skeleton works: backend running, frontend running,
Docker networking them together, and a database container ready for
Module 1 to start creating tables in.
