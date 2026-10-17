# Local Development Environment Setup Guide

> **Setup Guide:** Running the full stack on local developer machines
> Location: `docs/setup/LOCAL-DEV.md`

---

## 1. Prerequisites
- Docker Engine & Docker Compose (v2.20+)
- Make / Task runner
- Git

---

## 2. Step-by-Step Setup

### Step 1: Copy Environment Variables
```bash
cp docs/setup/ENV-VARIABLES.md .env
```
Sesuaikan nilai kredensial di dalam file `.env` jika diperlukan.

### Step 2: Spin Up Infrastructure Containers
```bash
make infra-up
# Verify health
docker compose ps
```

### Step 3: Run Database Migrations
Jalankan script migration service yang bersangkutan (misal via task runner atau binary migrate).

### Step 4: Start Applications
```bash
make dev
```
Buka browser pada port yang telah ditentukan (misal `http://localhost:3000`).
