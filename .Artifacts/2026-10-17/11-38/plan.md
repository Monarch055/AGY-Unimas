req:
User meminta melalui `/grill-me`:
"baca direktori ini dan baca spesifikasinya dan kerjakan implementasi berdasarkan plan, kerja sub bagian dan beritahu updatenya agar agen ai lain yang kerja di repository yang sama tau"

Hasil kesepakatan `/grill-me` & Koordinasi Multi-Agen Real-Time:
1. Pemeriksaan Papan Koordinasi Multi-Agen (`docs/context/06-CURRENT-STATE.md` & `AGENTS.md`) menunjukkan:
   - **Session `11-35`** sedang mengimplementasikan `packages/shared-types`, `packages/shared-core`, dan `services/core-api` (Phase 1).
   - **Session `11-37`** menerbitkan direktif **NO RABBITMQ** (komunikasi via Direct Internal REST & SSE Streaming + BackgroundTasks).
   - **Session `11-40`** sedang mengimplementasikan `services/ai-agent` (Phase 2: Python 6-Sub-Agent Google ADK).
   - **Sub-Bagian yang belum diklaim dan siap dieksekusi tanpa bentrok (Zero Collision):** **Sub-Bagian 4 / Phase 3: `apps/web` (Next.js Mobile-First PWA, AR Canvas, Step Vision Checker, 4-Level Adaptive Graph Plotter, IndexedDB Offline Pack & Editable Academic PDF Lab Report Generator)**!
