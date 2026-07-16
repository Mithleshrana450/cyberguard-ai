# 🛡️ CyberGuard AI

**An AI-powered cybersecurity management platform** — built module by module as a hands-on demonstration of secure software engineering, from JWT authentication and RBAC to a working brute-force detection SIEM and real threat-intelligence integrations.

<p>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</p>

This project is being built incrementally, one fully-tested module at a time — every feature ships with real automated tests (currently **51 passing backend tests**), an ER diagram, an API reference, and a written rationale for its design decisions. Nothing here is scaffolding for its own sake: the scanner does real passive header/TLS analysis, the SIEM does real Redis-backed brute-force detection, and the threat-intel module calls a real external API.

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security & Responsible Use](#-security--responsible-use)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## ✨ Features

### ✅ Built & tested

| Module | What it does |
|---|---|
| 🔐 **Authentication & RBAC** | JWT access/refresh tokens, bcrypt password hashing, role-based access control (`admin` / `analyst` / `viewer`) |
| 📊 **Dashboard** | Live security score, alert counts, and recent activity — pulled from real data across every other module |
| 🌐 **Website Security Scanner** | Passive security header analysis, TLS certificate health checks, `robots.txt` exposure checks, weighted 0–100 scoring |
| 📋 **Mini SIEM** | Every login attempt logged; Redis-backed brute-force detection with automatic, deduplicated alerting |
| 🛰️ **Threat Intelligence** | IP / domain / URL / file-hash reputation lookups via VirusTotal's 70+ vendor aggregate, with Redis response caching |

### 🚧 Planned

🎣 Phishing Detection · 🖥️ Network Monitoring · 🔍 Digital Forensics · 🧠 AI Security Assistant · 🚨 Incident Management · 📄 Reports · ⚙️ Admin Panel · 📈 Analytics

See the [Roadmap](#-roadmap) for the full build order.

---

## 📸 Screenshots

> _Add screenshots of your running app here — the Dashboard, Scanner results, and SIEM alert view make strong portfolio visuals. Drag images into this section on GitHub, or reference files in a `docs/screenshots/` folder, e.g.:_
> `![Dashboard](docs/screenshots/Screenshot\ From\ 2026-07-16\ 20-20-25.png)`
> `![Scanner](docs/screenshots/Screenshot\ From\ 2026-07-16\ 20-20-19.png)`
> `![SIEM](docs/screenshots/Screenshot\ From\ 2026-07-16\ 20-20-40.png)`
> `![Threat Intelligence](docs/screenshots/Screenshot\ From\ 2026-07-16\ 20-20-30.png)`
> `![Login](docs/screenshots/Screenshot\ From\ 2026-07-16\ 20-20-13.png)`

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, FastAPI, SQLAlchemy, Alembic, Pydantic |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, React Router, Framer Motion |
| **Database** | PostgreSQL 16 |
| **Caching / Rate Tracking** | Redis 7 |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **External Intel** | VirusTotal API v3 |
| **Infra** | Docker, Docker Compose |
| **Testing** | pytest, FastAPI TestClient |

---

## 🏗️ Architecture

CyberGuard AI follows a **Clean Architecture** layering on the backend — routes stay thin, business logic lives in `services/`, and pure/testable logic (header analysis, brute-force detection, verdict interpretation) is deliberately separated from anything that touches the network or database. This is what makes it possible to unit-test security logic like "does this response contain a missing HSTS header" without ever making a real HTTP request.

Full design rationale, including *why* each major decision was made, lives in [`docs/architecture.md`](docs/architecture.md) and the per-module docs in [`docs/api/`](docs/api/).

```
Browser (React SPA)
      │  JWT Bearer token
      ▼
FastAPI Backend  ──────►  PostgreSQL   (durable data: users, scans, alerts, lookups)
      │
      └──────────────►  Redis         (brute-force counters, threat-intel cache)
      │
      └──────────────►  VirusTotal API (external threat intelligence)
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- A free [VirusTotal API key](https://www.virustotal.com/gui/join-us) (only required for the Threat Intelligence module)

### Setup

```bash
git clone https://github.com/<your-username>/cyberguard-ai.git
cd cyberguard-ai
cp .env.example .env
# then edit .env and add your VIRUSTOTAL_API_KEY
```

```bash
docker compose up --build
```

Run database migrations (first time only, and after pulling any update that adds new tables):

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

## 🧪 Testing

Every module ships with automated tests — pure business logic (header analysis, brute-force detection, verdict scoring) is unit tested with no network dependency, and every API endpoint has integration tests with external calls mocked.

```bash
docker compose exec backend pytest tests/ -v
```

**Current status: 51 passing tests** across authentication, dashboard, scanner, SIEM, and threat intelligence.

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
│   ├── alembic/               # Database migrations
│   └── tests/                  # pytest suite
├── frontend/
│   └── src/
│       ├── components/          # UI components, organized by feature + shared /ui
│       ├── context/              # Auth context (token state, silent refresh)
│       ├── pages/                  # Route-level pages
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

The Website Scanner and Threat Intelligence modules are built for **passive, authorized security testing only**:

- The scanner only reads response headers, TLS certificate metadata, and `robots.txt` — the same data any browser reads on every page load. It never attempts exploitation.
- **Only scan or look up targets you own or are explicitly authorized to test.** Good practice for any security tooling, regardless of how passive the checks are.
- API keys (VirusTotal, and any future integrations) are managed via environment variables and are never committed to version control.

---

## 🗺️ Roadmap

- [x] Module 0 — Foundation & Docker environment
- [x] Module 1 — Authentication & RBAC
- [x] Module 2 — Dashboard
- [x] Module 3 — Website Security Scanner
- [x] Module 4 — Mini SIEM
- [x] Module 5 — Threat Intelligence
- [ ] Module 6 — Digital Forensics
- [ ] Module 7 — Phishing Detection
- [ ] Module 8 — Network Monitoring
- [ ] Module 9 — AI Security Assistant
- [ ] Module 10 — Incident Management
- [ ] Module 11 — Reports
- [ ] Module 12 — Admin Panel
- [ ] Module 13 — Analytics

---

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built as a final-year BCA project, portfolio piece, and hands-on cybersecurity + full-stack engineering learning path.
</p>
