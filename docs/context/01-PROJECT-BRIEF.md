# 01-PROJECT-BRIEF: Project Mission, Vision & Complete 10-USP Matrix

> **Blueprint 01:** High-Level Purpose, Core Objectives & 10 Unique Selling Points (USPs)
> Location: `docs/context/01-PROJECT-BRIEF.md`

---

## 1. Executive Summary

- **Project Name:** **RekaSains** (`rekasains` — *"Merekayasa Sains dari Sekitar"*)
- **Core Purpose:** Platform AI-Native STEM Lab, Physical-to-Digital Inventory Mapping, Interactive Vision/AR Step Guidance, & Automated Academic Lab Report Generator berbasis **Kurikulum Merdeka & DIKTI (Indonesia)** serta **KSSR/KSSM & Matrikulasi/Universiti (Malaysia)** menggunakan orkestrasi **6 Sub-Agent di Google Agent Development Kit (ADK)**.
- **Target Audience:** Dual-Mode (**Siswa/Mahasiswa Mandiri** & **Guru/Dosen/Fasilitator Lab**) pada **4 Tingkat Pendidikan Adaptif**:
  1. **SD / Sekolah Rendah** (Fase A–C / Darjah 1–6)
  2. **SMP / Sekolah Menengah Rendah** (Fase D / Tingkatan 1–3)
  3. **SMA/SMK / Sekolah Menengah Atas** (Fase E–F / Tingkatan 4–5)
  4. **Mahasiswa / Perguruan Tinggi & Umum** (Universitas / Politeknik / Komunitas Sains)
- **Value Proposition:** Mengubah foto area kerja/barang bekas menjadi inventaris digital otomatis, memvalidasi 100% ketersediaan bahan atau memberi substitusi bahan berfungsi fisika/kimia serupa & toko lokal murah (Rp/RM), memandu praktikum langkah demi langkah dengan **AI Vision Step Checker**, menampilkan fenomena tak kasat mata (aliran elektron, vektor gaya) melalui **AR Overlay Simulation**, mendeteksi bahaya kombinasi bahan secara aktif, dan otomatis menyusun **Laporan Praktikum Resmi Berformat PDF** siap kumpul.

---

## 2. Core Problem Statement & 10 Unique Selling Points (USPs)

