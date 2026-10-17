req:
User meminta analisa komprehensif UI/UX dan fitur-fitur yang belum optimal/berfungsi di apps/web, kemudian mengeksekusi revisi menyeluruh ("gas kerjain revisinya seluruhnya").

initial_plan:
1. Rombak tata letak UI dari single-page dump menjadi sistem navigasi Tab/Stepper terstruktur (4 Fase: Meja & Inventaris, Katalog Eksperimen, Lab Praktikum & AR, Laporan & Prestasi) + Bottom Navigation di mobile.
2. Bersihkan seluruh developer jargon (USP #X, nama sub-agen ADK, kode aturan internal) dari tampilan utama pengguna dan pindahkan ke toggle panel teknis/inspektor pengembang.
3. Tingkatkan fidelitas interaksi fitur:
   - Live camera preview (getUserMedia) dengan fallback capture file dan preset demo aman/bahaya.
   - AR Simulation Canvas yang dihidupkan dengan SVG filter, glow effects, animasi partikel aliran elektron CSS/SVG.
   - Analytical Graph Plotter dengan grid lines, axis ticks, titik interaktif, dan persamaan regresi OLS $y = mx + c$ yang elegan.
   - Rendering rumus ilmiah yang rapi, berformat visual pecahan matematika dan variabel saintifik.
   - Feedback visual: toast notification, progress stepper, skeleton/pulse loading.
   - Cetak PDF laporan praktikum yang rapi dengan print styling teroptimasi A4.
   - Pembuatan aset ikon PWA `public/icon-192.svg` dan `public/icon-512.svg`.
4. Pertahankan 100% kompatibilitas dan kelulusan seluruh 48 suite pengujian monorepo (`make test`).

revision:
- Evaluasi Gate 3: Pastikan semua nama berkas, ekspor DTO, dan fungsi yang diuji oleh `web-engine.test.mjs`, `web-offline-and-graph.test.mjs`, `e2e-workflow.test.mjs`, dan `tests/contract-conformance.test.mjs` tetap utuh.
- Jangan menambahkan dependensi eksternal npm besar yang dapat merusak build container Alpine; manfaatkan native Tailwind CSS, CSS animations, SVG markers/filters, dan Web APIs standar (The Ladder: native/stdlib first).
- Perbaiki handling `isOfflineMode` agar tersinkronisasi bersih antara hardware network listener dan tombol demo simulasi offline.

final_plan:
1. Buat aset ikon PWA SVG `apps/web/public/icon-192.svg` dan `apps/web/public/icon-512.svg`.
2. Perbarui `apps/web/src/app/globals.css` dengan utility animasi AR particles, glassmorphism, custom scrollbar, dan print media styles.
3. Perbaiki `apps/web/src/components/WorkspaceScannerAndHazardBanner.tsx`:
   - Integrasikan browser camera stream live (WebRTC `getUserMedia`) dengan mode switch (Kamera Langsung vs Upload Berkas vs Demo Cepat).
   - Redesain tabel inventaris menjadi kartu/grid responsif di mobile dengan badge kategori dan quick stepper (+/-).
   - Redesain banner bahaya ko-lokasi aktif dengan visual peringatan darurat yang mencolok dan tombol aksi tanggap darurat yang tegas.
   - Hilangkan teks jargon pengembang dari heading dan ganti dengan instruksi pengguna yang jelas dan bersahabat.
4. Perbaiki `apps/web/src/components/ThreeTierRecommendationExplorer.tsx`:
   - Redesain 3-tier selector tab dengan visual status jelas (100% Siap, Substitusi DIY, Toko Sekitar).
   - Tampilkan kartu rekomendasi eksperimen dengan preview modul, prinsip ilmiah substitusi fungsional yang mudah dibaca, dan direct link toko.
5. Perbaiki `apps/web/src/components/AdaptiveSTEMModuleAndARLab.tsx`:
   - Redesain selector jenjang pendidikan adaptif (SD, SMP, SMA, Perguruan Tinggi).
   - Tambahkan animasi SVG pada AR Overlay (aliran elektron mengalir, gelombang tekanan, vektor gaya berkedip dinamis).
   - Polish tabel data pengamatan dan grafik regresi OLS dengan grid, sumbu X/Y terlabel, dan styling modern.
   - Format rumus LaTeX dengan formula container bergaya matematika.
   - Perbaiki kuis refleksi dengan feedback instan yang jelas dan skor akumulatif.
6. Perbaiki `apps/web/src/components/AcademicLabReportPDFGenerator.tsx`:
   - Metadata form yang bersih dengan label dan visual input rapi.
   - Pratinjau draf laporan yang terformat seperti lembar kerja akademik resmi.
   - Aksi cetak PDF dengan print stylesheet terisolasi yang menghasilkan dokumen standar institusi.
   - Tampilan perolehan badge gamifikasi dengan efek visual selebrasi.
7. Perbarui `apps/web/src/app/page.tsx`:
   - Implementasikan Tab Navigation bar (Inventaris, Eksplorasi, Praktikum & AR, Laporan) + progress indicator.
   - Sediakan Toast notification system untuk aksi pengguna.
   - Buat Developer Mode toggle opsional (tersembunyi/opsional di footer) bagi yang ingin melihat metadata teknis ADK & USP.
8. Jalankan seluruh pengujian monorepo (`make test`) untuk verifikasi 100% kelulusan test suite.
9. Sinkronisasi dokumen dan artefak (`docs/context/06-CURRENT-STATE.md`, `.Artifacts/2026-10-17/12-40/result.md`).
