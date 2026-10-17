req:
User meminta re-evaluasi melalui `/grill-me` dan penambahan 6 fitur unggulan (Unique Selling Points) baru ke dalam arsitektur **RekaSains**:
1. **Interactive Step-by-Step Guidance dengan AI Vision Checker:** Memanfaatkan kamera untuk memverifikasi apakah langkah perakitan pengguna sudah benar sebelum lanjut ke langkah berikutnya (misal: "Hubungkan kabel merah ke kutub positif baterai" -> "Langkah benar! Lanjut ke langkah 2").
2. **Automatic Alternative Material Recommender (Substitusi Bahan Berfungsi Serupa):** Jika kurang 1 bahan, AI menyarankan substitusi bahan rumah tangga yang memiliki fungsi fisika/kimia serupa (misal: kekurangan pipa PVC -> gunakan sedotan plastik tebal atau gulungan karton bekas untuk prinsip aliran udara yang sama).
3. **STEM Difficulty & Age-Adaptive Filter (SD, SMP, SMA, hingga Mahasiswa/Umum):** Menyesuaikan kedalaman penjelasan secara otomatis (SD berbasis fenomena visual menarik; SMA/Perguruan Tinggi menyertakan rumus fisika/matematika LaTeX, variabel bebas/terikat/kontrol, tabel pengamatan, serta grafik analisis).
4. **"Lab Report Generator" Otomatis untuk Tugas Sekolah/Kuliah (Format PDF):** Mengunggah foto/video hasil akhir & data pengamatan untuk otomatis menyusun Laporan Praktikum Digital berformat PDF siap kumpul ke guru/dosen (Judul, Tujuan, Landasan Teori/Rumus, Alat & Bahan, Langkah Kerja, Foto Hasil & Grafik, Pembahasan Sains, dan Kesimpulan).
5. **Augmented Reality (AR) Overlay Simulation:** Kamera mengintegrasikan lapisan AR di atas benda nyata untuk menampilkan proses tak kasat mata (seperti garis panah animasi arah aliran arus elektron pada rangkaian baterai & kaleng, vektor gaya, atau tekanan fluida).
6. **Active Safety & Hazard Detection System:** Keamanan aktif yang langsung memberi peringatan merah berisiko tinggi sejak foto area kerja pertama kali dipindai jika terdeteksi kombinasi bahan berbahaya di satu area (misal: pembersih lantai asam dan pemutih pakaian).

Hasil keputusan penyelarasan `/grill-me`:
- **AI Vision Step Checker (#1):** Menggunakan **Hybrid Smart Checkpoint** — verifikasi kamera real-time oleh AI Vision saat Online, namun tetap menyediakan tombol "Lanjut Manual" saat Offline agar kompatibilitas Offline-First (USP #5) terjaga 100%.
- **AR Overlay Simulation (#5):** Menggunakan **AI Coordinate Anchoring + HTML5 Canvas/SVG Animated Overlay** di atas kamera/foto benda nyata — ADK mendeteksi koordinat `(x, y)` komponen fisik (kutub baterai, kabel, botol) lalu PWA menggambar animasi aliran elektron/vektor gaya tepat di atas benda nyata tanpa butuh sensor ARCore mahal.
- **Age-Adaptive Filter (#3):** Mendukung **4 Tingkat Adaptif** (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`) lengkap dengan rumus LaTeX, Variabel Bebas/Terikat/Kontrol, Tabel Input Pengamatan, dan Grafik Analisis Interaktif.
- **Lab Report PDF Generator (#4):** **AI-Assisted Academic PDF Generator + Editable Preview** (mendukung format Sekolah ID/MY & format Kampus/Universitas) yang dapat diedit siswa/mahasiswa sebelum diunduh menjadi PDF, serta tetap bisa mencetak PDF saat Offline.
- **Orkestrasi Google ADK (`services/ai-agent`):** Diperluas menjadi **6 Sub-Agent Terspesialisasi**:
  1. `VisionInventoryAgent`
  2. `ResourceMatcherAgent`
  3. `CurriculumScaffolderAgent`
  4. `SafetyGuardianAgent`
  5. `StepVisionAndARAgent` (BARU — Fitur #1 & #5)
  6. `LabReportSynthesizerAgent` (BARU — Fitur #4)

initial_plan:
1. Perbarui `AGENTS.md` dan `docs/context/01-PROJECT-BRIEF.md` s.d. `07-STANDARDS-RULES.md` untuk mengintegrasikan ke-6 USP baru dan arsitektur 6-Sub-Agent Google ADK.
2. Perbarui `ADR-003` serta README pada `services/ai-agent`, `services/core-api`, dan `apps/web`.
3. Perbarui kontrak OpenAPI (`contracts/api/openapi.yaml`) dan Event (`contracts/events/PAYLOAD_CONTRACT.md`) untuk endpoint verifikasi langkah kamera, AR Coordinate Overlay, Age-Adaptive 4-Level (termasuk Mahasiswa/Umum), Substitusi Fungsi Fisika/Kimia, dan Lab Report PDF Generator.
4. Perbarui `FEAT-001` dan buat spesifikasi fitur baru `docs/features/FEAT-002-interactive-vision-ar-and-lab-report-generator.md` beserta registrasinya di `docs/features/README.md`.

revision:
- [Gate 3 Self-Correction 1 - Skema Koordinat AR Normalisasi]: Agar overlay animasi Canvas/SVG di `apps/web` presisi di berbagai resolusi layar HP/laptop, seluruh titik koordinat yang dikembalikan oleh `StepVisionAndARAgent` wajib menggunakan skala ternormalisasi `0.0` hingga `1.0` (`x_norm`, `y_norm`) relatif terhadap dimensi gambar yang dipindai.
- [Gate 3 Self-Correction 2 - Offline Fallback untuk Lab Report PDF & AR Overlay]: Saat pengguna berada dalam mode Offline, `OfflineLabPack` tetap menyimpan preset simulasi vektor dasar dan template generator PDF client-side sehingga siswa tetap dapat mengekspor PDF Laporan Praktikum meskipun internet terputus setelah praktikum selesai.
- [Gate 3 Self-Correction 3 - Active Workspace Co-Location Hazard Check]: Pada endpoint `/v1/inventory/scan`, `VisionInventoryAgent` + `SafetyGuardianAgent` wajib mengevaluasi seluruh objek yang terdeteksi berada di satu bingkai meja kerja (bahkan sebelum pengguna memilih eksperimen) dan langsung mengembalikan `active_workspace_hazards` dengan tingkat `CRITICAL_CO_LOCATION_WARNING` jika ada bahan seperti pemutih pakaian dan pembersih lantai/asam di satu area.

final_plan:
1. Update `AGENTS.md` dan seluruh dokumen `docs/context/01..07` dengan matriks 10 USP terpadu dan arsitektur 6-Agent Google ADK.
2. Update `services/ai-agent/README.md`, `services/core-api/README.md`, `apps/web/README.md`, dan `docs/decisions/ADR-003-google-adk-hybrid-multi-agent-architecture.md`.
3. Update `contracts/api/openapi.yaml` dan `contracts/events/PAYLOAD_CONTRACT.md` dengan endpoint & DTO untuk `StepVisionAndARAgent` dan `LabReportSynthesizerAgent`.
4. Update `FEAT-001` dan buat `docs/features/FEAT-002-interactive-vision-ar-and-lab-report-generator.md` + daftarkan ke `docs/features/README.md`.
5. Ekspor hasil audit verifikasi ke `.Artifacts/2026-10-17/11-28/result.md`.
