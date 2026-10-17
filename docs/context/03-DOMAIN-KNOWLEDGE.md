# 03-DOMAIN-KNOWLEDGE: Ubiquitous Language, Core Entities & Business Invariants

> **Blueprint 03:** Domain Glossary, Invariants, and Business Rules for **RekaSains**
> Location: `docs/context/03-DOMAIN-KNOWLEDGE.md`

---

## 1. Ubiquitous Language (Glossary)

| Term | Domain Meaning | Notes & Aliases |
|------|----------------|-----------------|
| **User Profile** | Akun pengguna dengan peran `STUDENT` (Siswa/Mahasiswa) atau `TEACHER` (Guru/Dosen/Fasilitator), preferensi negara (`ID` atau `MY`), dan jenjang pendidikan. | `user`, `learner`, `educator` |
| **Age-Adaptive Level** | Empat tingkat kedalaman pedagogis: `SD_ELEMENTARY` (Visual & Fenomena), `SMP_LOWER_SEC` (Konsep & Kausalitas), `SMA_UPPER_SEC` (Rumus $\LaTeX$, Variabel Bebas/Terikat/Kontrol, Grafik), dan `HIGHER_ED_UNI` (Metode Ilmiah Kampus, Regresi Data & Analisis Galat). | `difficulty_tier`, `education_level` |
| **Canonical Material** | Entitas bahan/alat praktikum standar dengan nama lokal Indonesia (`name_id`), nama lokal Malaysia (`name_my`), sifat fisika/kimia (`functional_properties`), dan metadata harga/toko lokal. | `material_slug`, `canonical_item` |
| **Functional Material Substitute** | Rekomendasi penggantian 1 bahan yang kurang dengan bahan rumah tangga/barang bekas lain yang memiliki fungsi fisika atau kimia ekuivalen (misal: `pvc_pipe_half_inch` $\rightarrow$ `thick_plastic_straw` atau `cardboard_tube_roll` untuk fungsi konduksi aliran udara). | `functional_substitute`, `subsidi_bahan` |
| **Match Tier** | Klasifikasi kelayakan rekomendasi eksperimen: `STRICT_100` (100% bahan ada), `DIY_SUBSTITUTE` (substitusi bahan berfungsi serupa / merakit alat DIY), atau `LOCAL_MICRO_SHOP` (beli 1–2 bahan murah di toko sekitar dalam Rp/RM). | `recommendation_tier` |
| **Active Co-Location Hazard** | Peringatan keamanan aktif berwarna merah yang langsung muncul saat foto area kerja memperlihatkan dua atau lebih bahan berisiko tinggi berada di meja yang sama (misal: pembersih lantai asam + pemutih pakaian) sebelum eksperimen dimulai. | `CRITICAL_CO_LOCATION_WARNING` |
| **Step Vision Checkpoint** | Verifikasi langkah perakitan praktikum menggunakan kamera oleh `StepVisionAndARAgent` untuk memastikan pengguna melakukan instruksi dengan benar sebelum lanjut ke langkah berikutnya (dengan opsi lewati manual saat Offline). | `vision_step_checker` |
| **AR Overlay Simulation** | Lapisan animasi vektor interaktif (HTML5 Canvas/SVG) yang digambar di atas koordinat benda nyata `(x_norm, y_norm)` pada kamera/foto untuk memvisualisasikan proses tak kasat mata (`ELECTRON_FLOW`, `FORCE_VECTOR`, `FLUID_PRESSURE`, `MAGNETIC_FIELD`, `HEAT_GRADIENT`). | `ar_simulation_layer` |
| **Academic Lab Report PDF** | Dokumen Laporan Praktikum Digital resmi berformat `.pdf` yang disusun otomatis oleh `LabReportSynthesizerAgent` (Judul, Tujuan, Variabel/Rumus, Alat & Bahan, Langkah Kerja, Foto Hasil & Grafik, Pembahasan Sains, Kesimpulan) siap dikumpulkan ke guru atau dosen. | `lab_report_pdf` |
| **Offline Lab Pack** | Bundel mandiri modul praktikum + template PDF + preset animasi vektor yang disimpan di `IndexedDB` agar berjalan 100% tanpa internet. | `offline_bundle` |

