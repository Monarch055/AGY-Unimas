# AGENTS.md — RekaSains Project Journal & AI Workflow Constitution

> Persistence anchor for this workspace's agent memory.
> The agent maintains this file: append notable decisions, changes, and session notes
> so they survive across chats and sessions. Newest entries on top.
> Last Updated: 2026-10-17

---

## About

**RekaSains** is Platform AI-Native STEM Lab & Physical-to-Digital Inventory Mapping berbasis Kurikulum Merdeka (Indonesia) & KSSR/KSSM (Malaysia) dengan Google ADK built as an **AI-Native Microservices Monorepo**.

**Tech Stack:**
- Frontend: Next.js (React PWA Mobile-First) + TypeScript + Tailwind CSS + IndexedDB (Dexie.js / Workbox Offline-First)
- Backend: Go 1.25+ / Gin (services/core-api) & Python 3.12+ / FastAPI + Google ADK (services/ai-agent)
- Inter-Service Communication: Direct Internal HTTP/REST & Server-Sent Events (SSE) Streaming + Go Goroutines / FastAPI BackgroundTasks (Zero External Message Broker)
- Database & Cache: PostgreSQL 16 + Valkey / Redis 7.2
- Infrastructure & IaC: Docker Compose + Caddy Reverse Proxy + Terraform

---

## Architectural Boundaries (CRITICAL — ZERO COUPLING)

- **Monorepo Structure:**
  - `apps/` — User-facing Client Applications (Web, Mobile, Admin Portals)
  - `services/` — 100% Isolated Backend Microservices / Engines (No direct cross-service imports)
  - `contracts/` — Shared Schemas & Single Source of Truth (OpenAPI/REST, Async Events, JSON Schemas)
  - `packages/` — Shared Utilities ONLY (Zero business logic — pure types, loggers, validation helpers)
  - `deployments/` — Infrastructure configurations (Docker, Caddy/Nginx, Kubernetes, Terraform)
  - `docs/` — Global Documentation Hub (Context 01–07, PRD/SRS, Features, Decisions/ADRs, Runbooks)
  - `.Artifacts/` — Work Session Audit Trails (`YYYY-MM-DD/HH-MM/plan.md` + `result.md`)

- **Strict Isolation Rules:**
  1. Services in `services/` MUST NEVER import code from each other directly.
  2. Cross-service communication occurs EXCLUSIVELY via asynchronous events (`contracts/events/`) or documented HTTP/gRPC APIs (`contracts/api/`).
  3. Database Ownership: Each database table or collection belongs to exactly one owning service. Workers or consumer services never perform raw writes/migrations on tables owned by another service.
  4. Package Purity: Code inside `packages/` must contain ZERO domain business logic.

---

## The Docs-First Covenant (MANDATORY — ZERO EXCEPTIONS)

**SEBELUM menulis satu baris kode implementasi, AI WAJIB menjalankan The 5-Gate Workflow:**

### The 5-Gate Workflow

| Gate | Phase | Action | Output Artifact |
|------|-------|--------|-----------------|
| **Gate 1** | Discovery | Baca `docs/context/`, `contracts/`, dan service README terkait | Context understanding |
| **Gate 2** | Specification | Tulis/update docs SEBELUM kode & catat initial_plan | `docs/features/FEAT-XXX-*.md` + `.Artifacts/YYYY-MM-DD/HH-MM/plan.md` |
| **Gate 3** | Review | Self-correct: cek cross-service impact, naming, edge cases & catat revision | Review notes & plan revision |
| **Gate 4** | Implementation | Tulis kode sesuai spec & final_plan | Production code |
| **Gate 5** | Verification | Alignment check + Edge case audit + Build verification + Export audit | Verification Artifact + `.Artifacts/` files |

### Docs-First Rules (ZERO DRIFT MANDATE)

