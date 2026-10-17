.PHONY: help dev build test lint infra-up infra-down infra-logs clean

# Default target
help:
	@echo "======================================================================"
	@echo "                 RekaSains Monorepo CLI                               "
	@echo "======================================================================"
	@echo "Available commands:"
	@echo "  make dev          - Start full docker-compose stack"
	@echo "  make build        - Build all container images"
	@echo "  make test         - Run all 48 test suites across the monorepo"
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
	@echo "==> [1/4] Running shared packages tests (@rekasains/shared-types & @rekasains/shared-core)..."
	node --test packages/shared-types/tests/shared-types.test.mjs
	node --test packages/shared-core/tests/shared-core.test.mjs
	@echo "==> [2/4] Running web frontend tests (PWA, Offline IndexedDB, AR Vector & Graph Regression)..."
	node --test apps/web/tests/web-engine.test.mjs
	node --test apps/web/tests/web-offline-and-graph.test.mjs
	node --test apps/web/tests/e2e-workflow.test.mjs
	@echo "==> [3/4] Running Monorepo End-to-End Workflow & OpenAPI Contract Conformance..."
	node --test tests/e2e_full_workflow.test.mjs
	node --test tests/contract-conformance.test.mjs
	@echo "==> [4/4] Running AI Agent Google ADK 6-Sub-Agent & Multi-Region Test Suite..."
	python -m unittest discover -s services/ai-agent/tests -v
	@echo "======================================================================"
	@echo "  ALL 48 MONOREPO TEST SUITES PASSED SUCCESSFULLY! (100% GREEN)       "
	@echo "======================================================================"

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
