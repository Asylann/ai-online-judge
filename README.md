# AI Online Judge — Polyglot Asynchronous Microservices Platform

An advanced, production-grade competitive programming and AI-guided educational evaluation platform built inside a Polyglot Monorepo using Asynchronous Choreography, Real-Time WebSockets, and Educational Data Mining (EDM).

---

## Executive Summary

The AI Online Judge is a high-concurrency, full-stack programming assessment platform engineered to demonstrate the union of secure sandboxed execution, asynchronous microservices, and adaptive artificial intelligence. Unlike traditional online judges that record merely binary pass/fail outcomes, this platform captures deep, multi-dimensional Educational Data Mining (EDM) metrics to quantify student cognitive effort, identify structural logic deviations via Abstract Syntax Trees (ASTs), and dynamically scaffold learning paths.

The architecture strictly decouples high-throughput REST API traffic from resource-intensive compilation and AI pipelines using RabbitMQ choreography and Redis Pub/Sub bridges, delivering real-time, zero-latency feedback directly to the student's browser editor via dedicated WebSocket hubs.

---

## Project Motivation & Research Inspiration

This platform was developed as an independent project inspired by the Smart Learning and Society 5.0 research methodologies pioneered by Professor Yutaka Watanobe’s Laboratory at the University of Aizu, Japan (creators of the Aizu Online Judge). It is built as a proof-of-concept to demonstrate advanced technical capabilities and pedagogical alignment for future presentation and potential academic acceptance.

Key pedagogical and architectural implementations inspired by this research include:
* **Observer & Launcher/Executor Architecture:** Code execution is strictly isolated using dedicated launcher daemons inside Linux sandboxes (isolate), monitored continuously by observer watchdogs that terminate runaway processes (SIGKILL).
* **Effort-Based EDM Metrics:** Submissions track granular effort indicators including execution time, memory usage, attempt counts, submission latency gaps, and AST complexity scores to formulate a cognitive effort index.
* **gotreesitter AST Structural Analysis:** Utilizes pure Go Tree-sitter runtime parsing (without CGO overhead) to extract structural syntax features, loop depths, and algorithmic complexity scores in microseconds.
* **Socratic Virtual TA (Minimal Edits Pedagogy):** When a student encounters a structural or logical error (Wrong Answer), the Python AI Tutor (FastAPI + OpenAI GPT-4o-mini) intervenes using strict Socratic pedagogy. It never outputs corrected solutions; instead, it formulates guiding questions requiring the minimal possible code edit.
* **Content-Based Recommendation System (CBRS) inside ZPD:** Utilizes effort-driven CBRS. By evaluating the student's cognitive effort index on their latest submission, the engine recommends algorithmic challenges precisely calibrated within their Zone of Proximal Development (ZPD).

---

## Architecture Overview

The platform implements an Asynchronous Choreography Pattern inside a unified Polyglot Monorepo. Services communicate via typed AMQP event messages and low-latency internal HTTP connections.

### Microservice Responsibility Matrix

| Microservice | Language / Framework | Primary Responsibility |
| :--- | :--- | :--- |
| `api-gateway` | Go (Gin) | Central REST gateway, JWT authentication, rate limiting, and AMQP producer. |
| `judge-worker` | Go (AMQP) | Asynchronous queue consumer, Base64 decoding, native execution, and verdict persistence. |
| `ast-service` | Go (gotreesitter) | Microsecond AST parsing, structural complexity calculation, and error deviation scoring. |
| `ai-tutor` | Python (FastAPI) | Virtual TA pedagogical engine utilizing OpenAI GPT-4o-mini with strict Socratic system prompts. |
| `websocket-service` | Go (gorilla/ws) | Dedicated WebSocket hub subscribing to Redis Pub/Sub for zero-polling push. |
| `frontend` | React (Next.js 14) | SSR Pages / CSR Editor for ultra-premium UI featuring Monaco Editor, Recharts charts, and ZPD modals. |

---

## Technology Stack

