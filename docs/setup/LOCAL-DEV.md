# Local Development Environment Setup Guide

> **Setup Guide:** Running the RekaSains full stack on local developer machines
> Location: `docs/setup/LOCAL-DEV.md`
> Architecture: Direct REST & SSE Streaming (Zero-RabbitMQ)

---

## 1. Prerequisites
- **Docker & Docker Compose (v2.20+):** For PostgreSQL 16, Valkey 7.2, and Caddy reverse proxy.
- **Node.js (v20+ or v22+):** For `apps/web` (Next.js PWA) and `@rekasains/shared-*` packages.
- **Go (1.25+):** For `services/core-api` (Control Plane API & Database Migrations).
- **Python (3.12+):** For `services/ai-agent` (FastAPI + Google ADK Engine).
- **Make** or **Task** runner.

---

## 2. Step-by-Step Setup

### Step 1: Copy Environment Variables
```bash
cp docs/setup/ENV-VARIABLES.md .env
```
Sesuaikan konfigurasi pada file `.env` (misalnya `GEMINI_API_KEY` jika menggunakan model cloud aktif, atau gunakan mode fallback bawaan).

### Step 2: Spin Up Infrastructure Containers
Jalankan container database PostgreSQL 16 dan in-memory cache Valkey/Redis 7.2:
```bash
make infra-up
# Atau menggunakan Task:
task infra:up
```
Verifikasi bahwa seluruh container dalam status sehat (`healthy`):
```bash
docker compose ps
```

### Step 3: Run Database Migrations
Migrations SQL untuk PostgreSQL 16 terletak di `services/core-api/migrations/`:
- `001_create_inventory_and_hazards.sql`
- `002_create_stem_experiments_and_modules.sql`
- `003_create_offline_sync_and_reports.sql`

Secara otomatis saat container `core-api` dijalankan atau dieksekusi via `psql`:
```bash
docker exec -i rekasains-postgres psql -U postgres -d rekasains < services/core-api/migrations/001_create_inventory_and_hazards.sql
docker exec -i rekasains-postgres psql -U postgres -d rekasains < services/core-api/migrations/002_create_stem_experiments_and_modules.sql
docker exec -i rekasains-postgres psql -U postgres -d rekasains < services/core-api/migrations/003_create_offline_sync_and_reports.sql
```

### Step 4: Run Services Locally

#### Option A: Running Individually (Development Mode)
1. **Core API (`services/core-api`):**
   ```bash
   cd services/core-api
   go run cmd/api/main.go
   # Listening on http://localhost:8080
   ```
2. **AI Agent (`services/ai-agent`):**
   ```bash
   cd services/ai-agent
   python -m uvicorn app.delivery.http.api:app --host 0.0.0.0 --port 8081 --reload
   # Listening on http://localhost:8081
   ```
3. **Web PWA (`apps/web`):**
   ```bash
   cd apps/web
   npm run dev
   # Listening on http://localhost:3000
   ```

#### Option B: Running Full Stack with Docker Compose
```bash
make full-up
# Atau:
docker compose --profile full up -d
```
Akses aplikasi melalui reverse proxy Caddy di `http://localhost`.

---

## 3. Running Test Suites
Eksekusi pengujian otomatis seluruh enclave monorepo:
```bash
make test
# Atau:
task test
```

Perintah di atas akan menjalankan:
1. `node --test packages/shared-core/tests/shared-core.test.mjs` (5 unit tests)
2. `node --test apps/web/tests/web-engine.test.mjs` (3 integration tests)
3. `python -m unittest services/ai-agent/tests/test_ai_agent.py` (6 API & ADK tests)
4. Go unit tests: `cd services/core-api && go test -v ./...`

---

## 4. Health Probing Endpoints
- **Core API Health:** `http://localhost:8080/v1/health`
- **AI Agent Health & Manifest:** `http://localhost:8081/health` dan `http://localhost:8081/ai/v1/agents/manifest`
- **SSE Event Stream:** `http://localhost:8081/ai/v1/events/stream`
- **Web App:** `http://localhost:3000`
