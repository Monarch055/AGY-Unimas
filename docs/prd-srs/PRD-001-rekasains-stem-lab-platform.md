# PRD-001: RekaSains — Platform AI-Native STEM Lab & Physical-to-Digital Inventory Mapping

> **Product Requirements Document (PRD)**
> Status: APPROVED
> Version: 1.1.0
> Target Release: Q4 2026
> Owners: RekaSains Product & Engineering Team
> Target Markets: Indonesia (Kurikulum Merdeka) & Malaysia (KSSR/KSSM)

---

## 1. Executive Summary & Problem Statement

Di banyak sekolah di Indonesia dan Malaysia, pelaksanaan praktikum sains (STEM) sering terhambat oleh:
1. **Ketiadaan Alat Lab Standar:** Sekolah di daerah periferi sering kali tidak memiliki tabung reaksi, multimeter, atau neraca analitik.
2. **Kecemasan Keamanan Guru:** Guru dan orang tua khawatir mencampurkan bahan kimia rumah tangga karena takut menghasilkan gas beracun tanpa sengaja.
3. **Ketidaksesuaian Kurikulum:** Modul eksperimen di internet sering kali berbahasa Inggris, tidak selaras dengan capaian pembelajaran lokal (Kurikulum Merdeka / KSSR / KSSM), serta tidak adaptif terhadap rentang umur siswa (SD hingga Perguruan Tinggi).
4. **Beban Administratif Pembuatan Laporan:** Siswa kesulitan menyusun laporan praktikum ilmiah yang terstruktur, sementara guru kewalahan memeriksa format laporan satu per satu.

**RekaSains** memecahkan masalah ini dengan mentransformasikan kamera ponsel pintar menjadi laboratorium STEM interaktif bertenaga **Google ADK (Agent Development Kit)** dan **Gemini 2.0 Multimodal**.

---

## 2. The 10 Unique Selling Points (USPs)

1. **Physical-to-Digital Inventory Mapping (USP #1):** Cukup foto meja kerja yang berisi barang bekas (botol, sedotan, kaleng, kabel bekas), AI langsung mengekstrak daftar alat dan bahan beserta kuantitasnya secara digital.
2. **Multi-Item Interaction Logic (USP #2):** Sistem menghitung eksperimen yang 100% dapat dilakukan hanya dengan alat/bahan yang ada (*Strict 100% Resource Matching*).
3. **Automatic Alternative Material Recommender (USP #3):** Jika ada alat yang kurang, AI menyarankan **Substitusi Bahan Berfungsi Fisika/Kimia Serupa** (misal: pipa PVC $\rightarrow$ sedotan tebal atau gulungan karton bekas untuk prinsip fluida Bernoulli yang sama).
4. **Hyper-Localized & Low-Cost Adaptation (USP #4):** Rekomendasi warung, toko kelontong, dan e-commerce lokal di Indonesia (Warung, Indomaret, Toko Bangunan, Tokopedia) dan Malaysia (Kedai Runcit, MR.DIY, Eco-Shop, Shopee MY) dengan harga terjangkau dalam integer Rupiah (`IDR`) dan Sen (`MYR_SEN`).
5. **STEM Difficulty & 4-Level Age-Adaptive Filter (USP #5):** Modul praktikum beradaptasi secara otomatis ke 4 jenjang:
   - **SD (`SD_ELEMENTARY`):** Cerita naratif, kartu bergambar, tanpa rumus rumit.
   - **SMP (`SMP_LOWER_SEC`):** Konsep kualitatif dan pengenalan besaran dasar.
   - **SMA (`SMA_UPPER_SEC`):** Penentuan Variabel Bebas/Terikat/Kontrol, rumus $\LaTeX$, tabel multi-trial, dan grafik analisis interaktif.
   - **Mahasiswa/Umum (`HIGHER_ED_UNI`):** Analisis galat, regresi linear OLS, dan pembahasan mendalam berbasis literatur ilmiah.
6. **Curriculum-Aligned STEM Scaffolding (USP #6):** Terpetakan langsung ke Capaian Pembelajaran (CP) Kurikulum Merdeka (Kemendikbudristek) dan Dokumen Standard Kurikulum dan Pentaksiran (DSKP) KSSR/KSSM (KPM).
7. **Active Safety & Co-Location Hazard Detection (USP #7):** Pendeteksian dini bahaya kimia di area kerja. Jika kamera mendeteksi pemutih pakaian (`NaOCl`) dan pembersih lantai asam (`HCl`) dalam satu area foto meja kerja, sistem memunculkan banner peringatan merah kritis seketika (*Workspace Clear Required*).
8. **Interactive Step-by-Step Guidance dengan AI Vision Checker (USP #8):** Kamera memverifikasi kebenaran fisik perakitan di setiap langkah sebelum mengizinkan siswa berpindah ke langkah berikutnya.
9. **Augmented Reality (AR) Overlay Simulation (USP #9):** Animasi visual proses ilmiah tak kasat mata (seperti arah aliran elektron, vektor gaya pegas, gradien tekanan udara) yang diproyeksikan langsung di atas foto benda nyata menggunakan koordinat ternormalisasi `[0.0, 1.0]` dan HTML5 Canvas/SVG.
10. **Automated Academic "Lab Report Generator" + Gamifikasi Offline-First (USP #10):** Generator otomatis laporan praktikum digital berformat PDF siap cetak, didukung penyimpanan lokal IndexedDB yang memungkinkan praktikum offline dan sinkronisasi otomatis saat terhubung kembali ke internet.

---

## 3. User Personas & User Journeys

### Persona A: Budi (Siswa SMA di Jawa Tengah, Indonesia)
- Mengakses RekaSains via browser smartphone murah.
- Memfoto kaleng minuman bekas dan baterai 9V di mejanya.
- Memilih jenjang SMA; sistem menyajikan modul induksi elektromagnetik lengkap dengan variabel penelitian, grafik interaktif, dan simulasi AR arah medan magnet.
- Mengumpulkan laporan praktikum PDF langsung ke Google Classroom tanpa mengetik ulang di laptop.

### Persona B: Cikgu Nurul (Guru Sains Menengah di Sarawak, Malaysia)
- Menghadapi keterbatasan alat lab di sekolah pedalaman.
- Menggunakan fitur 3-Tier Substitusi untuk mencari padanan bahan di kedai runcit sekitar.
- Memastikan keselamatan murid dengan sistem peringatan dini bahaya ko-lokasi.

---

## 4. Success Metrics & Non-Functional Requirements
- **Akurasi Deteksi Bahaya Ko-Lokasi:** 100% recall pada kombinasi reagen berbahaya (misal `NaOCl + HCl`, `NaOCl + C2H4O2`).
- **Latensi Respons Kontrol:** P95 < 200ms untuk pencocokan inventaris dan verifikasi langkah.
- **Ketersediaan Offline:** 100% modul yang telah diunduh dapat diselesaikan tanpa koneksi internet.
- **Kompatibilitas Perangkat:** Berjalan lancar pada browser mobile standar (Chrome/Safari) tanpa instalasi aplikasi native native khusus.
