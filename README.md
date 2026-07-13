# CyberGuard AI

An AI-powered cybersecurity management platform, built module by module as a
final-year BCA project and portfolio piece.

## Status
🚧 Module 0: Foundation — project scaffold, Docker environment, and a
working health-check connecting the frontend to the backend.

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Infra:** Docker, Docker Compose

## Running locally

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Start everything:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: http://localhost:5173
   - Backend API docs (Swagger): http://localhost:8000/api/docs
   - Backend health check: http://localhost:8000/api/v1/health

## Project Structure

```
cyberguard-ai/
├── backend/       # FastAPI application
├── frontend/       # React + TypeScript application
├── docs/           # Architecture and API documentation
└── docker-compose.yml
```

See `docs/architecture.md` for design decisions and rationale.

## Roadmap
- [x] Module 0 — Foundation & Docker environment
- [ ] Module 1 — Authentication & RBAC
- [ ] Module 2 — Dashboard
- [ ] Module 3 — Website Security Scanner
- [ ] Module 4 — Mini SIEM
- [ ] Module 5 — Threat Intelligence
- [ ] Module 6 — Phishing Detection
- [ ] Module 7 — Network Monitoring
- [ ] Module 8 — Digital Forensics
- [ ] Module 9 — AI Security Assistant
- [ ] Module 10 — Incident Management
- [ ] Module 11 — Reports
- [ ] Module 12 — Admin Panel
- [ ] Module 13 — Analytics
