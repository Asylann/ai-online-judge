# 🧠 AI Online Judge — Polyglot Asynchronous Microservices Platform

[![Academic Target](https://img.shields.io/badge/Academic_Target-Watanobe_Lab_%7C_Univ._of_Aizu-003366?style=for-the-badge&logo=google-scholar&logoColor=white)](#-academic-context--research-alignment)
[![Architecture](https://img.shields.io/badge/Architecture-Polyglot_Monorepo_%7C_Go_%2B_Python_%2B_Next.js-008080?style=for-the-badge&logo=docker&logoColor=white)](#-architecture-overview)
[![EDM Status](https://img.shields.io/badge/EDM-Effort--Based_Metrics_%7C_CBRS_%7C_ZPD-10b981?style=for-the-badge&logo=chart-line&logoColor=white)](#-key-features--research-alignment)
[![Security](https://img.shields.io/badge/Sandbox-Isolate_%7C_cgroups_v2_%7C_seccomp--bpf-e11d48?style=for-the-badge&logo=shield&logoColor=white)](#-security-boundaries--defense-in-depth)

> **An advanced, production-grade competitive programming and AI-guided educational evaluation platform built inside a Polyglot Monorepo using Asynchronous Choreography, Real-Time WebSockets, and Educational Data Mining (EDM).**

---

## 🎯 Executive Summary

The **AI Online Judge** is a high-concurrency, full-stack programming assessment platform engineered to demonstrate the union of **secure sandboxed execution**, **asynchronous microservices**, and **adaptive artificial intelligence**. Unlike traditional online judges that record merely binary pass/fail outcomes (`Accepted` / `Wrong Answer`), this platform captures deep, multi-dimensional **Educational Data Mining (EDM)** metrics to quantify student cognitive effort, identify structural logic deviations via Abstract Syntax Trees (ASTs), and dynamically scaffold learning paths.

The architecture strictly decouples high-throughput REST API traffic from resource-intensive compilation and AI pipelines using **RabbitMQ (AMQP)** choreography and **Redis Pub/Sub** bridges, delivering real-time, zero-latency feedback directly to the student's browser editor via dedicated **WebSocket** hubs.

---

## 👨‍🔬 Academic Context & Research Alignment

This platform is specifically built and tuned for alignment with the **Smart Learning & Society 5.0** research methodologies pioneered by **Professor Yutaka Watanobe’s Laboratory** at the **University of Aizu, Japan** (creator of the *Aizu Online Judge*). Every core service, data model, and pedagogical engine implements concepts published in the lab's peer-reviewed research:

* **Observer & Launcher/Executor Architecture:** Code execution is strictly isolated using dedicated launcher daemons inside Linux sandboxes (`isolate`), monitored continuously by observer watchdogs that terminate runaway processes (`SIGKILL`) before container starvation occurs.
* **Effort-Based EDM Metrics:** Submissions track granular effort indicators including `execution_time_ms`, `memory_kb`, `attempt_count`, submission latency gaps, `ast_complexity_score`, and a composite `cognitive_effort_index`.
* **gotreesitter AST Structural Analysis:** Utilizes pure Go Tree-sitter runtime parsing (`gotreesitter` without CGO overhead) to extract structural syntax features, loop depths, and algorithmic complexity scores in microseconds.
* **Socratic Virtual TA (`Minimal Edits` Pedagogy):** When a student encounters a structural or logical error (`Wrong Answer`), the Python AI Tutor (`FastAPI` + `OpenAI GPT-4o`) intervenes using strict Socratic pedagogy. It **never** outputs corrected solutions; instead, it identifies structural deviations and formulates guiding questions requiring the minimal possible code edit (`minimal edits`).
* **Content-Based Recommendation System (CBRS) inside ZPD:** Rejects Collaborative Filtering (which suffers from educational cold-start and matrix sparsity) in favor of effort-driven CBRS. By evaluating the student's `cognitive_effort_index` on their latest submission, the engine recommends algorithmic challenges precisely calibrated within their **Zone of Proximal Development (ZPD)**—scaffolding downward during struggle and expanding complexity upon mastery.

---

## 🏛️ Architecture Overview

The platform implements an **Asynchronous Choreography Pattern** inside a unified **Polyglot Monorepo**. Services communicate via typed AMQP event messages and low-latency internal HTTP connections, bound together by Docker Compose.

### Data & Message Flow

```
                  [User Browser — Next.js / Monaco Editor]
                                 │       ▲
          POST /api/submissions  │       │  Real-Time WebSocket Push
          (Base64 Encoded Code)  │       │  (Redis Pub/Sub -> WS Hub)
                                 ▼       │
                       [Go API Gateway (Gin)]
                                 │       │
                Logs Pending Attempt to PostgreSQL (EDM)
                Pushes AMQP Task to RabbitMQ ('judge.tasks')
                                 │
                                 ▼
                     [Go Judge Worker (AMQP Consumer)]
                                 │
           Dispatches Binary to Judge0 Sandbox (cgroups v2 + seccomp)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼ (If Accepted)                 ▼ (If Wrong Answer)
      Update Verdict -> DB            [Go AST Service (gotreesitter)]
      Publish -> Redis Pub/Sub                   │
                                       Parses AST & Computes Complexity
                                                 │
                                                 ▼
                                     [Python AI Tutor (FastAPI + RAG)]
                                                 │
                                       Generates Socratic Hint (GPT-4o)
                                                 │
                                                 ▼
                                      Persists Hint -> PostgreSQL
                                      Publishes Event -> Redis Pub/Sub
```

### Microservice Responsibility Matrix

| Microservice | Language / Framework | Layer Mapping | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| `api-gateway` | **Go** (Gin) | `config` → `repository` → `service` → `handler` | Central REST gateway, JWT authentication, rate limiting, and AMQP producer. |
| `judge-worker` | **Go** (AMQP) | `config` → `repository` → `service` → `consumer` | Asynchronous queue consumer, Base64 decoding, Judge0 execution loop, and verdict persistence. |
| `ast-service` | **Go** (`gotreesitter`) | `config` → `service` → `handler` | Microsecond AST parsing, structural complexity calculation, and error deviation scoring. |
| `ai-tutor` | **Python** (FastAPI) | `config` → `db` → `services` → `api` | Virtual TA pedagogical engine utilizing OpenAI GPT-4o with strict Socratic system prompts. |
| `websocket-service` | **Go** (`gorilla/ws`) | `config` → `ws` (Client Hub) | Dedicated WebSocket hub subscribing to Redis Pub/Sub (`submissions.events.*`) for zero-polling push. |
| `frontend` | **React** (Next.js 14) | SSR Pages / CSR Editor | Ultra-premium Anthropic-inspired UI featuring Monaco Editor, Recharts charts, and ZPD modals. |

---

## 🛠️ Technology Stack

| Domain | Technology | Engineering Rationale |
| :--- | :--- | :--- |
| **Backend Core** | **Go (Golang 1.22)** | Highly concurrent Goroutines handle tens of thousands of polling/judge routines with minimal memory footprint. |
| **AI / NLP Service** | **Python 3.12 + FastAPI** | Industry standard for LLM integration, Pydantic type safety, and async I/O. |
| **Frontend Web App** | **Next.js 14 + TypeScript** | Hybrid Server-Side Rendering (SSR) for SEO/performance + Client-Side Rendering (CSR) for real-time code editing. |
| **Code Editor** | **Monaco Editor (`@monaco-editor/react`)** | Same core engine as VS Code; provides syntax highlighting, line numbering, and LSP readiness. |
| **Primary Database** | **PostgreSQL 15** | ACID transactional integrity, high-performance indexing, and native `JSONB` support for AST snapshots. |
| **Message Broker** | **RabbitMQ (AMQP 0-9-1)** | Provides explicit `ACK`/`NACK` delivery guarantees—preventing submission loss if workers restart. |
| **Cache & Pub/Sub** | **Redis 7** | Sub-millisecond rate limiting (DDoS protection) and decoupled Pub/Sub channel distribution. |
| **Sandbox Environment** | **Judge0 (`isolate` Linux kernel)** | Kernel-level isolation using Linux namespaces (`clone_newnet`), `cgroups v2`, and `seccomp-bpf`. |
| **AST Parser Engine** | **gotreesitter** | Pure Go implementation of Tree-sitter, ensuring memory safety without CGO cross-compilation complexity. |
| **Generative AI** | **OpenAI GPT-4o API** | High-reasoning semantic engine tuned via strict system prompts for educational scaffolding. |

---

## 🔐 Security Boundaries & Defense-in-Depth

The platform operates on a **zero-trust, cybersecurity-first methodology** designed to safely evaluate arbitrary, potentially malicious code submitted by users.

```
[Public Internet / User] ──(HTTPS/WSS)──> [Go API Gateway (JWT + Rate Limit)]
                                                   │
                                            (AMQP / Internal Network)
                                                   ▼
                                          [Isolated Judge Worker]
                                                   │
                                          (Seccomp + cgroups v2)
                                                   ▼
                                       [Judge0 Isolate Sandbox (NO NET)]
```

1. **Kernel-Level Sandbox Isolation (`isolate`)**:
   * **Network Stripping (`clone_newnet`)**: Executed student code inside the sandbox runs with an empty network namespace—preventing socket creation, data exfiltration, or botnet behaviors.
   * **Resource Bounding (`cgroups v2`)**: Enforces hard memory ceilings (`memory_kb`), CPU execution timeouts (`execution_time_ms`), and process limit constraints (preventing `fork()` bombs).
   * **System Call Filtering (`seccomp-bpf`)**: Blocks privileged system calls (`execve`, `ptrace`, raw socket operations), ensuring escape vectors are neutralized at the kernel boundary.
2. **Mandatory Base64 Payload Encoding**:
   * All source code submissions (`code_base64`) must be Base64-encoded on the client before network transmission. This eliminates JSON payload corruption, character encoding mismatches, and command-injection vulnerabilities across AMQP queues and REST boundaries.
3. **Application & Network Layer Security**:
   * **HMAC-SHA256 JWT Authentication**: All protected REST routes and WebSocket handshakes enforce cryptographic signature verification, explicitly disallowing `alg:none` attack vectors.
   * **Subnet Isolation**: Backend microservices (`judge-worker`, `ast-service`, `ai-tutor`, `postgres`, `rabbitmq`, `redis`) reside on an isolated Docker bridge network (`ai-judge-network`) with zero external host port exposure.

---

## 🚀 Quick Start / Local Deployment

The entire 9-container cluster can be compiled, provisioned, and launched using a single terminal command.

### Prerequisites
* **Docker Engine** (v24.0+) & **Docker Compose** (v2.20+)
* **OpenSSL** or terminal utility to generate random passwords

### Step-by-Step Launch

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/YourUsername/ai-online-judge.git
   cd ai-online-judge
   ```

2. **Configure Environment Variables**:
   Copy the provided `.env.example` template to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(See the [Environment Configuration Guide](#-environment-configuration--api-guide) below for instructions on populating keys).*

3. **Launch the Cluster via Makefile**:
   ```bash
   make up
   ```
   *Or directly via Docker Compose:*
   ```bash
   docker-compose up --build -d
   ```

4. **Verify Cluster Health**:
   Check service initialization and running status:
   ```bash
   make ps
   ```

Once initialized, access the frontend application at **[http://localhost:3000](http://localhost:3000)**.
RabbitMQ Management UI is accessible at **[http://localhost:15672](http://localhost:15672)** (`judge` / `secure_rabbitmq_password`).

---

## ⚙️ Environment Configuration & API Guide

### 1. Populating the `.env` File

Before launching the cluster, you must populate `.env` with secure secrets and your OpenAI API credentials.

#### Generating Secure Randomized Secrets
For internal database passwords and cryptographic signing keys, generate secure 256-bit randomized strings using OpenSSL:
```bash
# Run these commands in your terminal and paste the outputs into .env:
openssl rand -base64 32   # Use for POSTGRES_PASSWORD
openssl rand -base64 32   # Use for RABBITMQ_PASSWORD
openssl rand -base64 32   # Use for JWT_SECRET
```

#### Obtaining an OpenAI API Key (`OPENAI_API_KEY`)
The Python AI Tutor (`ai-tutor`) requires an active OpenAI API key with access to `gpt-4o` to generate Socratic hints:
1. Navigate to **[OpenAI API Platform](https://platform.openai.com/api-keys)** and sign into your account.
2. Click **"+ Create new secret key"**, name it `ai-online-judge-virtual-ta`, and copy the generated key (`sk-...`).
3. Paste this key into your `.env` file under `OPENAI_API_KEY`.

### 2. Core API Endpoints

All public REST routes are exposed via the **API Gateway** on port `8080` (prefix `/api/v1` or `/api`).

| HTTP Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | ❌ | Registers a new student and returns an HMAC JWT token. |
| `POST` | `/api/v1/auth/login` | ❌ | Authenticates credentials and returns Bearer token. |
| `GET` | `/api/v1/problems` | ❌ | Lists all available algorithmic problems with difficulty scores. |
| `GET` | `/api/v1/problems/:id` | ❌ | Returns detailed problem specifications and AST tags. |
| `GET` | `/api/v1/problems/:id/recommendation` | ✅ (`Bearer`) | Returns the next adaptive problem recommendation within the student's **ZPD** based on their effort index. |
| `POST` | `/api/v1/submissions` | ✅ (`Bearer`) | Submits Base64-encoded source code (`python3`, `cpp`, `go`). Returns `202 Accepted` (`submission_id`). |
| `GET` | `/api/v1/submissions/:id` | ✅ (`Bearer`) | Returns current verdict and EDM metrics (`execution_time_ms`, `ast_complexity_score`, etc.). |
| `GET` | `/api/v1/users/:id/stats` | ❌ | Returns aggregated effort metrics (`total_submissions`, `cognitive_effort_index`) for student dashboards. |
| `GET` | `/ws?token=<jwt>` *(Port 8082)* | ✅ (`Query`) | Real-time WebSocket stream pushing `verdict` updates and `ai_hint` interventions. |

---

## 🛠️ Cluster Operations (Makefile Commands)

The repository provides an engineering-grade `Makefile` wrapping complex orchestration commands:

```bash
make help       # Displays all available operational commands
make up         # Builds and boots the full 9-container microservice cluster in detached mode
make down       # Gracefully shuts down all containers and scrubs local network bridges
make logs       # Streams live, multi-colored logs across all running microservices
make ps         # Inspects container health checks and port mappings
make restart    # Restarts all microservice containers without triggering rebuilds
make test       # Executes all Go unit tests and AST analysis benchmarks across packages
make check      # Verifies Go cross-service compilation and TypeScript strict type validity
make clean      # Prunes build caches, intermediate images, and Next.js temporary artifacts
```

---

## 📄 License & Academic Attribution

This platform is developed for academic research and evaluation within **Professor Yutaka Watanobe's Laboratory** at the **University of Aizu**. All architectural designs, pedagogical prompts, and effort-based data structures are aligned with the laboratory's published literature on Educational Data Mining and Society 5.0 smart educational environments.
