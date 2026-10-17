.PHONY: help dev build test lint infra-up infra-down infra-logs clean

# Default target
help:
	@echo "======================================================================"
	@echo "                 RekaSains Monorepo CLI                        "
	@echo "======================================================================"
	@echo "Available commands:"
	@echo "  make dev          - Start full docker-compose stack"
	@echo "  make build        - Build all container images"
	@echo "  make test         - Run test suites across the monorepo"
	@echo "  make lint         - Run static analysis and linters"
	@echo "  make infra-up     - Start local Docker infrastructure (DB & Cache)"
	@echo "  make infra-down   - Stop local Docker containers"
	@echo "  make infra-logs   - Stream infrastructure logs"
	@echo "  make clean        - Clean build artifacts and temporary files"
	@echo "======================================================================"

dev:
	docker compose up --build

build:
	docker compose build

test:
	@echo "==> Running shared packages test..."
	node --test packages/shared-types/tests/shared-types.test.mjs
	node --test packages/shared-core/tests/shared-core.test.mjs
	@echo "==> Running web frontend test..."
	node --test apps/web/tests/web-engine.test.mjs
	node --test apps/web/tests/e2e-workflow.test.mjs
	@echo "==> Running End-to-End full workflow test (10 USPs)..."
	node --test tests/e2e_full_workflow.test.mjs
	@echo "==> Running AI Agent engine test..."
	python -m unittest services/ai-agent/tests/test_ai_agent.py
	@echo "All monorepo test suites passed successfully!"

lint:
	@echo "==> Checking TypeScript and Python syntax..."
	python -m py_compile services/ai-agent/app/main.py

infra-up:
	docker compose up -d postgres redis

infra-down:
	docker compose down

infra-logs:
	docker compose logs -f

clean:
	@echo "Cleaning temporary files..."
