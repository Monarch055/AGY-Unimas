# SRS-003: Mobile-First PWA Client (`apps/web`)

> **System Requirements Specification (SRS) — RekaSains**
> Target Service: `apps/web`
> Status: APPROVED
> Owner: Frontend Engineering Lead

---

## 1. System Overview & Boundaries

`apps/web` adalah aplikasi klien berbasis Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS.
Arsitektur dirancang dengan prinsip **Mobile-First Progressive Web App (PWA)** dan **Offline-First Resilience**:
- **Offline Storage:** Menggunakan browser `IndexedDB` melalui abstraksi `apps/web/src/lib/offline-db.ts`.
- **Universal AR Canvas Engine:** Rendering animasi vektor SVG dan overlay canvas 60fps tanpa memerlukan headset AR atau library pihak ketiga yang berat (`apps/web/src/lib/ar-and-pdf-engine.ts`).
- **Academic PDF Lab Report Builder:** Mampu mencetak dan mengekspor dokumen Laporan Praktikum siap kumpul baik secara online maupun offline.

---

## 2. Functional Requirements (FR)

- **FR-01 (Workspace Camera Scanner):** [`WorkspaceScannerAndHazardBanner.tsx`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/components/WorkspaceScannerAndHazardBanner.tsx) memungkinkan pengguna mengambil foto meja kerja atau memilih contoh gambar, menampilkan daftar inventaris terdeteksi, dan menampilkan banner merah bahaya ko-lokasi aktif jika terdeteksi.
- **FR-02 (3-Tier Recommendation Explorer):** [`ThreeTierRecommendationExplorer.tsx`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/components/ThreeTierRecommendationExplorer.tsx) menampilkan kartu eksperimen dalam 3 tab (`STRICT_100`, `DIY_SUBSTITUTE`, `LOCAL_MICRO_SHOP`), menampilkan substitusi bahan fungsional, dan deep-link belanja lokal (ID/MY).
- **FR-03 (Interactive Step Vision & AR Lab):** [`AdaptiveSTEMModuleAndARLab.tsx`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/components/AdaptiveSTEMModuleAndARLab.tsx) memfasilitasi verifikasi langkah demi langkah dengan kamera pengguna, simulasi overlay animasi AR (arah arus listrik / vektor gaya), serta filter adaptif 4 jenjang usia (`SD`–`Mahasiswa`).
- **FR-04 (Academic PDF Report & Graph Plotter):** [`AcademicLabReportPDFGenerator.tsx`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/components/AcademicLabReportPDFGenerator.tsx) menghitung regresi linier OLS (*Ordinary Least Squares*), memplot grafik SVG analitis untuk jenjang SMA/Mahasiswa, dan menyediakan pratinjau serta tombol cetak/unduh PDF laporan praktikum.
- **FR-05 (Offline Lab Pack & Mutation Queue):** [`offline-db.ts`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/lib/offline-db.ts) menyimpan paket eksperimen dan antrean sinkronisasi idempoten (`client_mutation_id`).

---

## 3. Interface & Contract Requirements

- **API Client:** Menggunakan [`api-client.ts`](file:///d:/Tugas/SEMESTER%207/Monorepo/apps/web/src/lib/api-client.ts) yang mengonsumsi endpoint `/v1/*` dari reverse proxy / Core API dengan deterministic offline fallback.
- **Data Types:** Mengimpor langsung definisi TypeScript murni dari `@rekasains/shared-types`.
