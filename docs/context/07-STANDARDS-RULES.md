# 07-STANDARDS-RULES: Engineering Standards & Clean Architecture Rules

> **Blueprint 07:** Coding Guidelines, Layer Constraints & Code Quality Mandates for **RekaSains**
> Location: `docs/context/07-STANDARDS-RULES.md`

---

## 1. 4-Layer Clean Architecture Rules Across Services

Setiap service di dalam `services/` (`services/core-api` dalam Go dan `services/ai-agent` dalam Python + Google ADK) wajib mengikuti kaidah struktur 4-layer (Tanpa RabbitMQ — komunikasi antar-service via Direct Internal REST & SSE Streaming):

### 1.1 Go Service (`services/core-api/`)
1. **Layer 1: Domain (`internal/domain/`)**
   - Berisi entity struct (`CanonicalMaterial`, `FunctionalSubstituteRule`, `InventoryItem`, `ExperimentModule`, `CurriculumStandard`, `SafetyHazardRule`, `StepVerificationLog`, `LabReport`, `OfflineSyncEntry`), value objects, dan domain error constants.
   - **HARAM** mengimpor library pihak ketiga (tanpa database driver, tanpa Gin router, tanpa HTTP context).
2. **Layer 2: Use Cases (`internal/usecase/`)**
   - Berisi interactor bisnis (`InventoryUseCase`, `RecommendationMatcherUseCase`, `ExperimentScaffoldUseCase`, `StepVisionVerifyUseCase`, `LabReportUseCase`, `OfflineSyncUseCase`) dan mendefinisikan repository/gateway port interfaces (DIP).
3. **Layer 3: Interface Adapters (`internal/delivery/http/`, `internal/repository/`, `internal/gateway/`)**
   - Berisi controller REST HTTP/Gin, SSE stream emitter, HTTP client ke `ai-agent` (dengan retry/fallback), dan implementasi repository PostgreSQL/Valkey + Seeded Fallback.
4. **Layer 4: Frameworks & Drivers (`internal/infrastructure/`, `cmd/api/`)**
   - Berisi bootstrap server, connection pool `pgxpool`, in-process background goroutines, dan router initialization.

### 1.2 Python + Google ADK Service (`services/ai-agent/`)
1. **Layer 1: Domain (`app/domain/`)**
   - Berisi Pydantic/dataclass domain models murni (`DetectedItem`, `FunctionalSubstitute`, `SafetyAssessment`, `ScaffoldedModule`, `StepVerificationResult`, `AROverlayPayload`, `LabReportSynthesis`) dan aturan validasi domain.
2. **Layer 2: Use Cases (`app/usecase/`)**
   - Berisi workflow orkestrasi (`ScanInventoryWorkflow`, `MatchAndScaffoldWorkflow`, `VerifyStepAndARWorkflow`, `GenerateLabReportWorkflow`) dan abstraksi port untuk ADK Runner serta Core API Catalog Client.
3. **Layer 3: Interface Adapters (`app/delivery/http/`, `app/agents/`)**
   - Berisi FastAPI REST & SSE routers, `BackgroundTasks` callbacks, dan definisi ke-6 Sub-Agent **Google ADK** (`VisionInventoryAgent`, `ResourceMatcherAgent`, `CurriculumScaffolderAgent`, `SafetyGuardianAgent`, `StepVisionAndARAgent`, `LabReportSynthesizerAgent`) beserta Function Tools-nya.
4. **Layer 4: Frameworks & Drivers (`app/infrastructure/`, `main.py`)**
   - Berisi inisialisasi `google.adk`, konfigurasi Gemini API, SSE broadcaster, dan ASGI server (`uvicorn`).

**Kaidah Dependensi:** Dependensi hanya mengarah ke dalam (Layer 4 $\rightarrow$ Layer 3 $\rightarrow$ Layer 2 $\rightarrow$ Layer 1). Dilarang mengimpor keluar atau melompati layer!

---

## 2. Error Handling, Safety & Logging

- **Zero Panic / Unhandled Exceptions:** Dilarang menggunakan `panic()` di Go atau membiarkan unhandled exception di Python dalam runtime flow. Selalu kembalikan error terbungkus dengan kode standar.
- **Deterministic Safety First:** Evaluasi bahaya kombinasi bahan kimia rumah tangga tidak boleh hanya mengandalkan prompt LLM; wajib dijalankan pengecekan deterministik terhadap daftar pasangan terlarang sebelum hasil ADK dikembalikan.
- **Structured Logging:** Gunakan `log/slog` (Go) dan `structlog`/JSON logger (Python) dengan field kontekstual (`request_id`, `user_id`, `region`, `agent_name`).
- **No Secret Leakage:** Dilarang me-log password, JWT secret, `GEMINI_API_KEY`, atau foto mentah pengguna.

---

## 3. Database, Currency & Migration Standards

- Selalu gunakan migration terurut (`001_create_inventory_substitutes_and_safety_schema.sql`, `002_create_adaptive_experiments_ar_and_lab_reports.sql`, `003_seed_id_my_catalog_substitutes_and_experiments.sql`).
- Seluruh kolom timestamp disimpan dalam `TIMESTAMPTZ` (UTC).
- **Zero Floating-Point Currency:** Harga estimasi lokal wajib disimpan sebagai integer (`est_price_idr BIGINT` untuk Rupiah penuh dan `est_price_myr_sen INT` untuk Sen Ringgit Malaysia).
