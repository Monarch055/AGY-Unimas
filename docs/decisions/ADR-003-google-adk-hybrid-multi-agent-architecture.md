# ADR-003: Dual-Service Go Control Plane + Python 6-Agent Google ADK Architecture (Brokerless Direct REST & SSE)

> **Architecture Decision Record (ADR) — RekaSains**
> Location: `docs/decisions/ADR-003-google-adk-hybrid-multi-agent-architecture.md`
> Status: ACCEPTED
> Created: 2026-10-17
> Author: RekaSains Architecture Team (via `/grill-me` Design Alignment & Re-Evaluation)
> Deciders: Project Owner & Principal AI Architect

---

## 1. Context & Problem Statement

**RekaSains** mengimplementasikan **10 Unique Selling Points (USPs)** yang membedakannya secara fundamental dari AI generatif biasa:
1. Physical-to-Digital Inventory Mapping dari foto barang bekas/alat praktikum.
2. Multi-Item Interaction Logic (Strict 100% Resource Constraint).
3. Automatic Alternative Material Recommender (Substitusi bahan rumah tangga dengan fungsi fisika/kimia serupa, misal pipa PVC $\rightarrow$ sedotan tebal / gulungan karton).
4. Hyper-Localized & Low-Cost Adaptation untuk Indonesia (`Rp`) & Malaysia (`RM`).
5. STEM Difficulty & 4-Level Age-Adaptive Filter (`SD`, `SMP`, `SMA`, hingga `Mahasiswa/Umum` lengkap dengan rumus $\LaTeX$, variabel bebas/terikat/kontrol, dan grafik analisis).
6. Curriculum-Aligned STEM Scaffolding (Kurikulum Merdeka ID & KSSR/KSSM MY).
7. Active Safety & Co-Location Hazard Detection System (peringatan merah langsung saat pembersih lantai asam & pemutih terlihat di satu area foto).
8. Interactive Step-by-Step Guidance dengan AI Vision Checker (verifikasi kamera per langkah dengan fallback manual saat Offline).
9. Augmented Reality (AR) Overlay Simulation di atas benda nyata (menampilkan aliran arus elektron, vektor gaya, atau tekanan fluida).
10. Automated Academic "Lab Report Generator" (PDF siap kumpul ke guru/dosen) + Gamifikasi Offline-First.

Selain itu, arsitektur harus hemat memori dan sederhana untuk di-deploy tanpa ketergantungan pada container message broker eksternal seperti RabbitMQ.

---

## 2. Decision

Kami memutuskan untuk menerapkan **Arsitektur Dual-Service Terisolasi (`services/core-api` di Go + `services/ai-agent` di Python dengan 6 Sub-Agent Google ADK) berbasis Direct Internal HTTP/REST & Server-Sent Events (SSE) tanpa RabbitMQ**:

1. **`services/core-api` (Go 1.25+ / Gin + PostgreSQL 16 + Valkey 7.2):**
   - Pemilik tunggal database PostgreSQL (`canonical_materials`, `functional_substitutes`, `safety_hazard_rules`, `curriculum_standards`, `experiments`, `lab_reports`, `offline_sync_ledger`).
   - Menjalankan pencocokan deterministik 3-Tier, pencarian substitusi bahan berfungsi fisika/kimia serupa, serta gerbang keamanan aktif (`CRITICAL_CO_LOCATION_WARNING` & `CRITICAL_HAZARD_BLOCKED`).
   - Menggunakan Go Goroutines dan Internal HTTP Client dengan *Exponential Backoff Retry* + *Smart Deterministic Fallback* saat berkomunikasi dengan `services/ai-agent`.
2. **`services/ai-agent` (Python 3.12+ / FastAPI + Google ADK `google-adk`):**
   - Mengorkestrasi **6 Sub-Agent terspesialisasi**:
     1. `VisionInventoryAgent`: Ekstraksi objek, kuantitas, dan deteksi ko-lokasi bahan berbahaya dari foto meja kerja.
     2. `ResourceMatcherAgent`: Evaluasi kecocokan 3-Tier & rekomendasi **Substitusi Bahan Berfungsi Fisika/Kimia Serupa**.
     3. `CurriculumScaffolderAgent`: Penyusunan modul 4-Jenjang Adaptif (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`).
     4. `SafetyGuardianAgent`: Guardrail berlapis untuk peringatan bahaya aktif di area kerja maupun prosedur langkah kerja.
     5. `StepVisionAndARAgent`: Verifikasi langkah demi langkah menggunakan kamera (*AI Vision Step Checker*) serta ekstraksi titik koordinat ternormalisasi `(x_norm, y_norm)` untuk rendering **AR Overlay Simulation** berbasis HTML5 Canvas/SVG di `apps/web`.
     6. `LabReportSynthesizerAgent`: Penyusunan otomatis draf **Laporan Praktikum Digital (PDF)** dari foto hasil akhir, log verifikasi langkah, dan tabel/grafik pengamatan.

---

## 3. Rationale & Alternatives Considered

- **Mengapa Direct Internal REST & SSE + Go/FastAPI Background Tasks (Tanpa RabbitMQ):**
  - Menghilangkan kebutuhan container broker tambahan (~250MB+ RAM), menyederhanakan `docker-compose.yml` menjadi hanya PostgreSQL 16 dan Valkey 7.2, serta memudahkan streaming respons AI secara langsung ke client.
- **Mengapa AI Coordinate Anchoring + HTML5 Canvas/SVG untuk AR Overlay:**
  - Berjalan 60fps di seluruh smartphone Android murah milik siswa di Indonesia & Malaysia tanpa memerlukan sensor ARCore/LiDAR khusus.

---

## 4. Consequences

- **Positive:**
  - Infrastruktur sangat ringan dan mudah dijalankan (`postgres` + `valkey` saja).
  - Setiap Sub-Agent di Google ADK memiliki tanggung jawab tunggal (*Single Responsibility*) dan skema JSON output yang ketat.
- **Negative / Trade-offs:**
  - Pemanggilan HTTP internal antara `core-api` dan `ai-agent` wajib menerapkan timeout dan mekanisme fallback yang rapi.