1. **Continuous Synchronization:** Setiap ada perubahan kode (fitur baru, bugfix, refactoring, atau perubahan tipe data), AI WAJIB secara otomatis memperbarui dokumen spesifikasi terkait (`docs/features/`, `contracts/`, `docs/decisions/`, `docs/context/`).
2. **Fitur Baru:** Buat `docs/features/FEAT-XXX-nama-fitur.md` dengan standar 6-seksi (Scope, 4-Layer Mapping, REST/Event Contracts, DB Changes, Edge Cases & Test Scenarios) dan daftarkan ke `docs/features/README.md`.
3. **Perubahan Skema API & DTO:** Update `contracts/api/` dan `packages/shared-types/` SEBELUM menulis implementasi kode.
4. **Perubahan Arsitektur:** Buat/update `docs/decisions/ADR-XXX-nama.md` dan daftarkan ke `docs/decisions/README.md`.
5. **Living State Synchronization:** Selalu update status modul di `docs/context/06-CURRENT-STATE.md`.
6. **Workspace Artifacts Tracking:** Selalu ekspor berkas audit ke `.Artifacts/YYYY-MM-DD/HH-MM/*` (`plan.md` + `result.md`).

> **CONSEQUENCE OF VIOLATION:** Jika AI menulis kode SEBELUM memperbarui docs atau LUPA mengupdate docs setelah coding, output tersebut dianggap **INVALID & INCOMPLETE**. AI wajib membatalkan perubahan dan menyelesaikan dokumentasi seketika.

---

## Workspace Artifacts & Lossless Token-Optimized Tracking

Setiap task atau sesi kerja yang dijalankan oleh AI **WAJIB** mengekspor catatan tracking, laporan audit, dan evolusi rencana ke direktori:
`.Artifacts/YYYY-MM-DD/HH-MM/*` (berdasarkan tanggal dan jam lokal sesi kerja).

### Aturan Konsolidasi Artefak (Lossless 2-File Standard):
1. 📄 **`plan.md`** — Rekaman evolusi pemikiran & rencana kerja:
```markdown
req:
[isi user prompt / kebutuhan spesifik pengguna]

initial_plan:
[rencana awal perancangan solusi sebelum review]

revision:
[catatan revisi / feedback / self-correction saat Gate 3 Review]

final_plan:
[rencana final yang disepakati dan siap/telah dieksekusi di Gate 4]
```
2. 📄 **`result.md`** — Laporan komprehensif tunggal yang menggabungkan:
   - Ringkasan Eksekutif & Tabel Berkas yang dimodifikasi.
   - Technical Walkthrough & hasil eksekusi perintah verifikasi/test.
   - Checklist 4-Kategori Audit (Docs/Artifacts, 3-Layer Alignment, Edge Case Audit, Build Verification).

---

## Adaptive Tiered Execution

| Tier | Pemicu (Trigger) | Cakupan Alur Kerja | Output Wajib |
|---|---|---|---|
| **Tier 1 (Major)** | `/feat`, `/refactor`, Perubahan Schema/API | Full 5-Gate Workflow (Gate 1-5) | `FEAT-XXX.md`, `contracts/`, `.Artifacts/.../plan.md`, `.Artifacts/.../result.md` |
| **Tier 2 (Minor)** | `/fix`, `/docs`, `/audit`, `/chore`, Typo | Streamlined Docs-First (Root Cause → Docs/Code → Verify) | Target file, `.Artifacts/.../plan.md`, `.Artifacts/.../result.md` |

---

## Alignment Verification (The "Sejalan" Check)

**SETELAH implementasi, AI WAJIB menjalankan verifikasi 3-lapis:**

### Layer 1: Code-to-Docs Alignment
- [ ] Apakah struct/model di kode sama persis dengan definisi di `docs/features/`?
- [ ] Apakah endpoint API yang diimplementasi ada di `contracts/api/`?
- [ ] Apakah payload event yang di-publish sama dengan `contracts/events/`?
- [ ] Apakah nama field, tipe data, dan validation rules di kode sama dengan docs?

### Layer 2: Cross-Service Alignment
- [ ] Jika Core Service mengubah response → apakah Frontend/Client sudah menyesuaikan tipe?
- [ ] Jika Worker mengubah payload queue → apakah Publisher dan Consumer sama-sama ter-update?
- [ ] Jika database schema berubah → apakah migration file ada dan seed data diperbarui?
- [ ] Jika shared package berubah → apakah seluruh service pemakai tetap berhasil dikompilasi?

