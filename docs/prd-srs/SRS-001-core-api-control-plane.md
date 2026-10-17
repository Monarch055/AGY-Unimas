# SRS-001: Core Control Plane API (`services/core-api`)

> **System Requirements Specification (SRS) — RekaSains**
> Target Service: `services/core-api`
> Status: APPROVED
> Owner: Backend Engineering Lead

---

## 1. System Overview & Boundaries

`services/core-api` adalah backend utama berbasis Go 1.25+ Gin yang bertindak sebagai **Control Plane** platform RekaSains. Service ini memiliki database PostgreSQL 16 dan cache Valkey/Redis 7.2.
Batasan teknis:
- **Zero Cross-Service Import:** Tidak boleh mengimpor kode Python atau aplikasi frontend secara langsung.
- **Direct Internal REST & SSE:** Berkomunikasi dengan `services/ai-agent` via HTTP port `:8081` (`/ai/v1/*`) dan event streaming SSE.
- **Smart Deterministic Fallback:** Jika AI Agent tidak dapat dijangkau, Core API menggunakan fallback deterministik internal agar praktikum tidak terganggu.

---

## 2. Functional Requirements (FR)

- **FR-01 (Inventory Management):** Mengelola item inventaris pengguna (`/v1/inventory/items`), menerima input pemindaian gambar (`/v1/inventory/scan`), dan menyimpan relasi inventaris.
- **FR-02 (3-Tier Matcher & Substitutes):** Menjalankan algoritma pencocokan set bahan (`/v1/recommendations/match`) ke dalam 3 tier (`STRICT_100`, `DIY_SUBSTITUTE`, `LOCAL_MICRO_SHOP`) dengan lookup substitusi fungsi fisika/kimia.
- **FR-03 (Active Hazard Rules Matrix):** Menilai daftar bahan yang ada di meja kerja terhadap aturan bahaya kimia `safety_hazard_rules`. Jika ditemukan bahan berbahaya bersamaan, mengembalikan `CRITICAL_CO_LOCATION_WARNING`.
- **FR-04 (Curriculum & Adaptive Scaffolding):** Mengembalikan metadata modul eksperimen sesuai 4 jenjang usia (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`) dari database seed ID/MY.
- **FR-05 (Step Verification & AR Coordinates):** Menerima foto langkah perakitan (`/v1/vision/verify-step`) dan mengembalikan status verifikasi serta bounding box koordinat AR ternormalisasi `[0.0, 1.0]`.
- **FR-06 (Academic Lab Report API):** Menerima payload data praktikum (`/v1/lab-report/synthesize`) dan menghasilkan draf laporan akademik dengan rumus LaTeX dan kalkulasi grafik analisis.

---

## 3. Interface & Contract Requirements

- **REST API:** Didefinisikan di [`contracts/api/openapi.yaml`](file:///d:/Tugas/SEMESTER%207/Monorepo/contracts/api/openapi.yaml) di bawah prefix `/v1/*`.
- **Database Migrations:** PostgreSQL migrations di `services/core-api/migrations/` (`001_initial_schema.sql`, `002_seed_curriculum_standards.sql`, `003_seed_canonical_materials.sql`).
- **Data Types:** Mematuhi tipe data murni `@rekasains/shared-types`.