2. Oleh karena itu, **Session `11-38`** mengklaim dan mengunci **`apps/web`** pada tabel **Active AI Agent Work Locks & Broadcast Board** di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md`, serta mengerjakan implementasi penuh `apps/web` yang terintegrasi 1:1 dengan `packages/shared-types`, `packages/shared-core`, `services/core-api`, dan `services/ai-agent`.

initial_plan:
1. Publikasikan klaim kerja **Session `11-38`** atas `apps/web` (Phase 3) di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` agar agen AI lain (`11-35`, `11-37`, `11-40`) mengetahui pembagian kerja paralel ini.
2. Bangun arsitektur lengkap `apps/web` (Next.js App Router + TypeScript + Tailwind CSS + Offline-First IndexedDB Store + Dual-Mode API Client dengan Seeded Local Fallback):
   - `apps/web/package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `public/manifest.json`, `public/sw.js` (PWA Service Worker Offline-First).
   - `apps/web/src/lib/api-client.ts`: Client REST ke `NEXT_PUBLIC_API_URL` (`http://localhost:8080/v1`) dengan automatic deterministic offline/local fallback untuk ke-6 endpoint utama (`/inventory/scan`, `/inventory/items`, `/recommendations/match`, `/experiments/{slug}/scaffold`, `/experiments/{slug}/steps/{step_number}/verify-vision`, `/experiments/{slug}/lab-report/generate`, `/sync/offline-progress`).
   - `apps/web/src/lib/offline-db.ts`: Penyimpanan Offline-First berbasis `IndexedDB` (`OfflineLabPack`, antrean sinkronisasi `client_mutation_id` idempoten, progres langkah, dan koleksi Badges/XP).
   - `apps/web/src/lib/ar-And-pdf-engine.ts`: Mesin kalkulasi **HTML5 Canvas/SVG Normalized AR Coordinate Overlay** (`[0.0, 1.0]` $\rightarrow$ Viewport Pixel Vectors untuk `ELECTRON_FLOW`, `FORCE_VECTOR`, `FLUID_PRESSURE`, `MAGNETIC_FIELD`, `MOLECULAR_REACTION`), kalkulator regresi & tren grafik variabel SMA/Mahasiswa (`LINEAR_PROPORTIONAL`, dll.), serta generator dokumen **Academic Lab Report PDF / Printable HTML5 Document** (mendukung mode Online maupun Offline).
   - Komponen UI Interaktif Lengkap di `apps/web/src/components/`:
     1. `WorkspaceScannerAndHazardBanner.tsx` (USP #1 & #7: Kamera / Upload Foto Meja Kerja + **Peringatan Merah Berisiko Tinggi `CRITICAL_CO_LOCATION_WARNING`** saat Pemutih & Pembersih Lantai Asam terdeteksi di satu area).
     2. `ThreeTierRecommendationExplorer.tsx` (USP #2, #3, #4: Tab `STRICT_100`, `DIY_SUBSTITUTE` dengan penjelasan **Substitusi Bahan Berfungsi Fisika/Kimia Serupa** seperti Pipa PVC $\rightarrow$ Sedotan Tebal / Gulungan Karton, dan `LOCAL_MICRO_SHOP` dengan harga `Rp`/`RM` integer & Smart Deep-Links ke Google Maps + Tokopedia/Shopee).
     3. `AdaptiveSTEMModuleAndARLab.tsx` (USP #5, #6, #8, #9: Filter 4-Jenjang `SD_ELEMENTARY`..`HIGHER_ED_UNI`, tampilan Rumus $\LaTeX$, Variabel Bebas/Terikat/Kontrol, Tabel Input Data Pengamatan Multi-Trial & **Interactive SVG Analytical Graph Plotter**, serta **Interactive Step-by-Step AI Vision Checker** dengan **HTML5 Canvas/SVG AR Simulation Overlay** dan tombol fallback **Mode Offline**).
     4. `AcademicLabReportPDFGenerator.tsx` (USP #10: Generator Laporan Praktikum Digital dengan **Editable Preview** dan tombol **Export / Download PDF** siap kumpul ke guru/dosen, baik saat Online maupun Offline, ditambah panel sinkronisasi **Badges & XP**).
   - Halaman utama `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, dan `apps/web/src/app/page.tsx`.
3. Buat suite pengujian otomatis (`apps/web/tests/web-engine.test.mjs`) dan jalankan dengan `node --test` untuk memverifikasi seluruh logika bisnis client, normalisasi koordinat AR `[0.0, 1.0]`, pemformatan mata uang integer `IDR`/`MYR_SEN`, deteksi bahaya ko-lokasi aktif, idempotensi antrean `IndexedDB`, dan generator Laporan Praktikum PDF.
4. Perbarui `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` menjadi `🟢 COMPLETED` untuk `apps/web` dan ekspor laporan audit ke `.Artifacts/2026-10-17/11-38/result.md`.

revision:
- [Gate 3 Self-Correction 1 - Multi-Agent Enclave Isolation]: Karena Session `11-35` mengunci `packages/*` & `services/core-api` dan Session `11-40` mengunci `services/ai-agent`, Session `11-38` hanya menulis kode implementasi di dalam `apps/web/` serta mengimpor kontrak dari `@rekasains/shared-types` & `@rekasains/shared-core` tanpa menyentuh file di `services/core-api` atau `services/ai-agent`.
- [Gate 3 Self-Correction 2 - Browser Lifecycle Safety & SSR Hydration]: Sesuai `apps/web/README.md` aturan #4, seluruh akses ke `window.indexedDB`, `navigator.mediaDevices`, `HTMLCanvasElement`, dan `navigator.serviceWorker` wajib dilindungi pemeriksaan `typeof window !== 'undefined'` dan dijalankan di dalam `useEffect` / event handler client.
- [Gate 3 Self-Correction 3 - Dual-Mode Offline Lab Report PDF & AR Overlay]: Saat pengguna menekan tombol *Unduh PDF Laporan Praktikum* atau berada di langkah *Vision Checkpoint* tanpa koneksi internet, aplikasi wajib tetap menghasilkan dokumen laporan praktikum siap cetak/PDF dan merender vektor simulasi AR dari `default_ar_overlay` di `OfflineLabPack`.

final_plan:
1. Pastikan Broadcast Lock untuk `apps/web` (`Session 11-38`) tercatat di `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md`.
2. Implementasikan konfigurasi proyek `apps/web` (`package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `Dockerfile`, `public/manifest.json`, `public/sw.js`).
3. Implementasikan modul core `apps/web/src/lib/` (`ar-and-pdf-engine.ts`, `offline-db.ts`, `api-client.ts`) dan komponen 10-USP di `apps/web/src/components/` serta `apps/web/src/app/`.
4. Jalankan pengujian otomatis `node --test apps/web/tests/web-engine.test.mjs` untuk memverifikasi 100% fungsi.
5. Perbarui `docs/context/06-CURRENT-STATE.md` dan `AGENTS.md` untuk mengumumkan bahwa `apps/web` telah selesai (`🟢 Production`) dan tulis laporan `.Artifacts/2026-10-17/11-38/result.md`.