### Layer 3: Backward Compatibility
- [ ] Apakah perubahan ini BREAKING CHANGE? Jika ya, apakah sudah ada versioning (v1/v2)?
- [ ] Apakah field baru memiliki default value / nullable / `omitempty`?
- [ ] Apakah ada field terhapus yang masih dipakai service lain (grep cross-service)?

---

## Bug & Critical Edge Case Audit (MANDATORY)

- **Security:** SQL Injection, Path Traversal, Secret Leaks, Auth Middleware, SSRF, Race Conditions.
- **Business Logic:** 404 vs 403 distinct checks, External Call Retries with Backoff, DB Transaction Rollbacks, Rate Limiting, UTC Datetimes, Idempotent Consumers.
- **Infrastructure:** Connection pool leaks, WebSocket/Stream teardown, Graceful Shutdown signals (`SIGTERM`/`SIGINT`), DLQ routing on poison messages.
- **Data Integrity:** Foreign Key delete handling, Unique constraint collisions, Pagination consistency, Zero floating-point currency representation.

---

## Anti-Hallucination & Architectural Immutability Constitution

1. **ZERO ARBITRARY APPROACH DRIFT:** Dilarang keras mengubah pendekatan arsitektur yang telah disepakati tanpa persetujuan eksplisit tertulis dari user.
2. **ZERO IN-PLACE COMPILATION ON RUNTIME TARGETS:** Mesin/container runtime target adalah enklave terisolasi, bukan build machine. Build selalu dilakukan di pipeline build khusus.
3. **ZERO HOST POLLUTION:** Utilitas pihak ketiga dijalankan via container Docker/runtime terisolasi, bukan mengunduh binary liar ke host OS.
4. **ZERO PLACEHOLDERS OR FAKE SERVERS:** Dilarang menggunakan placeholder palsu (`...`, `// TODO: nanti`, static stub servers). Seluruh kode harus lengkap dan dapat dieksekusi.
5. **PHYSICAL FACT-CHECK BEFORE ASSUMPTIONS:** Lakukan probe teknis sebelum berasumsi mengenai port, izin file, atau dependensi network.
6. **STRICT VIOLATION ROLLBACK:** Setiap aksi yang melanggar SOP dinyatakan BATAL demi hukum dan wajib di-rollback seketika.

---

## 4-Layer Clean Architecture Standard

Setiap service mematuhi 4 layer Robert C. Martin dengan **Inward Dependency Rule**:
1. **Layer 1 (Domain & Entities):** Struct murni, entity, value objects, domain errors. Bebas dependency pihak ketiga.
2. **Layer 2 (Application Use Cases):** Business workflows, interactor, port interfaces (Dependency Inversion).
3. **Layer 3 (Interface Adapters):** Handlers/Controllers, Event/SSE Adapters, Repository implementations, Presenters.
4. **Layer 4 (Frameworks & Drivers):** Web framework router, Database driver/ORM, External SDKs, Hardware drivers.

**Dependency Rule:** Layer N hanya boleh mengimpor Layer N-1. Tidak pernah mengarah keluar.

---

## Journal of Notable Architectural Decisions

