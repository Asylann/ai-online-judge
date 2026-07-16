# ==============================================================================
# AI Online Judge — Polyglot Monorepo Makefile
# Target Architecture: Prof. Yutaka Watanobe's Laboratory (University of Aizu)
# ==============================================================================

.PHONY: help up down logs ps restart test build clean check loadtest

# Default target
help:
	@echo "AI Online Judge — Microservice Cluster Operations"
	@echo "================================================="
	@echo "Available commands:"
	@echo "  make up       : Build and launch all 9 microservices in detached mode"
	@echo "  make down     : Stop and tear down all containers, networks, and volumes"
	@echo "  make logs     : Stream real-time logs across all services"
	@echo "  make ps       : Check health and status of all running containers"
	@echo "  make restart  : Restart all services without rebuilding"
	@echo "  make test     : Run Go unit tests and AST analysis benchmarks"
	@echo "  make check    : Verify Go compilation and TypeScript type integrity"
	@echo "  make loadtest : Stress-test RabbitMQ & API Gateway (500 concurrent student VUs via k6)"
	@echo "  make clean    : Remove build artifacts, local caches, and stopped containers"

up:
	@echo "Launching AI Online Judge cluster (Go, Python, Next.js, PostgreSQL, Redis, RabbitMQ)..."
	docker-compose -f deployments/docker-compose.yml up --build -d
	@echo "Cluster operational! Access dashboard at http://localhost:3000"

down:
	@echo "Tearing down cluster and cleaning up local volumes..."
	docker-compose -f deployments/docker-compose.yml down -v
	@echo "Cluster shutdown complete."

logs:
	docker-compose -f deployments/docker-compose.yml logs -f

ps:
	docker-compose -f deployments/docker-compose.yml ps

restart:
	docker-compose -f deployments/docker-compose.yml restart

test:
	@echo "Running Go unit & integration tests..."
	go test -v -cover ./...

check:
	@echo "Checking Go compilation across all backend microservices..."
	go build ./...
	@echo "Checking TypeScript type validity across Next.js frontend..."
	cd frontend && npx tsc --noEmit
	@echo "All structural & type checks passed."

build:
	docker-compose build

loadtest:
	@echo "Running k6 spike test (500 concurrent VUs) against API Gateway and RabbitMQ cluster..."
	docker run --rm -i --add-host=host.docker.internal:host-gateway -e API_URL="http://host.docker.internal:8080/api/v1" grafana/k6 run - < loadtests/submission_spike.js

clean:
	@echo "Cleaning temporary files and build artifacts..."
	go clean
	rm -rf frontend/.next
	docker system prune -f --volumes
