.PHONY: help dev build test lint infra-up infra-down infra-logs clean

# Default target
help:
	@echo "======================================================================"
	@echo "                 RekaSains Monorepo CLI                        "
	@echo "======================================================================"
	@echo "Available commands:"
	@echo "  make dev          - Start frontend & backend development servers"
	@echo "  make build        - Build all apps and microservices"
	@echo "  make test         - Run test suites across the monorepo"
	@echo "  make lint         - Run static analysis and linters"
	@echo "  make infra-up     - Start local Docker infrastructure (DB, Cache, etc.)"
	@echo "  make infra-down   - Stop local Docker infrastructure"
	@echo "  make infra-logs   - Stream infrastructure logs"
	@echo "  make clean        - Clean build artifacts and temporary files"
	@echo "======================================================================"

dev:
	@echo "Starting development environment..."

build:
	@echo "Building all services and applications..."

test:
	@echo "Running tests across monorepo..."

lint:
	@echo "Running linters..."

infra-up:
	docker compose up -d

infra-down:
	docker compose down

infra-logs:
	docker compose logs -f

clean:
	@echo "Cleaning temporary files..."
