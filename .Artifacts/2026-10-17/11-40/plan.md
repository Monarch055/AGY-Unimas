req:
User menginstruksikan melalui `/grill-me`: "baca direktori ini dan baca spesifikasinya dan kerjakan implementasi berdasarkan plan, kerja sub bagian dan beritahu updatenya agar agen ai lain yang kerja di repository yang sama tau".
Berdasarkan hasil koordinasi `/grill-me` dan pemeriksaan papan **Active AI Agent Work Locks & Broadcast Board** di `docs/context/06-CURRENT-STATE.md`:
1. Agen `11-35` sedang mengerjakan `packages/shared-types`, `packages/shared-core`, dan `services/core-api`.
2. Agen `11-37` telah mengeluarkan direktif arsitektur **NO RABBITMQ** (komunikasi antar-service menggunakan **Direct Internal HTTP/REST & Server-Sent Events (SSE) Streaming** + **FastAPI `BackgroundTasks`**).
3. Sesi ini (**Session `11-40`**) mengklaim dan mengimplementasikan **Sub-Bagian Phase 2: `services/ai-agent` (Python 3.12+ / FastAPI + 6-Sub-Agent Google ADK Engine)** dengan arsitektur **Dual-Mode Google ADK** (Live `google-adk` Gemini + Rich Deterministic Science Knowledge Engine Fallback agar 100% dapat dieksekusi & diuji tanpa ketergantungan API key eksternal), lalu mengumumkan pembaruan status secara real-time di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md`. Jika setelah selesai `apps/web` masih berstatus `AVAILABLE TO CLAIM`, sesi ini dapat melanjutkan ke `apps/web`.

initial_plan:
1. Klaim `services/ai-agent` pada tabel **Active AI Agent Work Locks & Broadcast Board** di `docs/context/06-CURRENT-STATE.md` dan tambahkan entri broadcast di `AGENTS.md` sebagai **Session `11-40`**.
2. Implementasikan `services/ai-agent` dengan 4-Layer Clean Architecture (Zero-RabbitMQ, Direct REST + SSE + FastAPI `BackgroundTasks`):
   - **Layer 1 (`app/domain/`):** Entities, Enums, Value Objects, Normalized AR Coordinate Validator (`[0.0, 1.0]`), Zero Floating-Point Currency (`IDR` integer & `MYR_SEN` integer), dan DTO Schemas yang selaras 1:1 dengan `contracts/api/openapi.yaml` v1.1.0 & `packages/shared-types`.
   - **Layer 2 (`app/usecase/`):** Interactor workflows untuk ke-6 kapabilitas utama (`ScanWorkspaceInventoryUseCase`, `MatchThreeTierAndSubstitutesUseCase`, `ScaffoldAdaptiveExperimentUseCase`, `VerifyStepVisionAndARUseCase`, `SynthesizeAcademicLabReportUseCase`).
   - **Layer 3 (`app/agents/` & `app/delivery/http/`):**
     - Implementasi **6 Sub-Agent Google ADK (`google-adk`)**:
       1. `VisionInventoryAgent` (USP #1 & #7)
       2. `ResourceMatcherAgent` (USP #2, #3, #4 — 3-Tier & Functional Physics/Chemistry Material Substitutes)
       3. `CurriculumScaffolderAgent` (USP #5 & #6 — 4-Level Age-Adaptive `SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI` dengan rumus LaTeX, Variabel, & Skema Grafik)
       4. `SafetyGuardianAgent` (USP #7 — Active Co-Location Hazard Detection `CRITICAL_CO_LOCATION_WARNING` & `CRITICAL_HAZARD_BLOCKED`)
       5. `StepVisionAndARAgent` (USP #8 & #9 — Interactive Step-by-Step AI Vision Checker + Normalized AR Coordinate Anchoring `(x_norm, y_norm)`)
       6. `LabReportSynthesizerAgent` (USP #10 — Automated Academic PDF Lab Report Draft Generator)
     - FastAPI REST & SSE Router (`/ai/v1/*` dan alias `/v1/*` untuk kompatibilitas penuh dengan `services/core-api` & `Caddyfile`).
   - **Layer 4 (`app/infrastructure/` & `app/main.py`):** Dual-Mode ADK Runner Bootstrap, In-Memory SSE Event Broadcaster & `BackgroundTasks` Telemetry Dispatcher, FastAPI app factory, `requirements.txt`, `pyproject.toml`, dan `Dockerfile`.
3. Tulis dan jalankan suite pengujian komprehensif (`tests/test_ai_agent.py`) untuk memverifikasi ke-6 Sub-Agent, 100% recall pada deteksi bahaya ko-lokasi (`sodium_hypochlorite` + `floor_cleaner_acidic`), substitusi fungsi fisika/kimia (`pvc_pipe_half_inch` -> `thick_plastic_straw` / `cardboard_roll_core`), koordinat AR ternormalisasi `[0.0, 1.0]`, modul 4-jenjang (SD s.d. Universitas), dan sintesis Laporan Praktikum.
4. Perbarui `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` menjadi `🟢 COMPLETED` untuk `services/ai-agent` agar agen AI lain mengetahui layanan siap digunakan.

revision:
- [Gate 3 Self-Correction 1 - Dual Prefix Routing (`/ai/v1` & `/v1`)]: Agar baik `Caddyfile` (`/ai/v1/*`), `openapi.yaml` (`/ai/v1/*`), maupun HTTP client internal di `services/core-api` dapat memanggil endpoint tanpa risiko mismatch path, FastAPI router di `services/ai-agent` wajib me-mount seluruh endpoint pada `/ai/v1` sekaligus `/v1` serta menyediakan `/health` di root dan prefix.
- [Gate 3 Self-Correction 2 - Zero-RabbitMQ SSE & Background Callback Compliance]: Sesuai direktif Session `11-37` ("jangan pakai rabbitmq"), `services/ai-agent` sama sekali tidak menggunakan `pika`/`aio-pika` atau AMQP. Sebagai gantinya, setiap penyelesaian tugas agen memancarkan amplop event standar (`RekaSainsEventEnvelope` v1.1) melalui `BackgroundTasks` ke SSE Stream (`/ai/v1/events/stream`) dan opsional webhook callback ke `core-api`.
- [Gate 3 Self-Correction 3 - Smart Payload Inspection untuk Vision Scan & Step Checker]: Pada mode deterministik/fallback maupun multimodal, `VisionInventoryAgent` dan `StepVisionAndARAgent` dapat mengenali petunjuk metadata/hint yang dikirim di dalam base64/header maupun menjalankan ekstraksi katalog standar ID/MY sehingga pengujian otomatis untuk skenario *Safe Workspace* vs *Co-Located Bleach + Acid Hazard* berjalan 100% deterministik dan akurat.

final_plan:
1. Update `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` untuk mengklaim `services/ai-agent` (`🟡 IN_PROGRESS — Session 11-40`).
2. Buat struktur 4-Layer Clean Architecture di `services/ai-agent/app/` (`domain/`, `usecase/`, `agents/`, `delivery/http/`, `infrastructure/`, `main.py`) beserta `requirements.txt`, `pyproject.toml`, dan `Dockerfile`.
3. Buat dan jalankan unit & integration tests di `services/ai-agent/tests/test_ai_agent.py` menggunakan Python yang terinstal di mesin untuk memverifikasi seluruh endpoint dan 6 Sub-Agent ADK.
4. Update `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` menjadi `🟢 COMPLETED` untuk `services/ai-agent`, lalu periksa apakah `apps/web` masih `AVAILABLE TO CLAIM` untuk dikerjakan selanjutnya.
5. Dokumentasikan hasil verifikasi di `.Artifacts/2026-10-17/11-40/result.md`.
