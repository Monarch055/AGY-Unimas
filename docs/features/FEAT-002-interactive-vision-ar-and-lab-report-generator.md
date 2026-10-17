# FEAT-002: Interactive AI Vision Step Checker, AR Overlay Simulation, 4-Level Age-Adaptive Filter & Automated Lab Report PDF Generator

> **Feature Specification Document (FEAT) — RekaSains**
> Location: `docs/features/FEAT-002-interactive-vision-ar-and-lab-report-generator.md`
> Status: 🟢 IMPLEMENTED (Gate 5 Verified)
> Implemented: 2026-10-17
> Created: 2026-10-17
> Author: RekaSains Architecture Team
> Target Service: `services/core-api`, `services/ai-agent`, `apps/web`, `packages/shared-types`
> Priority: P0-Critical
> Breaking Change: NO

---

## 1. Background & Motivation

Fitur ini mewujudkan **USP #5, #6, #8, #9, dan #10**:
1. **STEM Difficulty & 4-Level Age-Adaptive Filter (USP #5 & #6):** Menyesuaikan modul praktikum untuk **SD (`SD_ELEMENTARY`)**, **SMP (`SMP_LOWER_SEC`)**, **SMA (`SMA_UPPER_SEC`)**, hingga **Mahasiswa/Umum (`HIGHER_ED_UNI`)**. Untuk tingkat SMA & Perguruan Tinggi, modul menyertakan rumus fisika/matematika ($\LaTeX$), penentuan **Variabel Bebas, Variabel Terikat, dan Variabel Kontrol**, Tabel Pengamatan Multi-Trial, dan Grafik Analisis Interaktif.
2. **Interactive Step-by-Step Guidance dengan AI Vision Checker (USP #8):** Memanfaatkan kamera untuk memverifikasi apakah langkah perakitan pengguna sudah benar sebelum lanjut ke langkah berikutnya (misal: *"Hubungkan kabel merah ke kutub positif baterai"* $\rightarrow$ *"Langkah benar! Lanjut ke langkah 2"*), dengan fallback konfirmasi manual saat perangkat sedang **Offline**.
3. **Augmented Reality (AR) Overlay Simulation (USP #9):** Mengintegrasikan lapisan animasi AR berbasis **AI Coordinate Anchoring `(x_norm, y_norm)` + HTML5 Canvas/SVG Vector Overlay** di atas foto/kamera benda nyata untuk menampilkan proses tak kasat mata (seperti panah animasi arah aliran arus elektron pada rangkaian baterai & kaleng, vektor gaya, atau tekanan fluida).
4. **Automated "Lab Report Generator" Berformat PDF (USP #10):** Menyusun **Laporan Praktikum Digital** berformat `.pdf` siap kumpul ke guru/dosen dari foto hasil akhir, tabel pengamatan, dan jawaban refleksi pengguna (dilengkapi layar pratinjau edit dan kemampuan cetak PDF meskipun sedang Offline).

---

## 2. Scope & Cross-Service Impact Matrix

### 2.1 In-Scope
- Implementasi `CurriculumScaffolderAgent`, `StepVisionAndARAgent`, dan `LabReportSynthesizerAgent` di `services/ai-agent` (`google-adk`).
- Endpoint `/v1/experiments/{slug}/scaffold`, `/v1/experiments/{slug}/steps/{step_number}/verify-vision`, `/v1/experiments/{slug}/lab-report/generate`, dan `/v1/sync/offline-progress`.
- Komponen **HTML5 Canvas/SVG AR Overlay Engine**, **Interactive LaTeX & Analytical Graph Plotter**, serta **Academic PDF Lab Report Exporter** di `apps/web`.

### 2.2 Out-of-Scope
- Sensor 3D LiDAR khusus yang hanya berjalan di perangkat high-end (digantikan oleh Universal 2D/2.5D Coordinate-Anchored Canvas/SVG AR agar kompatibel di seluruh smartphone siswa).

### 2.3 Cross-Service Impact Matrix

| Service / Package | Impact Type | Description of Required Changes |
|-------------------|-------------|----------------------------------|
| `services/core-api` | New Endpoints & DB Tables | Tabel `experiment_step_verifications`, `lab_reports`, dan `offline_sync_ledger`. |
| `services/ai-agent` | Google ADK Sub-Agents 3, 5, 6 | Implementasi `CurriculumScaffolderAgent`, `StepVisionAndARAgent`, dan `LabReportSynthesizerAgent`. |
| `apps/web` | AR Canvas, Step Camera & PDF UI | Komponen AR Vector Overlay, Kamera Cek Langkah, Plotter Grafik Variabel, dan Generator PDF. |
| `packages/shared-types` | New TypeScript Interfaces | DTO untuk `StepVisionVerifyResponse`, `AROverlaySimulationDTO`, `LabReportGenerateResponse`. |

---

## 3. API & Event Changes

### 3.1 REST API Specification (`contracts/api/openapi.yaml`)
- `POST /v1/experiments/{slug}/scaffold` — Menghasilkan modul sesuai `age_adaptive_level` (`SD_ELEMENTARY` s.d. `HIGHER_ED_UNI`) lengkap dengan `scientific_variables_and_graph` dan `default_ar_overlay`.
- `POST /v1/experiments/{slug}/steps/{step_number}/verify-vision` — Memverifikasi foto langkah perakitan pengguna dan mengembalikan `is_verified_correct`, `feedback_message_local`, serta koordinat `ar_overlay_simulation`.
- `POST /v1/experiments/{slug}/lab-report/generate` — Menghasilkan struktur laporan praktikum akademik siap cetak ke PDF.
- `POST /v1/sync/offline-progress` — Sinkronisasi idempoten progres offline dan klaim Badge/XP.

### 3.2 Event Specification (`contracts/events/PAYLOAD_CONTRACT.md`)
- `experiment.module.requested` & `experiment.module.synthesized`
- `experiment.step.verified`
- `lab_report.synthesized`
- `experiment.completed`

---

## 4. 4-Layer Clean Architecture Mapping

- **Layer 1 (Domain):** `AgeAdaptiveLevel`, `ScientificVariablesSpec`, `AROverlayVectorPath`, `StepVerificationResult`, `AcademicLabReport`.
- **Layer 2 (Use Case):** `ScaffoldAdaptiveExperimentUseCase`, `VerifyStepAndExtractARAnchorsUseCase`, `SynthesizeAcademicLabReportUseCase`.
- **Layer 3 (Adapter):** Gin REST handlers (`services/core-api`), Google ADK Agents (`StepVisionAndARAgent`, `LabReportSynthesizerAgent`), PostgreSQL repositories.
- **Layer 4 (Infrastructure):** `pgxpool`, `google-adk` Runner, FastAPI/Uvicorn, Internal HTTP/SSE Client & BackgroundTasks.

---

## 5. Database Schema Changes (`services/core-api`)

```sql
-- Migration: 002_create_adaptive_experiments_ar_and_lab_reports.sql

CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    title_id VARCHAR(200) NOT NULL,
    title_my VARCHAR(200) NOT NULL,
    safety_severity VARCHAR(40) NOT NULL DEFAULT 'SAFE',
    adaptive_scaffolds_json JSONB NOT NULL, -- Keys: SD_ELEMENTARY, SMP_LOWER_SEC, SMA_UPPER_SEC, HIGHER_ED_UNI
    steps_json JSONB NOT NULL,              -- Includes requires_vision_verification & default_ar_overlay
    reflection_questions_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE experiment_step_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    experiment_slug VARCHAR(120) NOT NULL,
    step_number INT NOT NULL,
    is_verified_correct BOOLEAN NOT NULL,
    verification_mode VARCHAR(30) NOT NULL DEFAULT 'AI_VISION', -- AI_VISION, OFFLINE_MANUAL
    confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    feedback_message TEXT NOT NULL,
    ar_overlay_json JSONB,
    verified_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    experiment_slug VARCHAR(120) NOT NULL,
    age_adaptive_level VARCHAR(40) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    class_or_nim VARCHAR(80) NOT NULL,
    instructor_name VARCHAR(150),
    observation_data_json JSONB NOT NULL DEFAULT '[]',
    report_content_json JSONB NOT NULL,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Critical Edge Cases & Test Scenarios

### Edge Cases
1. **Offline Continuity on Step Vision Checkpoint:** Jika siswa kehilangan sinyal internet saat berada pada langkah dengan `requires_vision_verification = true`, tombol *"Konfirmasi Mandiri (Mode Offline)"* otomatis aktif agar siswa tetap bisa menyelesaikan praktikum dan mencatat `verification_mode = 'OFFLINE_MANUAL'`.
2. **Normalized AR Coordinate Scaling (`0.0`–`1.0`):** Koordinat `start_x_norm`, `start_y_norm`, `end_x_norm`, `end_y_norm` wajib divalidasi berada pada rentang $[0.0, 1.0]$ agar animasi panah aliran elektron/vektor gaya tidak meleset saat layar HP diputar (portrait/landscape).
3. **Offline PDF Lab Report Export:** Jika pengguna membuat Laporan Praktikum saat Offline, generator PDF di `apps/web` merender PDF langsung dari data modul `IndexedDB`, tabel pengamatan, foto lokal, dan kesimpulan siswa tanpa gagal karena network timeout.

### Test Scenarios
- [ ] Unit Test: Validasi normalisasi koordinat `AROverlaySimulationDTO` berada di rentang $[0.0, 1.0]$.
- [ ] Unit Test: `CurriculumScaffolderAgent` menyertakan rumus $\LaTeX$, variabel bebas/terikat/kontrol, dan skema grafik untuk `SMA_UPPER_SEC` & `HIGHER_ED_UNI`.
- [ ] Integration Test: Alur verifikasi langkah `/verify-vision` dan pembuatan laporan praktikum `/lab-report/generate`.
