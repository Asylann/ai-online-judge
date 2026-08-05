# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered Online Judge platform (LeetCode-style) with an integrated Socratic AI tutor, targeting submission to Professor Yutaka Watanobe's laboratory at the University of Aizu, Japan. Uses an asynchronous choreography pattern across a polyglot monorepo.

Live: https://aioj.studio

## Build & Run Commands

### Full Stack (Production)
```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml logs -f <service-name>
```

### Individual Go Services
```bash
# From repo root (single go.mod covers all Go services)
go build ./api-gateway/...
go build ./judge-worker/...
go build ./ast-service/...
go build ./websocket-service/...

# Run a specific service locally (requires env vars from .env)
go run ./api-gateway/main.go
go run ./judge-worker/main.go
go run ./ast-service/main.go
go run ./websocket-service/main.go
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # Dev server on :3000
npm run build        # Production build
npm run lint         # ESLint
npm run test:e2e     # Playwright E2E tests
```

### AI Tutor (Python/FastAPI)
```bash
cd ai-tutor
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Docker Build (individual service)
```bash
# Go services need root context for go.mod
docker build -f api-gateway/Dockerfile -t api-gateway .
docker build -f judge-worker/Dockerfile -t judge-worker .
docker build -f ast-service/Dockerfile -t ast-service .
docker build -f websocket-service/Dockerfile -t websocket-service .

# Self-contained contexts
docker build -f frontend/Dockerfile -t frontend ./frontend
docker build -f ai-tutor/Dockerfile -t ai-tutor ./ai-tutor
docker build -f nginx/Dockerfile -t nginx ./nginx
```

## Architecture

### Services

| Service | Lang | Port | Role |
|---|---|---|---|
| api-gateway | Go/Gin | 8080 | REST API, JWT auth, AMQP producer, admin seeding |
| judge-worker | Go | — | AMQP consumer, Judge0 sandbox executor, verdict storage |
| ast-service | Go/Gin | 8083 | AST parsing (gotreesitter stub), complexity scoring |
| ai-tutor | Python/FastAPI | 8000 | Socratic Virtual TA, OpenAI GPT-4o, EDM metrics |
| websocket-service | Go/Gin+gorilla | 8082 | Real-time push via Redis Pub/Sub |
| frontend | Next.js 14 | 3000 | SSR/CSR, Monaco Editor, Recharts dashboards |
| nginx | Nginx | 80 | Reverse proxy, Cloudflare IP whitelist |

Infrastructure: PostgreSQL 15, Redis 7, RabbitMQ 3.

### Data Flow

1. User submits Base64-encoded code → API Gateway persists + publishes to RabbitMQ
2. Judge Worker dequeues → runs 10 ranked test cases via Judge0 sandbox
3. On Wrong Answer → AST Service (async) → AI Tutor generates Socratic hint
4. AI Tutor publishes to Redis Pub/Sub → WebSocket Service pushes to browser

### Go Service Layering

Each Go service uses only the layers its role requires:

| Service | config | repository | service | handler | consumer | ws |
|---|---|---|---|---|---|---|
| api-gateway | ✓ | ✓ | ✓ | ✓ | | |
| judge-worker | ✓ | ✓ | ✓ | | ✓ | |
| ast-service | ✓ | | ✓ | ✓ | | |
| websocket-service | ✓ | | | | | ✓ |

`main.go` is the only DI root. Flow: config → connections → repository → service → handler/consumer/ws → server start. No sideways or upward dependencies.

### Shared Go Code

`pkg/` contains shared libraries imported by all Go services:
- `pkg/database/` — PostgreSQL (pgxpool) + Redis connection initializers
- `pkg/models/` — Shared structs: User, Submission, Problem, ASTResult
- `pkg/astparser/` — gotreesitter helper functions

## Critical Rules

1. **Base64 encoding**: All source code must be Base64-encoded before JSON transmission.
2. **Single go.mod**: All Go services share the root `go.mod`. `go.work` is local-only (gitignored, never committed). CI uses `GOWORK=off`.
3. **Multi-test evaluation**: 10 ranked test cases per problem (difficulty 1-10). Track `tests_passed/tests_total`, not binary pass/fail.
4. **Socratic pedagogy**: AI Tutor never provides solutions — only minimal-edit Socratic hints.
5. **Async fire-and-forget**: AST analysis and AI hints never block the judging pipeline.
6. **Container DNS**: Production uses explicit container names (e.g., `ai_judge_postgres`) for inter-service routing on the shared Docker network.

## CI/CD

Push to `master` or `main` triggers `.github/workflows/deploy.yml`:
1. Matrix build of 7 Docker images → pushed to GHCR (`ghcr.io/asylann/ai-online-judge-<service>:latest`)
2. SSH deploy to production server: pull images → down → up -d → prune

## Environment Setup

Copy `.env.example` to `.env`. Key variables:
- `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `JWT_SECRET` — generate with `openssl rand -base64 32`
- `OPENAI_API_KEY` — for AI Tutor (set to `sk-placeholder` for offline/test mode)
- `JUDGE0_URL` — sandbox endpoint (defaults to public CE instance)
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` — frontend API routing

## Academic Vocabulary

Use these terms in code and documentation to align with Prof. Watanobe's research:
- Observer, Launcher, Executor, Judge (AOJ architecture roles)
- Effort-based metrics, Zone of Proximal Development, minimal edits
- Educational Data Mining (EDM), cognitive_effort_index, ast_complexity_score
- Content-Based Recommendation System (CBRS)
