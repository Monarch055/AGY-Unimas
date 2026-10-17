req:
User menginstruksikan: "Silahkan langsung saja klaim / implementasikan services/ai-agent itu"
Sesi ini (**Session `11-47`**) mengklaim dan mengimplementasikan **Sub-Bagian Phase 2: `services/ai-agent` (Python 3.12+ / FastAPI + 6-Sub-Agent Google ADK Engine)** dengan arsitektur **Dual-Mode Google ADK** (Integrasi native Google ADK / Gemini API + Rich Deterministic Science Knowledge Engine Fallback agar 100% dapat dieksekusi & diuji secara offline tanpa ketergantungan API key eksternal).

initial_plan:
1. Update `docs/context/06-CURRENT-STATE.md` untuk mengonfirmasi klaim `services/ai-agent` oleh Session `11-47`.
2. Implementasikan arsitektur 4-Layer Clean Architecture untuk `services/ai-agent`:
   - **Layer 1 (Domain):** Sudah siap di `app/domain/models.py` & `app/domain/catalog_knowledge.py`.
   - **Layer 2 (Use Cases):**
     - `app/usecase/inventory_usecase.py`: Ekstraksi inventaris visual & deteksi bahaya ko-lokasi aktif.
     - `app/usecase/recommendation_usecase.py`: 3-Tier Matcher & penelusuran substitusi fungsi fisika/kimia.
     - `app/usecase/scaffold_usecase.py`: 4-Level Age-Adaptive Scaffolding (`SD`, `SMP`, `SMA`, `HIGHER_ED_UNI`).
     - `app/usecase/step_vision_usecase.py`: AI Step Vision Checker & AR Coordinate Anchoring `(x_norm, y_norm)`.
     - `app/usecase/lab_report_usecase.py`: Automated Academic PDF Lab Report Synthesizer.
   - **Layer 3 (Adapters):**
     - `app/agents/google_adk_engine.py`: Orkestrasi 6 Sub-Agent Google ADK (`VisionInventoryAgent`, `ResourceMatcherAgent`, `CurriculumScaffolderAgent`, `SafetyGuardianAgent`, `StepVisionAndARAgent`, `LabReportSynthesizerAgent`).
     - `app/delivery/http/api.py`: FastAPI endpoints (`/ai/v1/health`, `/ai/v1/vision/scan`, `/ai/v1/recommendations/match`, `/ai/v1/curriculum/scaffold/{slug}`, `/ai/v1/vision/verify-step`, `/ai/v1/lab-report/synthesize`, `/ai/v1/events/stream`).
   - **Layer 4 (Infrastructure & App):**
     - `app/infrastructure/config.py`: Pengaturan konfigurasi Gemini API & port server.
     - `app/main.py`: Inisialisasi FastAPI app dengan dual-routing (`/ai/v1` dan `/v1`), CORS, dan background tasks.
3. Buat file pengujian otomatis `tests/test_ai_agent.py` dan jalankan dengan python.
4. Update `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` menjadi `🟢 COMPLETED` untuk `services/ai-agent`.

revision:
- [Gate 3 Review 1 - Dual Routing Prefix]: Endpoint harus dapat diakses via `/ai/v1/*` (sesuai Caddyfile dan internal gateway) maupun `/v1/*` untuk memastikan integrasi mulus dengan `services/core-api`.
- [Gate 3 Review 2 - Zero External Broker]: Menggunakan `BackgroundTasks` dan in-memory SSE broadcaster untuk streaming event tanpa RabbitMQ.
- [Gate 3 Review 3 - Co-Location Hazard 100% Recall]: Ketika `sodium_hypochlorite` dan `floor_cleaner_acidic` terdeteksi bersamaan, sistem wajib menghasilkan `CRITICAL_CO_LOCATION_WARNING`.

final_plan:
1. Perbarui `docs/context/06-CURRENT-STATE.md` untuk mengonfirmasi pengerjaan oleh Session `11-47`.
2. Tulis seluruh modul usecase di `app/usecase/`.
3. Tulis implementasi agent di `app/agents/google_adk_engine.py`.
4. Tulis HTTP API handlers di `app/delivery/http/api.py`.
5. Tulis infrastructure config dan entrypoint di `app/infrastructure/config.py` dan `app/main.py`.
6. Tulis dan jalankan test suite di `tests/test_ai_agent.py`.
7. Perbarui status menjadi `🟢 COMPLETED` di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md`.
8. Buat laporan verifikasi `.Artifacts/2026-10-17/11-47/result.md`.