| # | Unique Selling Point (USP) | AI Generatif Biasa (ChatGPT/Claude/Gemini Umum) | Pendekatan Inovatif **RekaSains** |
|---|---|---|---|
| **1** | **Physical-to-Digital Inventory Mapping** | Pengguna harus mengetik satu per satu bahan secara manual. | Cukup memfoto meja kerja/tumpukan barang bekas. `VisionInventoryAgent` otomatis mendeteksi objek, menghitung jumlah, dan menyusun inventaris bahan tanpa perlu diketik. |
| **2** | **Multi-Item Interaction Logic (Strict Resource Constraint)** | Memberi ide eksperimen umum tanpa memvalidasi apakah semua bahannya ada. | Mesin rekomendasi khusus yang memvalidasi eksperimen **Tier 1 (`STRICT_100`)** hanya muncul jika 100% bahan dasarnya tersedia di inventaris fisik pengguna. |
| **3** | **Automatic Alternative Material Recommender (Substitusi Bahan & DIY)** | Gagal atau menyarankan beli alat lab mahal saat 1 bahan tidak ada. | Jika kurang 1–2 bahan, `ResourceMatcherAgent` menyarankan **Substitusi Bahan Rumah Tangga Berfungsi Fisika/Kimia Serupa** (misal kekurangan pipa PVC $\rightarrow$ gunakan sedotan plastik tebal atau gulungan karton bekas untuk prinsip aliran udara yang sama) serta panduan merakit alat DIY. |
| **4** | **Hyper-Localized & Low-Cost Adaptation (Indonesia & Malaysia)** | Menyarankan bahan laboratorium Barat dengan istilah asing. | Mengenali barang bekas/lokal dengan istilah sehari-hari (`ID` & `MY`), serta merekomendasikan toko sekitar (**Warung/Indomaret/Toko Bangunan** di ID atau **Kedai Runcit/MR.DIY/Eco-Shop** di MY) lengkap dengan harga `Rp`/`RM` & *Smart Deep-Links* ke Google Maps & Tokopedia/Shopee. |
| **5** | **STEM Difficulty & 4-Level Age-Adaptive Filter** | Penjelasan teks seragam yang terlalu rumit untuk anak SD atau terlalu dangkal untuk SMA/Mahasiswa. | Menyesuaikan modul secara otomatis untuk **SD, SMP, SMA, hingga Mahasiswa/Umum**: visual & cerita menarik untuk SD; **rumus fisika/matematika ($\LaTeX$), Variabel Bebas/Terikat/Kontrol, Tabel Pengamatan, dan Grafik Analisis Interaktif** untuk SMA & Perguruan Tinggi. |
| **6** | **Curriculum-Aligned STEM Scaffolding** | Jawaban berupa paragraf panjang tanpa struktur pedagogis. | Luaran berformat modul belajar standar **Kurikulum Merdeka (ID)** & **KSSR/KSSM (MY)**: Konsep STEM, Langkah Kerja Terstruktur, Peringatan Keamanan, serta Soal Diskusi & Refleksi. |
| **7** | **Active Safety & Co-Location Hazard Detection System** | Pasif; jarang memperingatkan bahaya pencampuran bahan rumah tangga di meja yang sama. | `SafetyGuardianAgent` + Matriks Deterministik mendeteksi bahaya aktif sejak foto area kerja pertama kali dipindai: jika terlihat pembersih lantai asam dan pemutih pakaian di satu area, langsung muncul **Peringatan Merah Berisiko Tinggi** sebelum eksperimen dimulai. |
| **8** | **Interactive Step-by-Step Guidance dengan AI Vision Checker** | Hanya memberi teks instruksi tanpa tahu apakah pengguna merakit dengan benar. | `StepVisionAndARAgent` memanfaatkan kamera untuk memverifikasi rakitan pengguna di setiap langkah krusial (*"Hubungkan kabel merah ke kutub positif baterai"* $\rightarrow$ *"Langkah benar! Lanjut ke langkah 2"*), dilengkapi fallback manual saat mode Offline. |
| **9** | **Augmented Reality (AR) Overlay Simulation** | Tidak bisa memvisualisasikan fenomena sains yang tak kasat mata di atas alat pengguna. | Menggunakan **AI Coordinate Anchoring + HTML5 Canvas/SVG Animated Overlay** di atas foto/kamera benda nyata untuk menampilkan proses *invisible* (seperti animasi panah arah aliran arus elektron pada rangkaian baterai & kaleng, vektor gaya, atau tekanan fluida). |
| **10** | **"Lab Report Generator" Otomatis (PDF) + Gamifikasi Offline-First** | Percakapan satu arah yang hilang saat offline dan tidak menghasilkan dokumen tugas sekolah. | Menyimpan modul secara **Offline-First di IndexedDB**, memberikan **Badges/XP**, serta memiliki `LabReportSynthesizerAgent` yang mengubah foto hasil akhir & tabel data menjadi **Laporan Praktikum Digital Berformat PDF** (Judul, Tujuan, Alat & Bahan, Langkah Kerja, Foto/Grafik Hasil, Pembahasan Sains, Kesimpulan) siap kumpul ke guru/dosen. |

---

## 3. High-Level Objectives & Goals

- **Goal 1 (Zero-Friction Inventory & Active Hazard Scan):** Ekstraksi foto area kerja menjadi inventaris terstruktur sekaligus deteksi ko-lokasi bahan berbahaya dalam `< 4 detik` (P95).
- **Goal 2 (Interactive Vision Step Verification & AR Overlay):** Verifikasi kebenaran langkah perakitan via kamera dan pengembalian titik koordinat ternormalisasi `(x_norm, y_norm)` untuk rendering lapisan animasi AR di `apps/web` dalam `< 3.5 detik` (P95).
- **Goal 3 (Academic-Grade PDF Lab Report Generation):** Menghasilkan pratinjau laporan praktikum yang dapat diedit dan diekspor menjadi dokumen `.pdf` standar sekolah (ID/MY) maupun standar universitas baik saat Online maupun Offline.
- **Goal 4 (100% Deterministic Chemical/Physical Safety Recall):** Memblokir 100% kombinasi bahan rumah tangga beracun/berbahaya sebelum eksperimen dapat dimulai.

---

## 4. Key Success Metrics (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Core API Latency (Catalog, 3-Tier Match & CRUD) | `< 150ms` P95 | Prometheus / Structured Log Metrics |
| Google ADK Vision Scan & Step Checker Latency | `< 4.0s` P95 | ADK Telemetry & FastAPI Trace |
| Safety Guardrail Recall on Co-Located Hazards | `100%` (Zero False Negatives) | Automated Hazard Matrix Unit & Integration Tests |
| Offline PWA & Client PDF Export Reliability | `100%` Offline Capable | Playwright Offline Mode E2E Tests |
| Test Coverage (Domain & Use Case Layers) | `> 80%` | Go Test & Pytest Coverage Reports |