---

## 2. Core Entities & Domain Invariants

### 2.1 Entity: `CanonicalMaterial` & `FunctionalSubstituteRule`
- **Identifier:** UUID v4 & unik `slug` (contoh: `pvc_pipe_small`, `thick_plastic_straw`, `cardboard_roll_core`, `sodium_hypochlorite`, `floor_cleaner_acidic`).
- **Functional Equivalence:** Tabel `functional_substitutes` memetakan `missing_material_slug` $\rightarrow$ `substitute_material_slug` berdasarkan kesamaan fungsi fisika/kimia (`physical_chemical_principle`, misal `"Prinsip Saluran Aliran Fluida/Udara Silindris"` atau `"Indikator pH Antosianin Alami"`), disertai penjelasan adaptasi ukuran/takaran dalam Bahasa Indonesia & Bahasa Melayu.

### 2.2 Entity: `ExperimentStep` & `AROverlayAnchor`
- Setiap langkah praktikum memiliki atribut:
  - `requires_vision_verification` (`boolean`): Menentukan apakah langkah ini memiliki fitur *Interactive AI Vision Checker*.
  - `vision_verification_criteria`: Kriteria visual yang diperiksa oleh `StepVisionAndARAgent` (contoh: `"Kabel merah terhubung pada kutub positif (+) baterai dan kabel hitam pada kutub negatif (-)"`).
  - `ar_overlay_type`: Enum (`NONE`, `ELECTRON_FLOW`, `FORCE_VECTOR`, `FLUID_PRESSURE`, `MAGNETIC_FIELD`, `MOLECULAR_REACTION`).
  - `ar_anchor_nodes`: Array titik koordinat ternormalisasi `x_norm` $\in [0.0, 1.0]$ dan `y_norm` $\in [0.0, 1.0]$ beserta arah vektor animasi.

### 2.3 Entity: `LabReportDocument`
- Berisi metadata akademik (`student_name`, `institution_name`, `class_or_nim`, `instructor_name`), `age_adaptive_level`, konten terstruktur (`objective`, `theoretical_background_latex`, `variables_spec`, `materials_and_substitutes`, `step_verification_logs`, `observation_table_rows`, `result_photo_urls`, `scientific_discussion`, `conclusion`), dan status ekspor PDF.

---

## 3. Business Invariants (Hukum Bisnis Mutlak)

1. **Strict Resource Constraint Honesty (USP #2):**
   - Eksperimen **DILARANG KERAS** diberi label `STRICT_100` apabila terdapat bahan utama yang tidak ada di inventaris pengguna. Jika 1–2 bahan yang kurang memiliki substitusi fungsi fisika/kimia di inventaris pengguna, eksperimen wajib dikategorikan sebagai `DIY_SUBSTITUTE` dengan penjelasan ilmiah mengapa bahan pengganti tersebut bekerja.
2. **Proactive Co-Location Safety Gate (USP #7):**
   - Pengecekan bahaya (`SafetyGuardianAgent` + `safety_hazard_rules`) wajib dijalankan **dua kali**: (a) secara **proaktif** begitu foto meja kerja selesai dipindai (`POST /v1/inventory/scan`) untuk mendeteksi ko-lokasi bahan berbahaya di area yang sama, dan (b) sebelum mengizinkan pembuatan modul praktikum apa pun.
3. **Offline-First Continuity on Vision Checkpoints & Lab Reports (USP #8 & #10):**
   - Kegagalan jaringan atau mode Offline **TIDAK BOLEH** menghentikan jalannya praktikum siswa. Jika perangkat sedang Offline saat berada di langkah *Vision Checkpoint*, UI wajib mengizinkan *Self-Check Confirmation* (atau menyimpan foto langkah di `IndexedDB` untuk diverifikasi belakangan) dan tetap dapat mengekspor PDF Laporan Praktikum secara lokal di browser.
4. **Zero Floating-Point Currency Representation (USP #4):**
   - Seluruh estimasi harga bahan lokal disimpan sebagai bilangan bulat (`BIGINT`/`INT`): Rupiah Indonesia dalam satuan `IDR` utuh dan Ringgit Malaysia dalam satuan `Sen MYR`.
