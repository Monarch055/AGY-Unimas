# 05-SOLUTION-APPROACH: Architectural Decisions, 6-Agent Google ADK Strategy & Design Rationale

> **Blueprint 05:** Strategic Design Patterns, Trade-offs & Tech Choices for **RekaSains**
> Location: `docs/context/05-SOLUTION-APPROACH.md`

---

## 1. Core Architectural Patterns

1. **6-Agent Google ADK Orchestration + Deterministic Knowledge Base:**
   - Memadukan kepastian database relasional PostgreSQL (`services/core-api`) dengan kecerdasan multimodal **6 Sub-Agent di Google Agent Development Kit (`services/ai-agent`)**:
     - `VisionInventoryAgent` (Ekstraksi inventaris + deteksi ko-lokasi bahan berbahaya di meja kerja).
     - `ResourceMatcherAgent` (Pencocokan 3-Tier + rekomendasi **Substitusi Bahan Berfungsi Fisika/Kimia Serupa**).
     - `CurriculumScaffolderAgent` (Adaptasi 4 jenjang usia: **SD, SMP, SMA, Mahasiswa/Umum** lengkap dengan rumus $\LaTeX$, variabel bebas/terikat/kontrol, dan skema tabel/grafik).
     - `SafetyGuardianAgent` (Guardrail aktif untuk peringatan merah ko-lokasi bahan kimia rumah tangga & validasi keamanan langkah).
     - `StepVisionAndARAgent` (Verifikasi langkah demi langkah menggunakan kamera + ekstraksi titik koordinat `(x_norm, y_norm)` untuk simulasi **AR Overlay**).
     - `LabReportSynthesizerAgent` (Penyusunan otomatis **Laporan Praktikum Digital Berformat PDF** dari foto hasil akhir dan data pengamatan).
2. **Brokerless Direct Internal REST & SSE Streaming:**
   - Menghilangkan kompleksitas message broker eksternal (tanpa RabbitMQ). Komunikasi antara `services/core-api` dan `services/ai-agent` berlangsung melalui **Direct Internal HTTP/REST & Server-Sent Events (SSE)** ditambah **Go Goroutines** dan **FastAPI `BackgroundTasks`**.
3. **Universal Hardware-Agnostic AR Overlay Simulation (USP #9):**
   - Menggunakan kombinasi **AI Coordinate Anchoring** dari `StepVisionAndARAgent` dan **HTML5 Canvas / SVG Vector Animation Engine** di `apps/web` untuk menampilkan fenomena tak kasat mata (panah aliran arus elektron, vektor gaya, gradien tekanan udara/fluida) tepat di atas foto/kamera objek nyata pengguna.
4. **Offline-Safe Interactive Checkpoints & Dual-Mode PDF Report Generator (USP #8 & #10):**
   - Menjamin pengguna tetap dapat menyelesaikan langkah praktikum dan mengunduh file `.pdf` Laporan Praktikum siap kumpul baik saat terkoneksi ke internet maupun saat terputus dari internet.

---

## 2. Technology Stack Justification

| Layer | Selected Tech | Rationale & Trade-off |
|-------|---------------|-----------------------|
| **Frontend (`apps/web`)** | Next.js (React PWA Mobile-First) + TypeScript + Tailwind CSS + HTML5 Canvas/SVG AR + Client/Server PDF Renderer + Dexie.js | Mendukung kamera scanner, rendering animasi overlay AR 60fps di atas foto benda nyata, grafik analisis interaktif untuk SMA/Mahasiswa, pembuatan PDF laporan praktikum, dan penyimpanan Offline-First di `IndexedDB`. |
| **Core Control Plane (`services/core-api`)** | Go 1.25+ / Gin + pgx/sqlc (4-Layer Clean Architecture) | Kecepatan tinggi untuk pencocokan himpunan bahan 3-Tier, pencarian substitusi fungsi fisika/kimia, validasi matriks bahaya kimia deterministik, dan manajemen laporan praktikum. |
| **AI & Vision Engine (`services/ai-agent`)** | Python 3.12+ / FastAPI + **Google ADK (`google-adk`)** + Gemini 2.5 Flash | Orkestrasi terstruktur untuk ke-6 Sub-Agent ADK dengan dukungan multimodal vision, coordinate detection, dan structured JSON schema output. |
| **Inter-Service Transport** | Direct Internal REST & SSE + Go Goroutines / FastAPI `BackgroundTasks` | Ringan, bebas overhead RAM broker eksternal, mendukung streaming real-time, dan dilengkapi *Smart Deterministic Fallback*. |
| **Database & Cache** | PostgreSQL 16 + Valkey / Redis 7.2 | Penyimpanan relasional & JSONB untuk katalog bahan lokal (`ID` & `MY`), aturan substitusi fungsi fisika/kimia, standar kurikulum, matriks bahaya, dan draf laporan praktikum. |
