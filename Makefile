# ==============================================================================
# AI Online Judge — Polyglot Monorepo Makefile
# Target Architecture: Prof. Yutaka Watanobe's Laboratory (University of Aizu)
# ==============================================================================

.PHONY: help up down logs ps restart test build clean check

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
	@echo "  make clean    : Remove build artifacts, local caches, and stopped containers"

up:
	@echo "Launching AI Online Judge cluster (Go, Python, Next.js, PostgreSQL, Redis, RabbitMQ)..."
	docker-compose up --build -d
	@echo "Cluster operational! Access dashboard at http://localhost:3000"

down:
	@echo "Tearing down cluster and cleaning up local volumes..."
	docker-compose down -v
	@echo "Cluster shutdown complete."

logs:
	docker-compose logs -f

ps:
	docker-compose ps

restart:
	docker-compose restart

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

clean:
	@echo "Cleaning temporary files and build artifacts..."
	go clean
	rm -rf frontend/.next
	docker system prune -f --volumes
