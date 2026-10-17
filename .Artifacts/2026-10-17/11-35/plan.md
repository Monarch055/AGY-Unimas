req:
User menjalankan `/grill-me` dan meminta untuk membaca direktori serta spesifikasi, mengerjakan implementasi berdasarkan plan pada sub-bagian tertentu (`packages/shared-types` & `services/core-api`), serta memperbarui papan status di repositori agar agen AI lain yang bekerja di repositori yang sama mengetahui sub-bagian mana yang sedang dikerjakan dan yang telah selesai.

Hasil penyelarasan `/grill-me`:
1. **Sub-Bagian yang Diklaim Agen Ini (Session `11-35`):**
   - Sinkronisasi penuh `packages/shared-types` (TypeScript DTOs untuk seluruh skema `contracts/api/openapi.yaml` v1.1.0 & `contracts/events/PAYLOAD_CONTRACT.md`).
   - Implementasi penuh **Phase 1: `services/core-api` (Go 1.25+ / Gin 4-Layer Clean Architecture)** meliputi:
     - Database Migrations & Seed Katalog Lokal Indonesia (`ID` - `Rp`) & Malaysia (`MY` - `RM`), Tabel `functional_substitutes` (misal: Pipa PVC -> Sedotan Tebal / Gulungan Karton), Tabel `curriculum_standards` 4-Jenjang (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`), Tabel `safety_hazard_rules` (`CRITICAL_CO_LOCATION_WARNING` & `CRITICAL_HAZARD_BLOCKED`), serta Katalog Eksperimen lengkap dengan Rumus LaTeX, Variabel, Step Vision Criteria, dan AR Overlay Vectors.
     - Layer 1 (`internal/domain`): Entities, Value Objects, Domain Errors (Zero external dependencies).
     - Layer 2 (`internal/usecase`): `InventoryUseCase` (Scan + Active Co-Location Safety Check), `RecommendationMatcherUseCase` (Deterministic 3-Tier `STRICT_100`, `DIY_SUBSTITUTE` dengan Functional Physics/Chemistry Substitutes, `LOCAL_MICRO_SHOP` dengan Harga Integer `IDR`/`MYR_SEN` & Smart Deep-Links), `ExperimentScaffoldUseCase` (4-Level Age-Adaptive Module), `StepVisionVerifyUseCase` (Vision Step Verification + Normalized AR Coordinates `0.0-1.0`), `LabReportUseCase` (Academic Lab Report Synthesis & Persistence), dan `OfflineSyncUseCase` (Idempotent `client_mutation_id` sync & Badges/XP).
     - Layer 3 (`internal/delivery/http`, `internal/delivery/amqp`, `internal/repository`, `internal/gateway`): Gin REST Handlers sesuai `openapi.yaml`, In-Memory/PostgreSQL Dual-Mode Repository (dengan pre-seeded data katalog ID/MY agar langsung berjalan baik dengan maupun tanpa DB eksternal), serta HTTP/AMQP Client ke `services/ai-agent` dengan **Smart Deterministic Fallback**.
     - Layer 4 (`internal/infrastructure`, `cmd/api/main.go`, `Dockerfile`): Server bootstrap, CORS & Request-ID middleware, Graceful Shutdown (`SIGINT`/`SIGTERM`).
2. **Mekanisme Koordinasi Antar-Agen AI:**
   - Memasang tabel **"Active AI Agent Work Locks & Broadcast Board"** di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` dengan status `🟡 IN_PROGRESS` saat mulai dikerjakan dan `🟢 COMPLETED` saat selesai diverifikasi.

initial_plan:
1. Pasang klaim kerja ("Active AI Agent Work Locks & Broadcast Board") di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` agar agen AI lain tidak menimpa `packages/shared-types` dan `services/core-api`.
2. Sinkronkan `docs/context/07-STANDARDS-RULES.md` dengan arsitektur 6-Sub-Agent terbaru.
3. Implementasikan `packages/shared-types` (`package.json`, `tsconfig.json`, `src/index.ts`) dan `packages/shared-core` (`package.json`, `tsconfig.json`, `src/index.ts`).
4. Implementasikan `services/core-api` mengikuti 4-Layer Clean Architecture beserta SQL migrations, unit tests, dan Dockerfile.
5. Jalankan verifikasi build/typecheck dan perbarui Broadcast Board menjadi `🟢 COMPLETED` beserta laporan `.Artifacts/2026-10-17/11-35/result.md`.

revision:
- [Gate 3 Self-Correction 1 - Dual-Mode Repository (PostgreSQL + Seeded In-Memory Store)]: Agar agen AI lain yang mengerjakan `apps/web` atau `services/ai-agent` dapat langsung mengetes seluruh endpoint `/v1/*` tanpa harus menunggu setup container DB manual, `services/core-api` menyediakan `SeededCatalogRepository` yang otomatis memuat seluruh katalog bahan lokal ID/MY, aturan substitusi fungsi fisika/kimia, matriks bahaya aktif (`HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER`, dll.), dan eksperimen 4-jenjang, serta mendukung persistensi PostgreSQL.
- [Gate 3 Self-Correction 2 - Normalized AR Coordinates & Zero Floating-Point Currency Enforcement]: Tambahkan fungsi validasi domain ketat `ValidateNormalizedARCoordinate(val float64)` untuk memastikan koordinat AR berada di $[0.0, 1.0]$, serta pastikan harga bahan lokal disimpan dan dihitung sebagai integer (`int64` untuk `IDR`, `int32` untuk `MYR_SEN`).
- [Gate 3 Self-Correction 3 - TypeScript Strict Compilation Check]: Karena `node` v22.17.0 terinstal di mesin, kita dapat memverifikasi sintaks dan struktur `packages/shared-types` dan `packages/shared-core` secara langsung.

final_plan:
1. Update `docs/context/06-CURRENT-STATE.md`, `AGENTS.md`, dan `docs/context/07-STANDARDS-RULES.md` (Broadcast status `🟡 IN_PROGRESS` untuk `packages/shared-types`, `packages/shared-core`, dan `services/core-api`).
2. Implementasikan `packages/shared-types` dan `packages/shared-core` sesuai kontrak `openapi.yaml` v1.1.0 & `PAYLOAD_CONTRACT.md` v1.1.
3. Buat SQL Migrations (`001_create_inventory_substitutes_and_safety_schema.sql`, `002_create_adaptive_experiments_ar_and_lab_reports.sql`, `003_seed_id_my_catalog_substitutes_and_experiments.sql`) di `services/core-api/migrations/`.
4. Implementasikan 4-Layer Clean Architecture di `services/core-api` (`domain`, `usecase`, `repository`, `gateway`, `delivery/http`, `delivery/amqp`, `infrastructure`, `cmd/api/main.go`, dan unit tests).
5. Update `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` menjadi `🟢 COMPLETED` untuk sub-bagian ini agar agen AI lain mengetahui `packages/shared-types` dan `services/core-api` siap dikonsumsi, lalu ekspor `.Artifacts/2026-10-17/11-35/result.md`.
