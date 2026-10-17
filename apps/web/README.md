# Web Application (`apps/web`)

> **Role:** Progressive Web App (PWA) Mobile-First utama untuk **RekaSains** (`Next.js + React + TypeScript + Tailwind CSS + HTML5 Canvas/SVG AR + Dexie.js IndexedDB + PDF Builder`).

---

## 1. Core Capabilities (10 USPs Client Layer)
1. **Camera Workspace Scanner & Active Co-Location Hazard Banner (USP #1 & #7):**
   - Memfoto meja kerja/barang bekas, mengekstrak inventaris otomatis, dan langsung menampilkan **Peringatan Merah Berisiko Tinggi** jika terdeteksi bahan berbahaya berada di satu area (misal: pembersih lantai asam + pemutih pakaian).
2. **3-Tier Experiment Explorer, Functional Substitutes & Local Shop Deep-Links (USP #2, #3, #4):**
   - Menampilkan rekomendasi **100% Siap Praktik (`STRICT_100`)**, **Substitusi Fungsi Fisika/Kimia & DIY (`DIY_SUBSTITUTE`)**, serta **Belanja Lokal Murah (`LOCAL_MICRO_SHOP`)** lengkap dengan harga `Rp`/`RM` dan tombol pintas Google Maps & Tokopedia/Shopee.
3. **4-Level Age-Adaptive STEM Module, Formulas & Interactive Graph Plotter (USP #5 & #6):**
   - Menyesuaikan tampilan modul untuk **SD, SMP, SMA, hingga Mahasiswa/Umum** (dilengkapi render rumus $\LaTeX$, Variabel Bebas/Terikat/Kontrol, Tabel Input Data Pengamatan, dan Grafik Analisis Interaktif).
4. **Interactive Step-by-Step AI Vision Checker & AR Simulation Overlay (USP #8 & #9):**
   - Memverifikasi kebenaran langkah perakitan pengguna via kamera (*"Langkah benar! Lanjut ke langkah 2"*) dengan fallback manual saat Offline, serta merender lapisan animasi **AR Overlay** (panah aliran elektron, vektor gaya, tekanan fluida) di atas foto/kamera benda nyata.
5. **Automated Academic "Lab Report Generator" (PDF) & Offline-First Badges (USP #10):**
   - Menyusun Laporan Praktikum Digital siap kumpul ke guru/dosen dalam format `.pdf` (dengan pratinjau yang dapat diedit dan dukungan cetak saat Offline) serta sistem **Badges/XP** di `IndexedDB`.

---

## 2. Architecture Guidelines
1. Menggunakan design system berbasis Tailwind CSS dengan komponen aksesibel dan responsif.
2. Tidak meng-hardcode URL backend; gunakan environment variable `NEXT_PUBLIC_API_URL`.
3. Semua DTO wajib terikat ke `packages/shared-types` tanpa tipe `any`.
4. Seluruh modul browser-only (`IndexedDB`, `navigator.mediaDevices`, `HTMLCanvasElement`, `ServiceWorker`) wajib diakses secara aman di client lifecycle.
