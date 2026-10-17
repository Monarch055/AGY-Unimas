req:
User menginisiasi proyek baru melalui sesi interaktif `/grill-me` di atas template AI-Native Monorepo untuk membangun aplikasi pemetaan alat/bahan praktikum otomatis dan rekomendasi eksperimen STEM berbasis kurikulum Indonesia & Malaysia dengan 5 Unique Selling Points (USP):
1. Physical-to-Digital Inventory Mapping (Pindai & Ekstraksi Bahan Otomatis dari foto area kerja/barang bekas).
2. Multi-Item Interaction Logic (Strict Resource Constraint 100% bahan tersedia + rekomendasi DIY substitusi & belanja lokal).
3. Curriculum-Aligned STEM Scaffolding (Konsep STEM, Langkah Interaktif, Safety Check otomatis, Soal Diskusi & Refleksi sesuai Kurikulum Merdeka ID & KSSR/KSSM MY).
4. Hyper-Localized & Low-Cost Adaptation (Adaptasi istilah lokal Indonesia & Malaysia, bahan bekas/rumah tangga, serta rekomendasi toko sekitar Warung/MR.DIY/Kedai Runcit dengan estimasi harga Rp/RM & smart deep-links).
5. Gamifikasi & Modul Offline-First (PWA dengan penyimpanan modul di IndexedDB, checklist interaktif, kuis refleksi, opsional foto bukti praktikum, dan sistem Badges/XP).

Hasil keputusan arsitektur dari sesi `/grill-me`:
- Nama Proyek: **RekaSains** (`rekasains`)
- Client Platform: **Progressive Web App (PWA) Mobile-First** di `apps/web` (Next.js/React + TypeScript + Tailwind CSS + IndexedDB/Workbox).
- Target Persona & Kurikulum: **Dual-Mode (Siswa & Guru)** untuk jenjang SD–SMA/SMK, mendukung **Kurikulum Merdeka (Indonesia: Fase A–F)** dan **KSSR/KSSM (Malaysia: Darjah 1–6 & Tingkatan 1–5)**.
- Backend & AI Stack: **Dual-Service Architecture** di `services/`:
  - `services/core-api`: **Go (Golang + Gin + PostgreSQL/SQLC)** untuk Auth, Inventaris Fisik, Katalog Bahan & Kurikulum, Gamifikasi, serta Offline Sync.
  - `services/ai-agent`: **Python + FastAPI + Google ADK (Agent Development Kit)** untuk orkestrasi 4 Sub-Agent (`VisionInventoryAgent`, `ResourceMatcherAgent`, `CurriculumScaffolderAgent`, `SafetyGuardianAgent`).
- Strategi Rekomendasi: **3-Tier Matching** ((1) 100% Siap Praktik / Strict Match, (2) Modifikasi DIY dari barang bekas, (3) Belanja Lokal Murah dengan harga Rp/RM & deep-link Maps/Marketplace).
- Knowledge Base: **Hybrid (Database Katalog Terkurasi di PostgreSQL + Google ADK Multi-Agent Synthesis)** dengan komunikasi Sync REST/Streaming + Async RabbitMQ.

initial_plan:
1. Menjalankan Gate 1 (Discovery) untuk memetakan seluruh berkas template monorepo yang masih memiliki placeholder `RekaSains` dkk.
2. Menjalankan Gate 2 (Specification) dengan menginisialisasi identitas proyek **RekaSains** di seluruh konstitusi AI (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `README.md`, `docker-compose.yml`, `Makefile`, `deployments/*`, `docs/setup/ENV-VARIABLES.md`).
3. Menyusun cetak biru arsitektur lengkap di `docs/context/01-PROJECT-BRIEF.md` s.d. `07-STANDARDS-RULES.md`.
4. Mendefinisikan enclave `services/ai-agent/README.md` (Python + Google ADK 4-Layer Clean Architecture) dan memperbarui `services/core-api/README.md` serta `apps/web/README.md`.
5. Mencatat keputusan arsitektur di `docs/decisions/ADR-003-google-adk-hybrid-multi-agent-architecture.md` dan memperbarui `docs/decisions/README.md`.
6. Menyusun kontrak Single Source of Truth di `contracts/api/openapi.yaml` dan `contracts/events/PAYLOAD_CONTRACT.md`, serta spesifikasi fitur perdana `docs/features/FEAT-001-physical-to-digital-inventory-and-adk-matching.md`.

revision:
- [Gate 3 Self-Correction 1 - Isolasi Antar-Service]: Memastikan `services/core-api` (Go) dan `services/ai-agent` (Python Google ADK) mematuhi aturan Zero Direct Import. Pertukaran data sinkron dilakukan melalui internal REST contract (`/internal/v1/adk/*` & `/v1/*`) dan asinkron melalui RabbitMQ (`rekasains.events`).
- [Gate 3 Self-Correction 2 - Keamanan Kombinasi Bahan (Safety Check)]: Memastikan `SafetyGuardianAgent` tidak hanya mengandalkan probabilitas LLM, melainkan wajib memvalidasi daftar bahan terhadap tabel deterministik `safety_hazard_rules` (contoh: larangan pencampuran NaOCl/Pemutih dengan Asam Cuka atau Amonia) sebelum modul praktikum boleh dikembalikan ke pengguna.
- [Gate 3 Self-Correction 3 - Lokalisasi Kembar Indonesia & Malaysia]: Memastikan skema `canonical_materials` dan `local_store_recommendations` di `FEAT-001` serta `openapi.yaml` membedakan secara eksplisit kode region (`ID` vs `MY`), mata uang (`IDR` vs `MYR`), istilah lokal (`name_id` vs `name_my`), serta jenis toko (`Warung/Indomaret/Toko Bangunan` vs `Kedai Runcit/MR.DIY/Eco-Shop`).

final_plan:
1. Substitusi seluruh variabel template (`RekaSains` -> `RekaSains`, dll.) pada seluruh berkas konfigurasi monorepo.
2. Tulis dokumen blueprint `docs/context/01-PROJECT-BRIEF.md` hingga `07-STANDARDS-RULES.md` secara komprehensif sesuai hasil `/grill-me`.
3. Buat dokumentasi arsitektur enclave `services/ai-agent/README.md` dan perbarui `services/core-api/README.md` & `apps/web/README.md`.
4. Buat `docs/decisions/ADR-003-google-adk-hybrid-multi-agent-architecture.md` dan daftarkan ke `docs/decisions/README.md`.
5. Perbarui `contracts/api/openapi.yaml` dan `contracts/events/PAYLOAD_CONTRACT.md` dengan skema REST & Event RekaSains.
6. Buat spesifikasi fitur lengkap `docs/features/FEAT-001-physical-to-digital-inventory-and-adk-matching.md` dan daftarkan di `docs/features/README.md`.
7. Verifikasi bebas placeholder (`{{...}}`) di seluruh monorepo dan ekspor laporan akhir ke `.Artifacts/2026-10-17/11-16/result.md`.
