# SRS-001: RekaSains — Software Requirements Specification & Technical Contracts

> **Software Requirements Specification (SRS)**
> Status: APPROVED
> Version: 1.1.0
> Date: 2026-10-17
> Compliance: 4-Layer Clean Architecture, Zero-RabbitMQ, Docs-First Covenant

---

## 1. System Overview & Architectural Boundaries

Sistem RekaSains terdiri dari enklave-enklave otonom yang berkomunikasi secara terisolasi:
1. **Frontend PWA Client (`apps/web`):**
   - Next.js 14/15 App Router, React 19, Tailwind CSS, TypeScript.
   - Offline-First Storage: IndexedDB (`offline-db.ts`) dengan antrean mutasi idempoten (`client_mutation_id`).
   - Universal Canvas/SVG Engine: Render animasi AR dan plot grafik ilmiah interaktif di viewport browser.
2. **Deterministic Control Plane (`services/core-api`):**
   - Go 1.25+, Gin Web Framework, PostgreSQL 16 (`pgxpool`), Valkey 7.2.
   - Kontrol skema data terpusat, mitigasi balapan (*race condition*), audit trail verifikasi langkah, dan evaluasi matriks bahaya.
3. **AI Multimodal Engine (`services/ai-agent`):**
   - Python 3.12+, FastAPI, Google ADK (`google-adk`), Google Gemini 2.0 Flash SDK.
   - Dual-Mode Architecture: Live multimodal agent dengan fallback instan ke graf pengetahuan lokal (*Knowledge Graph*).
4. **Inter-Service Protocol:**
   - Direct Internal HTTP/REST (Port internal 8080 dan 8081).
   - Server-Sent Events (SSE) streaming (`/ai/v1/events/stream`) tanpa ketergantungan message broker AMQP eksternal.

---

## 2. Functional Requirements (FR)

### FR-01: Vision Inventory Extraction
- Sistem WAJIB mengekstrak nama material kanonik, kuantitas, satuan, dan tingkat keyakinan (*confidence*) dari foto input.
- Format foto: Base64 JPEG/PNG atau URL stream.

### FR-02: Active Co-Location Safety Matrix
- Sistem WAJIB melakukan inspeksi ko-lokasi reagen pada setiap pemindaian foto meja kerja.
- Jika terdeteksi pasangan bahan berisiko fatal (contoh: pemutih `NaOCl` dan asam `HCl`), sistem WAJIB mengembalikan flag `workspace_clear_required: true` dan peringatan berlevel `CRITICAL`.
- Jika resep modul eksperimen menyarankan kombinasi berbahaya, `CurriculumScaffolderAgent` WAJIB menolak proses kompilasi modul dengan status HTTP 422 `SAFETY_GUARDIAN_REJECTED`.

### FR-03: 3-Tier Recommendation & Functional Substitutes
- Sistem WAJIB mengelompokkan modul eksperimen ke dalam 3 tier:
  1. `STRICT_100`: Eksperimen dengan kelengkapan alat/bahan 100%.
  2. `DIY_SUBSTITUTE`: Eksperimen dengan substitusi bahan alternatif rumah tangga berprinsip fisika/kimia serupa.
  3. `LOCAL_MICRO_SHOP`: Eksperimen yang membutuhkan pembelian bahan murah di warung/kedai terdekat.
- Seluruh kalkulasi harga estimasi WAJIB disimpan dalam representasi integer (`IDR` integer Rupiah, `MYR_SEN` integer Sen Ringgit) untuk mencegah distorsi *floating-point arithmetic*.

### FR-04: 4-Level Age-Adaptive Scaffolding
- Modul eksperimen WAJIB disesuaikan berdasarkan parameter `age_adaptive_level`:
  - `SD_ELEMENTARY`: Bahasa cerita analogis sederhana, durasi singkat (< 20 menit).
  - `SMP_LOWER_SEC`: Penjelasan konsep fisika/kimia dasar, pertanyaan pemandu kualitatif.
  - `SMA_UPPER_SEC`: Rumus sains format $\LaTeX$, identifikasi Variabel Bebas/Terikat/Kontrol, tabel pengamatan multi-trial.
  - `HIGHER_ED_UNI`: Analisis regresi linear OLS ($y = mx + c$), koefisien korelasi $R^2$, analisis ketidakpastian galat.

### FR-05: AR Overlay Vector Simulation
- Seluruh koordinat jangkar AR (`anchor.x`, `anchor.y`, `target_x`, `target_y`) WAJIB ternormalisasi secara ketat pada rentang $[0.0, 1.0]$.
- Komponen Canvas/SVG di klien WAJIB mengalikan nilai koordinat ternormalisasi dengan lebar dan tinggi aktual layar (*viewport scaling*).

### FR-06: Academic PDF Lab Report Generator
- Sistem WAJIB menghasilkan draf laporan praktikum siap cetak (termasuk saat offline) yang mencakup: identitas praktikan, judul modul, rumusan masalah, hipotesis, tabel variabel, data observasi, grafik visual, dan simpulan.

---

## 3. Non-Functional Requirements (NFR)

1. **Performance & Latency:**
   - Endpoint Control Plane `/v1/*` memiliki latensi P95 < 50ms saat disajikan dari cache / memori terindeks.
   - AI Multimodal Vision Scan memiliki latensi P95 < 1500ms dalam mode online Gemini, dan < 50ms dalam mode fallback deterministik.
2. **Reliability & Availability:**
   - 99.9% availability dengan arsitektur dual-service tanpa titik kegagalan tunggal pada broker pesan.
3. **Security & Sandboxing:**
   - Akses rute internal (`/ai/v1/*`) dilindungi oleh header `X-Internal-Secret`.
   - Tidak ada kredensial sensitif atau token API yang di-commit ke repositori git.
4. **Data Integrity & Idempotency:**
   - Sinkronisasi progres offline menggunakan `client_mutation_id` (UUID v4) untuk mencegah duplikasi catatan praktikum dan perolehan badge XP.