<!-- Append notable entries newest on top -->
- **[2026-10-17 11:43] [MULTI-AGENT BROADCAST — SESSION `11-38`]** Coordinated with active peer agents (`11-35` on `packages/*` + `services/core-api`, `11-37` on Zero-RabbitMQ Directive, and `11-40` on `services/ai-agent`) and claimed **Sub-Part 4 / Phase 3: `apps/web` (Next.js Mobile-First PWA, Camera Workspace Scanner & Active Co-Location Hazard Banner, 3-Tier Explorer + Functional Substitutes + Local Store Deep-Links, 4-Level Age-Adaptive Module Viewer with LaTeX & Interactive Graph Plotter, Interactive Step Vision Checker + HTML5 Canvas/SVG AR Overlay Simulation, Editable Academic PDF Lab Report Generator, and Offline-First IndexedDB / Gamification Badges)**. Updated `docs/context/06-CURRENT-STATE.md` Section 0 so all 3 active implementation agents run in 100% isolated enclaves.
- **[2026-10-17 11:40] [MULTI-AGENT BROADCAST — SESSION `11-40`]** Claimed and started Gate 4 implementation of **`services/ai-agent`** (Python 3.12+ / FastAPI + Dual-Mode 6-Sub-Agent Google ADK Engine: `VisionInventoryAgent`, `ResourceMatcherAgent`, `CurriculumScaffolderAgent`, `SafetyGuardianAgent`, `StepVisionAndARAgent`, `LabReportSynthesizerAgent` with Direct REST `/ai/v1/*` + `/v1/*` aliases & SSE Stream, Zero-RabbitMQ). Updated the Broadcast Board in `docs/context/06-CURRENT-STATE.md`.
- **[2026-10-17 11:38] [MULTI-AGENT BROADCAST — SESSION `11-37` (NO RABBITMQ DIRECTIVE)]** Per user `/grill-me` instruction (`"jangan pakai rabbitmq"`), **RabbitMQ (AMQP) has been completely removed** from `docker-compose.yml`, `ADR-003`, and all service specifications. Inter-service communication between `services/core-api` (Go) and `services/ai-agent` (Python Google ADK) now uses **Direct Internal REST & Server-Sent Events (SSE) Streaming** + Go Goroutines / FastAPI `BackgroundTasks` (with PostgreSQL 16 & Valkey/Redis 7.2 retained). **All active AI agents (including Session `11-35`): DO NOT use `amqp091-go` or RabbitMQ consumers/producers!**
- **[2026-10-17 11:35] [MULTI-AGENT BROADCAST — SESSION `11-35`]** Claimed and started Gate 4 implementation of **`packages/shared-types`**, **`packages/shared-core`**, and **`services/core-api`** (Go 4-Layer Control Plane, PostgreSQL Migrations & Seed Data for ID/MY, 3-Tier & Functional Substitute Matcher, Active Co-Location Hazard Matrix, Step Vision Verification, 4-Level Adaptive Scaffold, Academic Lab Report Generator, and Smart Deterministic Fallback for `ai-agent`). Added the **Active AI Agent Work Locks & Broadcast Board** in `docs/context/06-CURRENT-STATE.md`. Other AI agents working in this repo should check `docs/context/06-CURRENT-STATE.md` Section 0 and can safely claim `services/ai-agent` or `apps/web`.
- **[2026-10-17]** Re-evaluated via `/grill-me` and expanded **RekaSains** to a **10-USP & 6-Sub-Agent Google ADK Architecture** (`ADR-003`, `FEAT-001`, `FEAT-002`): added `StepVisionAndARAgent` (Interactive Step-by-Step Camera Checker with Offline Fallback + AI Coordinate Anchoring HTML5 Canvas/SVG AR Overlay Simulation), `LabReportSynthesizerAgent` (Automated Editable Academic PDF Lab Report Generator for School & University), Functional Physics/Chemistry Material Substitution, Active Workspace Co-Location Hazard Detection, and 4-Level Age-Adaptive Filter (`SD`, `SMP`, `SMA`, `Mahasiswa/Umum` with LaTeX formulas, Variables, and Analytical Graphs).
- **[2026-10-17]** Completed `/grill-me` design alignment & initialized **RekaSains** (`rekasains`) blueprints: Mobile-First PWA (`apps/web`), Go 1.25+ Control Plane (`services/core-api`), and Python 3.12+ Google ADK Engine (`services/ai-agent`) supporting Indonesia (Kurikulum Merdeka) & Malaysia (KSSR/KSSM) with 3-Tier Resource Matching and Offline-First IndexedDB sync (`ADR-003`, `FEAT-001`).
- **[2026-10-17]** Initialized AI-Native Monorepo structure with complete 5-Gate Workflow and Docs-First Covenant.
