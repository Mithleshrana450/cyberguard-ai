# 🛡️ CyberGuard AI

**A complete, AI-powered cybersecurity management platform** — designed, built, and tested module by module as a hands-on demonstration of secure full-stack engineering, from JWT authentication and RBAC to a working Redis-backed brute-force detection SIEM, real threat-intelligence integrations, and an AI security assistant grounded in live platform data.

<p>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Tests-190%20passing-brightgreen" alt="190 tests passing" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</p>

<!--
Once deployed, replace the line below with something like:
### 🔗 [Live Demo](https://your-app.up.railway.app) &nbsp;|&nbsp; [API Docs](https://your-backend.up.railway.app/api/docs)
-->

All **14 planned modules are complete**, and every panel has been through a full UI/UX polish pass — circular score rings, animated donut charts, real-time trend visualizations, and Framer Motion throughout. Every feature ships with real automated tests (**190 passing backend tests**), an ER diagram, an API reference, and a written rationale for its design decisions. Nothing here is scaffolding for its own sake: the scanner does real passive header/TLS analysis, the SIEM does real Redis-backed brute-force detection with an admin-configurable threshold, the network monitor enforces a hard-coded private-IP-only authorization boundary even for admin accounts, and the AI assistant answers questions grounded in your actual live security data pulled from five different modules.

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security & Responsible Use](#-security--responsible-use)
- [Roadmap](#-roadmap)
- [Author](#-author)
- [License](#-license)

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 **Authentication & RBAC** | JWT access/refresh tokens, bcrypt password hashing, role-based access control (`admin` / `analyst` / `viewer`) |
| 📊 **Dashboard** | Circular security score gauge with week-over-week trend, real-time metrics, score/success-rate charts, and an activity feed — all backed by live data |
| 🌐 **Website Security Scanner** | Passive security header analysis, TLS certificate health checks, `robots.txt` exposure checks, weighted 0–100 scoring, clickable scan history |
| 📋 **Mini SIEM** | Every login attempt logged; Redis-backed brute-force detection with admin-configurable threshold and deduplicated alerting |
| 🛰️ **Threat Intelligence** | IP / domain / URL / file-hash reputation lookups via VirusTotal's 70+ vendor aggregate, with Redis response caching |
| 🔍 **Digital Forensics** | File hashing (MD5/SHA-1/SHA-256), EXIF metadata extraction with GPS privacy warnings, integrity verification, automatic threat-intel cross-check |
| 🎣 **Phishing Detection** | URL/email heuristics (typosquatting, link tricks, urgency language), weighted risk scoring, optional AI-generated plain-English explanation |
| 🖥️ **Network Monitoring** | TCP connect device/port discovery, with a hard-enforced private-IP-only authorization boundary — even admins cannot scan public targets |
| 🧠 **AI Security Assistant** | Persistent chat, automatically grounded in your live scan scores, alerts, threat-intel verdicts, and network scan results |
| 🚨 **Incident Management** | Full status workflow (open → investigating → resolved → closed) enforced as a real state machine, investigation notes, differentiated RBAC |
| 📄 **Reports** | PDF security audit summaries and CSV exports for every module's history |
| ⚙️ **Admin Panel** | User management with a self-lockout protection guard, audit logging, and an admin-configurable platform setting wired to real SIEM behavior |
| 📈 **Analytics** | Platform-wide trends, severity distributions, and executive KPIs across every module |

---

## 📸 Screenshots

> _Add screenshots of your running app here — the Dashboard, Scanner results, and SIEM alert view make strong portfolio visuals. Drag images into this section on GitHub, or reference files in a `docs/screenshots/` folder, e.g.:_
> `![Dashboard](docs/screenshots/dashboard.png)`

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, FastAPI, SQLAlchemy, Alembic, Pydantic |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, React Router, Framer Motion |
| **Database** | PostgreSQL 16 |
| **Caching / Rate Tracking** | Redis 7 |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **External Intel** | VirusTotal API v3, OpenAI API |
| **PDF Generation** | reportlab |
| **Infra** | Docker, Docker Compose |
| **Testing** | pytest, FastAPI TestClient |

---

## 🏗️ Architecture

CyberGuard AI follows a **Clean Architecture** layering on the backend — routes stay thin, business logic lives in `services/`, and pure/testable logic (header analysis, brute-force detection, verdict interpretation, phishing heuristics, incident state transitions, analytics aggregation) is deliberately separated from anything that touches the network or database. This is what makes it possible to unit-test security logic — like "does this response contain a missing HSTS header" or "is jumping from `open` to `closed` a valid incident transition" — without ever making a real HTTP request.

Full design rationale, including *why* each major decision was made, lives in [`docs/architecture.md`](docs/architecture.md) and the per-module docs in [`docs/api/`](docs/api/).

```
Browser (React SPA)
      │  JWT Bearer token
      ▼
FastAPI Backend  ──────►  PostgreSQL   (durable data: users, scans, alerts, incidents, ...)
      │
      └──────────────►  Redis         (brute-force counters, threat-intel cache)
      │
      └──────────────►  VirusTotal API (external threat intelligence)
      │
      └──────────────►  OpenAI API     (phishing explanations, AI assistant)
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- A free [VirusTotal API key](https://www.virustotal.com/gui/join-us) (Threat Intelligence module)
- An [OpenAI API key](https://platform.openai.com/api-keys) (Phishing Detection's AI explanation + AI Security Assistant — both work without it, just with reduced functionality)

### Setup

```bash
git clone https://github.com/<your-username>/cyberguard-ai.git
cd cyberguard-ai
cp .env.example .env
# then edit .env and add your VIRUSTOTAL_API_KEY and OPENAI_API_KEY
```

```bash
docker compose up --build
```

Run database migrations (first time, and after pulling any update that adds new tables):

```bash
docker compose exec backend alembic upgrade head
```

### Access the app

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **API docs (Swagger)** | http://localhost:8000/api/docs |
| **API docs (ReDoc)** | http://localhost:8000/api/redoc |
| **Health check** | http://localhost:8000/api/v1/health |

---

## ☁️ Deployment

This project deploys to [Railway](https://railway.com) with minimal changes, since Railway can run the existing `docker-compose.yml` directly (backend, frontend, PostgreSQL, and Redis as-is).

**Quick summary:**
1. Push the repo to GitHub, then **New Project → Deploy from GitHub repo** on Railway
2. Set backend environment variables: `SECRET_KEY`, `VIRUSTOTAL_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`
3. Generate public domains for the `frontend` and `backend` services
4. Set `VITE_API_URL` on the frontend service to the backend's public URL, then **redeploy** (Vite bakes this in at build time, not runtime)
5. Set `CORS_ORIGINS=["https://your-frontend-url"]` on the backend, then redeploy
6. Run migrations against the live database: `railway run --service backend alembic upgrade head`

All config is environment-variable driven already (see `app/core/config.py`), so no code changes are required to deploy — only configuration.

**Free alternative:** frontend on [Vercel](https://vercel.com) (free) + backend/DB/Redis on [Render](https://render.com)'s free tier (free, but the server sleeps after inactivity and takes ~30s to wake on the next request — fine for a portfolio demo, noticeable if you need instant response).

---

## 🧪 Testing

Every module ships with automated tests — pure business logic (header analysis, brute-force detection, verdict scoring, phishing heuristics, incident workflow transitions, analytics aggregation) is unit tested with no network dependency, and every API endpoint has integration tests with external calls mocked.

```bash
docker compose exec backend pytest tests/ -v
```

**Current status: 190 passing tests** across all 14 modules.

---

## 📁 Project Structure

```
cyberguard-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # Route definitions (thin - parse, delegate, respond)
│   │   ├── core/           # Config, security utils, Redis client, RBAC deps
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic (the "fat" layer, fully testable)
│   │   └── db/               # Session and declarative base
│   ├── alembic/                # Database migrations
│   └── tests/                    # pytest suite (190 tests)
├── frontend/
│   └── src/
│       ├── components/          # UI components, organized by feature + shared /ui
│       ├── context/              # Auth context (token state, silent refresh)
│       ├── pages/                  # Route-level pages, one per module
│       └── services/                # API client
├── docs/
│   ├── architecture.md               # Module 0 foundational design decisions
│   └── api/                            # Per-module API reference + rationale
└── docker-compose.yml
```

---

## 📖 API Documentation

Interactive, always-current API docs are auto-generated by FastAPI and available at `/api/docs` (Swagger UI) whenever the backend is running. Written design rationale for each module — the *why*, not just the *what* — lives in [`docs/api/`](docs/api/).

---

## 🔒 Security & Responsible Use

Several modules are built for **passive, authorized security testing only**:

- The **Website Scanner** and **Threat Intelligence** modules only read response headers, TLS certificate metadata, `robots.txt`, and public reputation data — the same data any browser or lookup service reads. Neither attempts exploitation.
- The **Network Monitoring** module enforces a hard, server-side authorization boundary: only private/local IP ranges (RFC1918 + loopback) are accepted, and this is enforced independently of user role — even an admin account cannot scan a public IP through this platform.
- **Only scan or look up targets you own or are explicitly authorized to test.**
- API keys (VirusTotal, OpenAI, and any future integrations) are managed via environment variables and are never committed to version control.

---

## 🗺️ Roadmap

All 14 planned modules are complete:

- [x] Module 0 — Foundation & Docker environment
- [x] Module 1 — Authentication & RBAC
- [x] Module 2 — Dashboard
- [x] Module 3 — Website Security Scanner
- [x] Module 4 — Mini SIEM
- [x] Module 5 — Threat Intelligence
- [x] Module 6 — Digital Forensics
- [x] Module 7 — Phishing Detection
- [x] Module 8 — Network Monitoring
- [x] Module 9 — AI Security Assistant
- [x] Module 10 — Incident Management
- [x] Module 11 — Reports
- [x] Module 12 — Admin Panel
- [x] Module 13 — Analytics
- [x] Full UI/UX redesign pass across every panel

Possible future directions: background job processing for larger scans (Celery), password reset via email, live production deployment with a custom domain and CI/CD.

---

## 👤 Author

Built as a final-year BCA project and portfolio piece by a student on an Ethical Hacking / Cybersecurity Engineering learning path.

Feel free to open an issue or reach out if you have questions about the design decisions behind any module — most of them are documented in [`docs/api/`](docs/api/), but I'm happy to talk through the reasoning.

---

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<p align="center">
  ⭐ If this project is useful as a reference or portfolio example, consider starring the repo.
</p>
