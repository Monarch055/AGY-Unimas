req:
User menginstruksikan melalui `/grill-me`: "jangan pakai rabbitmq".
Berdasarkan konfirmasi interaktif:
- Hapus container dan dependensi **RabbitMQ (AMQP)** sepenuhnya dari `docker-compose.yml`, konfigurasi environment, dan arsitektur layanan.
- Gunakan **Direct Internal REST & Server-Sent Events (SSE) Streaming** antara `services/core-api` (Go) dan `services/ai-agent` (Python Google ADK), dikombinasikan dengan **Go Goroutines / FastAPI `BackgroundTasks`** untuk pekerjaan asinkron ringan, serta pertahankan **PostgreSQL 16** dan **Valkey / Redis 7.2** untuk database dan caching.

initial_plan:
1. Hapus service `rabbitmq` dan volume `rabbitmq_data` dari `docker-compose.yml`.
2. Hapus variabel `RABBITMQ_*` dari `docs/setup/ENV-VARIABLES.md`.
3. Perbarui `AGENTS.md` dan `CLAUDE.md` untuk mengganti Message Broker RabbitMQ menjadi Direct Internal REST/SSE + In-Process Background Tasks.
4. Perbarui `docs/context/02-ARCHITECTURE.md`, `04-PROBLEMS-CONSTRAINTS.md`, `05-SOLUTION-APPROACH.md`, `06-CURRENT-STATE.md`, dan `07-STANDARDS-RULES.md`.
5. Perbarui `ADR-003`, `contracts/events/PAYLOAD_CONTRACT.md`, `services/core-api/README.md`, `services/ai-agent/README.md`, `FEAT-001`, dan `FEAT-002`.

revision:
- [Gate 3 Self-Correction 1 - Ketahanan Tanpa Message Broker]: Karena tidak menggunakan RabbitMQ, komunikasi `services/core-api` -> `services/ai-agent` wajib menerapkan HTTP Timeout yang terukur, Exponential Backoff Retry (3x) pada kegagalan jaringan transien, serta penyimpanan status di PostgreSQL (`status = 'PROCESSING' | 'COMPLETED' | 'FAILED'`) untuk pembuatan modul atau laporan praktikum.
- [Gate 3 Self-Correction 2 - Kontrak Payload (`contracts/events/PAYLOAD_CONTRACT.md`)]: Alih-alih menghapus berkas kontrak di `contracts/events/`, perbarui berkas tersebut menjadi **Internal SSE Stream & Background Callback Payload Contracts** agar struktur amplop event antar-service tetap terdokumentasi secara baku tanpa RabbitMQ.

final_plan:
1. Bersihkan `docker-compose.yml` dan `docs/setup/ENV-VARIABLES.md` dari RabbitMQ.
2. Perbarui `AGENTS.md`, `CLAUDE.md`, dan `docs/context/02..07`.
3. Perbarui `ADR-003`, `contracts/events/PAYLOAD_CONTRACT.md`, `services/core-api/README.md`, `services/ai-agent/README.md`, `FEAT-001`, dan `FEAT-002`.
4. Verifikasi melalui pencarian teks bahwa tidak ada lagi dependensi aktif ke RabbitMQ di konfigurasi utama, lalu ekspor `.Artifacts/2026-10-17/11-37/result.md`.
