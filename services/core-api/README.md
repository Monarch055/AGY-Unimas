# Service: core-api (`services/core-api`)

> **Role:** Control Plane, Physical Inventory Manager, Deterministic 3-Tier & Functional Substitute Matcher, 4-Level Age-Adaptive Curriculum Catalog (SD–Mahasiswa ID & MY), Active Co-Location Safety Gatekeeper, Lab Report Manager, and Offline Gamification Sync API for **RekaSains** (`Go 1.25+ / Gin`).

---

## 1. Core Responsibilities
- **User & 4-Level Age-Adaptive Profile:** Mengelola profil pengguna (`STUDENT` / `TEACHER`), preferensi negara (`ID` / `MY`), dan jenjang pendidikan (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`).
- **Physical Inventory & Active Co-Location Hazard Check:** Menyimpan daftar alat & bahan hasil scan kamera sekaligus mengevaluasi ko-lokasi bahan berbahaya di area kerja yang sama (`CRITICAL_CO_LOCATION_WARNING`).
- **Deterministic 3-Tier Matcher & Functional Material Substitutes:** Mencocokkan inventaris pengguna terhadap katalog eksperimen (`STRICT_100`, `DIY_SUBSTITUTE`, `LOCAL_MICRO_SHOP`) termasuk menyarankan bahan pengganti yang memiliki fungsi fisika/kimia serupa (`functional_substitutes`) serta toko lokal sekitar (`Rp` / `RM`).
- **Step Verification Log & Academic Lab Report Persistence:** Menyimpan log verifikasi langkah kamera, tabel data pengamatan & grafik analisis (SMA/Mahasiswa), serta draf Laporan Praktikum PDF.
- **Gamification & Offline-First Sync:** Memproses penyelesaian praktikum secara idempoten.

---

## 2. 4-Layer Architecture Map
- **Layer 1 (Domain):** `internal/domain/` (`User`, `CanonicalMaterial`, `FunctionalSubstituteRule`, `InventoryItem`, `ExperimentModule`, `SafetyHazardRule`, `LabReport`, `Badge`)
- **Layer 2 (Use Cases):** `internal/usecase/` (`InventoryUseCase`, `RecommendationMatcherUseCase`, `SafetyValidatorUseCase`, `StepVerificationUseCase`, `LabReportUseCase`, `GamificationSyncUseCase`)
- **Layer 3 (Adapters):** `internal/delivery/http/` (Gin REST handlers), `internal/repository/` (PostgreSQL, Valkey & Internal HTTP Client to `ai-agent`)
- **Layer 4 (Infrastructure):** `internal/infrastructure/` (`pgxpool` Postgres connection, Valkey client, Gin engine)

---

## 3. Development Port & Contracts
- Default Port: `8080`
- Base Path: `/v1`
- OpenAPI Contract: `contracts/api/openapi.yaml`
- Internal SSE/Event Contract: `contracts/events/PAYLOAD_CONTRACT.md`
