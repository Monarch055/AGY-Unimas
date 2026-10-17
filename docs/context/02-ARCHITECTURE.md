# 02-ARCHITECTURE: System Topology, Monorepo Boundaries & 6-Agent Google ADK Flow (Zero-Broker Direct REST/SSE)

> **Blueprint 02:** Master Technical Architecture, Service Topology & Communication Protocols
> Location: `docs/context/02-ARCHITECTURE.md`

---

## 1. High-Level Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (`apps/web`)                          │
│       Next.js Mobile-First PWA (TypeScript + Tailwind CSS + Workbox SW)        │
│ ┌────────────────────┬────────────────────┬──────────────────┬───────────────┐ │
│ │ Workspace Scanner  │ AI Vision Step     │ HTML5 Canvas/SVG │ Academic PDF  │ │
│ │ & Active Hazard UI │ Checker & Offline  │ AR Simulation    │ Lab Report &  │ │
│ │ (ID & MY)          │ Lab Pack (Dexie)   │ Overlay Engine   │ Graph Plotter │ │
│ └────────────────────┴─────────┬──────────┴────────┬─────────┴───────────────┘ │
└────────────────────────────────┼───────────────────┼───────────────────────────┘
                                 │ HTTPS / REST / SSE│
┌────────────────────────────────▼───────────────────▼───────────────────────────┐
│                      REVERSE PROXY / GATEWAY (`deployments/proxy`)             │
│                                  [Caddy Server]                                │
└───────────────────┬────────────────────────────────────────┬───────────────────┘
                    │ /v1/*                                  │ /ai/v1/*
┌───────────────────▼──────────────────────┐ ┌───────────────▼───────────────────┐
│   `services/core-api` (Go 1.25 / Gin)    │ │ `services/ai-agent` (Python/ADK)  │
│  4-Layer Clean Architecture              │ │ FastAPI + 6-Agent Google ADK      │
│  - Auth & 4-Tier Age Profiles (SD..Uni)  │ │ ┌───────────────────────────────┐ │
│  - Physical Inventory & Substitute Graph │ │ │ 1. VisionInventoryAgent       │ │
│  - Deterministic 3-Tier Set-Matcher      │◄┼─┤ 2. ResourceMatcherAgent       │ │
│  - Curriculum & Local Store Catalog      │ │ │ 3. CurriculumScaffolderAgent  │ │
│  - Active Co-Location Hazard Matrix      │ │ │ 4. SafetyGuardianAgent        │ │
│  - Lab Report Persistence & Gamification │ │ │ 5. StepVisionAndARAgent       │ │
│  - Go Goroutines Background Workers      │ │ │ 6. LabReportSynthesizerAgent  │ │
│                                          │ │ └───────────────────────────────┘ │
└─────────┬────────────────────────────────┘ └───────────────┬───────────────────┘
          │        Direct Internal HTTP/REST & SSE           │
          │◄────────────────────────────────────────────────►│
          ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           PERSISTENCE & CACHING LAYER                          │
│  [PostgreSQL 16: Inventory, Substitutes, Curricula, Hazard Rules] [Valkey 7.2] │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structural Enclaves

| Enclave | Directory | Tech Stack | Isolation & Ownership Rule |
|---------|-----------|------------|----------------------------|
| **Web PWA** | `apps/web/` | Next.js, React, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), HTML5 Canvas/SVG AR, PDF Builder | Client-side PWA Offline-First; merender overlay simulasi AR, grafik variabel SMA/Mahasiswa, dan pratinjau PDF Laporan Praktikum. |
| **Core API** | `services/core-api/` | Go 1.25+, Gin, pgx/sqlc, Standard `net/http` Client + Goroutines | Control plane utama & pemilik tunggal database PostgreSQL (`users`, `canonical_materials`, `functional_substitutes`, `experiments`, `curriculum_standards`, `safety_hazard_rules`, `lab_reports`, `badges`). |
| **AI Agent Engine** | `services/ai-agent/` | Python 3.12+, FastAPI, **Google ADK** (`google-adk`), Gemini 2.5 Flash/Pro, `BackgroundTasks` | Mesin cerdas **6 Sub-Agent** untuk Computer Vision inventaris, substitusi fungsi fisika/kimia, scaffolding 4-jenjang, verifikasi langkah kamera + anchoring AR, guardrail keselamatan aktif, dan sintesis laporan praktikum PDF. |
| **Contracts** | `contracts/` | OpenAPI 3.0.3 (`openapi.yaml`), Internal SSE & Background Callback Schemas | Single Source of Truth untuk seluruh komunikasi REST maupun streaming SSE. |
| **Shared Packages** | `packages/` | TypeScript (`shared-types`, `shared-core`) | Murni definisi tipe data DTO, skema vektor AR, konstanta error, dan utilitas bebas logika bisnis. |
| **Deployments** | `deployments/` | Docker Compose, Caddyfile, Terraform | Konfigurasi container (`postgres` & `valkey` — tanpa RabbitMQ), reverse proxy, dan IaC. |

---

## 3. Google ADK 6-Sub-Agent Architecture (`services/ai-agent`)

Di dalam `services/ai-agent`, alur kecerdasan buatan diorkestrasi menggunakan **Google Agent Development Kit (ADK)** dengan **6 Sub-Agent terspesialisasi**:

1. **`VisionInventoryAgent` (Multimodal Inventory & Co-Location Perception Agent — USP #1 & #7):**
   - Menerima foto meja kerja atau tumpukan barang bekas, menghitung kuantitas (`quantity`, `unit`), memetakan ke *Canonical Material Taxonomy* (`material_slug`, `name_id`, `name_my`), serta menandai objek berbahaya yang berada di satu area meja kerja.
2. **`ResourceMatcherAgent` (3-Tier Matcher & Functional Material Substitute Agent — USP #2, #3, #4):**
   - Mengklasifikasikan rekomendasi eksperimen ke dalam **Tier 1 (`STRICT_100`)**, **Tier 2 (`DIY_SUBSTITUTE`)**, dan **Tier 3 (`LOCAL_MICRO_SHOP`)**, serta menyarankan **Substitusi Bahan Berfungsi Fisika/Kimia Serupa** (misal: kekurangan pipa PVC $\rightarrow$ sedotan plastik tebal / gulungan karton bekas).
3. **`CurriculumScaffolderAgent` (4-Level Age-Adaptive Pedagogical Agent — USP #5 & #6):**
   - Menyusun dan mengadaptasi modul eksperimen sesuai **Kurikulum Merdeka/DIKTI (Indonesia)** & **KSSR/KSSM/Universiti (Malaysia)** ke dalam **4 Tingkat Kesulitan Adaptif (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`)**.
4. **`SafetyGuardianAgent` (Active Hazard Detection & Deterministic Gatekeeper Agent — USP #7):**
   - Mendeteksi ko-lokasi bahan berisiko tinggi di meja (misal: *pembersih lantai asam* + *pemutih pakaian*) dan memunculkan **Peringatan Merah (`CRITICAL_CO_LOCATION_WARNING`)** sebelum eksperimen dimulai.
5. **`StepVisionAndARAgent` (Interactive Step Vision Checker & AR Coordinate Overlay Agent — USP #8 & #9):**
   - Memverifikasi foto langkah perakitan pengguna dan mengekstrak koordinat ternormalisasi `(x_norm, y_norm)` untuk menggambar lapisan animasi **AR Overlay** (`ELECTRON_FLOW`, `FORCE_VECTOR`, `FLUID_PRESSURE`) menggunakan HTML5 Canvas/SVG di atas benda nyata.
6. **`LabReportSynthesizerAgent` (Automated Academic Lab Report Generator Agent — USP #10):**
   - Menganalisis foto hasil akhir eksperimen dan data pengamatan untuk menyusun **Laporan Praktikum Digital Lengkap (PDF)** siap kumpul ke guru atau dosen.

---

## 4. Communication Patterns (Direct Internal REST & SSE — Zero External Broker)

1. **Direct Synchronous Internal REST (`/ai/v1/*`):**
   - `services/core-api` memanggil `services/ai-agent` secara langsung melalui HTTP internal (`http://127.0.0.1:8081/ai/v1/*`) dengan timeout terukur dan *Exponential Backoff Retry*, dilengkapi *Smart Deterministic Fallback* apabila layanan AI sedang tidak terjangkau.
2. **Server-Sent Events (SSE) & In-Process Background Tasks:**
   - Untuk proses pembuatan modul mendalam atau caching di latar belakang, digunakan **Go Goroutines** di `services/core-api` dan **`BackgroundTasks`** di FastAPI (`services/ai-agent`) tanpa memerlukan container message broker eksternal seperti RabbitMQ.