| Domain | Technology | Engineering Rationale |
| :--- | :--- | :--- |
| **Backend Core** | Go (Golang 1.22) | Highly concurrent Goroutines handle heavy polling/judge routines with minimal memory footprint. |
| **AI / NLP Service** | Python 3.12 + FastAPI | Industry standard for LLM integration, Pydantic type safety, and async I/O. |
| **Frontend Web App** | Next.js 14 + TypeScript | Hybrid Server-Side Rendering (SSR) for SEO/performance + Client-Side Rendering (CSR) for real-time code editing. |
| **Code Editor** | Monaco Editor | Same core engine as VS Code; provides syntax highlighting, line numbering, and LSP readiness. |
| **Primary Database** | PostgreSQL 15 | ACID transactional integrity, high-performance indexing, and native JSONB support for AST snapshots. |
| **Message Broker** | RabbitMQ | Provides explicit ACK/NACK delivery guarantees, preventing submission loss if workers restart. |
| **Cache & Pub/Sub** | Redis 7 | Sub-millisecond rate limiting (DDoS protection) and decoupled Pub/Sub channel distribution. |
| **Sandbox Environment**| Judge0 (isolate Linux kernel) | Kernel-level isolation using Linux namespaces, cgroups v2, and seccomp-bpf. |
| **AST Parser Engine** | gotreesitter | Pure Go implementation of Tree-sitter, ensuring memory safety without CGO cross-compilation complexity. |
| **Generative AI** | OpenAI API (GPT-4o-mini) | High-reasoning semantic engine tuned via strict system prompts for educational scaffolding. |

---

## Security Boundaries & Defense-in-Depth

The platform operates on a zero-trust, cybersecurity-first methodology designed to safely evaluate arbitrary, potentially malicious code submitted by users.

1. **Kernel-Level Sandbox Isolation (isolate)**:
   * **Network Stripping**: Executed student code inside the sandbox runs with an empty network namespace, preventing socket creation or data exfiltration.
   * **Resource Bounding**: Enforces hard memory ceilings, CPU execution timeouts, and process limit constraints.
   * **System Call Filtering**: Blocks privileged system calls, ensuring escape vectors are neutralized at the kernel boundary.
2. **Mandatory Base64 Payload Encoding**:
   * All source code submissions must be Base64-encoded on the client before network transmission, eliminating character encoding mismatches and injection vulnerabilities.
3. **Application & Network Layer Security**:
   * **HMAC-SHA256 JWT Authentication**: All protected REST routes and WebSocket handshakes enforce cryptographic signature verification.
   * **Subnet Isolation**: Backend microservices reside on an isolated Docker bridge network with zero external host port exposure.

---

## CI/CD Deployment Flow (GHCR)

The platform utilizes GitHub Actions to securely build, package, and deploy all microservices to resource-constrained environments (e.g., 1GB RAM VMs).

1. **Automated Build & Push**: On push to `master`, GitHub Actions builds all Docker containers (`frontend`, `api-gateway`, `judge-worker`, etc.) and pushes them to the GitHub Container Registry (GHCR).
2. **Remote Server Pull**: The workflow securely SSHes into the production server, pulls the pre-built GHCR images, and restarts the cluster via `docker compose`.
3. **Low Memory Footprint**: By offloading the build step to GitHub's CI runners, the production server avoids memory spikes (OOM errors) and only runs the compiled containers.

### Server Requirements & Execution
- **Docker Engine** (v24.0+) & **Docker Compose** (v2.20+)
- **GitHub PAT**: Server must be authenticated with `ghcr.io` using a read-only Personal Access Token.
- **Execution Command**: 
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```

---

## Environment Configuration

Before launching the cluster, you must populate `.env` with secure secrets and your OpenAI API credentials.

1. Generate secure 256-bit randomized strings for `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, and `JWT_SECRET`.
2. Provide your OpenAI API Key under `OPENAI_API_KEY`.
3. Configure `SERVER_HOST`, `SERVER_USER`, and `SSH_PRIVATE_KEY` inside your GitHub repository secrets for the deployment workflow.
