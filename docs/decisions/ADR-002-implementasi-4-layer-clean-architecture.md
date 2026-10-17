# ADR-002: Implementasi 4-Layer Clean Architecture

> **Architecture Decision Record (ADR) — RekaSains**
> Location: `docs/decisions/ADR-002-implementasi-4-layer-clean-architecture.md`
> Status: ACCEPTED
> Created: 2026-10-17
> Author: RekaSains Architecture Team & AI Pair Engineers
> Deciders: Principal Architect, Backend Lead, Frontend Lead

---

## 1. Context & Problem Statement

Untuk mempertahankan codebase yang tahan lama, mudah diuji tanpa ketergantungan database atau SDK pihak ketiga (seperti Gemini API atau driver database), serta menghindari coupling antar logika domain dan web framework, dibutuhkan standar arsitektur berlapis yang seragam di seluruh service backend (`services/core-api` dan `services/ai-agent`).

---

## 2. Decision

Mewajibkan standar **4-Layer Clean Architecture (Robert C. Martin)** dengan **Inward Dependency Rule**:

1. **Layer 1 — Domain & Entities:**
   - Berisi entity murni, struct/model domain, value objects, dan konstanta kesalahan domain.
   - 100% bebas dari framework web, ORM, atau pustaka eksternal.
   - Contoh: [`models.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/domain/models.py), [`catalog_knowledge.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/domain/catalog_knowledge.py), [`models.go`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/core-api/internal/domain/models.go).
2. **Layer 2 — Application Use Cases:**
   - Berisi workflow bisnis dan aturan orkestrasi domain.
   - Menggunakan prinsip Dependency Inversion (port interfaces untuk repository dan gateway).
   - Contoh: [`inventory_usecase.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/usecase/inventory_usecase.py), [`step_vision_usecase.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/usecase/step_vision_usecase.py), [`inventory_usecase.go`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/core-api/internal/usecase/inventory_usecase.go).
3. **Layer 3 — Interface Adapters:**
   - Berisi HTTP Handlers/Controllers, Sub-Agent Adapters, Presenters, Repository implementations, dan Event Stream adapters.
   - Contoh: [`google_adk_engine.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/agents/google_adk_engine.py), [`api.py`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/ai-agent/app/delivery/http/api.py), [`handlers.go`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/core-api/internal/delivery/http/handlers.go), [`seeded_store.go`](file:///d:/Tugas/SEMESTER%207/Monorepo/services/core-api/internal/repository/seeded_store.go).
4. **Layer 4 — Frameworks & Drivers:**
   - Web framework router (Gin, FastAPI), drivers (pgx, redis), external SDKs (Google ADK Gemini SDK), entrypoint app (`main.go`, `main.py`).

**Inward Dependency Rule:** Layer N hanya boleh mengimpor Layer N-1. Dependensi tidak pernah mengarah keluar ke layer yang lebih luar.

---

## 3. Rationale & Alternatives Considered

- **Alternatif A: Transaction Script / Flat Structure (Semua kode dalam satu direktori)**
  - *Kelemahan:* Logika database tercampur dengan HTTP routing, sulit melakukan mocking dalam testing, sulit menerapkan fallback cerdas deterministik saat AI offline.
- **Alternatif B: Framework-Centric MVC**
  - *Kelemahan:* Mengikat logika bisnis ke spesifik framework (Gin atau FastAPI). Jika ingin mengganti framework atau mengeksekusi logika via CLI/Worker/gRPC, kode harus ditulis ulang.
- **Mengapa 4-Layer Clean Architecture Menang:**
  - Kemudahan testing luar biasa: Unit test dapat menguji use case secara 100% deterministik dan offline tanpa database atau API eksternal (terbukti pada `test_ai_agent.py` dan `rekasains_usecases_test.go`).
  - Kompatibel dengan arsitektur Zero-Broker: Use case tidak peduli apakah event dipancarkan via SSE, HTTP callback, atau background task.

---

## 4. Consequences

- **Positif:**
  - Kode sangat modular, mudah dibaca, dan independen terhadap framework.
  - Test suite berjalan super cepat (< 1 detik) tanpa mocking kompleks server eksternal.
  - Struktur yang konsisten mempermudah agen AI lain menavigasi kode secara deterministik.
- **Trade-offs / Mitigasi:**
  - Jumlah file interface/port lebih banyak: dimitigasi dengan struktur direktori yang baku dan seragam di Go maupun Python.
