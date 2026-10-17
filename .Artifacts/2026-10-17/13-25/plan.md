req:
User menanyakan "mana env nya?" karena belum ada file `.env` maupun `.env.example` fisik di root direktori monorepo (hanya terdokumentasi di docs/setup/ENV-VARIABLES.md).

initial_plan:
1. Buat berkas `.env.example` di root monorepo yang memuat template konfigurasi lengkap (Next.js frontend, Go core-api, Python ai-agent/Google ADK, PostgreSQL, Valkey/Redis).
2. Buat berkas `.env` di root monorepo siap pakai untuk development lokal dengan default value yang aman.
3. Buat juga `.env.example` di `apps/web/` untuk panduan khusus Next.js jika user menjalankan app secara independen.
4. Informasikan ke user letak dokumen acuan (`docs/setup/ENV-VARIABLES.md`) dan file `.env` serta `.env.example` yang baru saja dibuat.

revision:
Pastikan variabel `AI_AGENT_BASE_URL` dan `AI_AGENT_URL` konsisten dengan pemakaian di `services/core-api` dan `docker-compose.yml`, serta `GEMINI_API_KEY` untuk Google ADK / Gemini API.

final_plan:
1. Buat `.env.example` di root monorepo.
2. Buat `.env` di root monorepo.
3. Buat `apps/web/.env.example`.
4. Verifikasi dan ekspor `result.md`.
5. Berikan penjelasan ringkas dan jelas kepada user.
