# Service: ai-agent (`services/ai-agent`)

> **Role:** Multi-Agent AI, Computer Vision, AR Coordinate Anchoring & Academic Lab Report Engine untuk **RekaSains** berbasis **Python 3.12+, FastAPI, dan Google Agent Development Kit (`google-adk`)** (Direct Internal REST & SSE — Tanpa RabbitMQ).

---

## 1. Google ADK 6-Sub-Agent Orchestration

Layanan ini mengorkestrasi **6 Sub-Agent** menggunakan **Google ADK (`google-adk`)**:

1. **`VisionInventoryAgent` (USP #1 & #7):**
   - Menerima gambar area kerja / barang bekas / alat praktikum.
   - Mengekstrak objek, menghitung jumlah (`quantity`), memetakan ke taksonomi bahan standar (`material_slug`, `name_id`, `name_my`), serta mendeteksi keberadaan bahan berbahaya yang berada di area meja yang sama.
2. **`ResourceMatcherAgent` (USP #2, #3, #4):**
   - Menganalisis kecocokan inventaris pengguna ke dalam 3 Tier (`STRICT_100`, `DIY_SUBSTITUTE`, `LOCAL_MICRO_SHOP`) serta menyarankan **Substitusi Bahan Berfungsi Fisika/Kimia Serupa** saat pengguna kekurangan 1 bahan.
3. **`CurriculumScaffolderAgent` (USP #5 & #6):**
   - Menyusun modul belajar STEM terstruktur sesuai **Kurikulum Merdeka/DIKTI (Indonesia)** dan **KSSR/KSSM/Universiti (Malaysia)** dengan **4 Tingkat Kesulitan Adaptif (`SD_ELEMENTARY`, `SMP_LOWER_SEC`, `SMA_UPPER_SEC`, `HIGHER_ED_UNI`)**.
4. **`SafetyGuardianAgent` (USP #7):**
   - Sistem deteksi bahaya aktif yang memperingatkan kombinasi bahan berisiko tinggi sejak foto meja kerja dipindai dan memvalidasi keamanan setiap langkah eksperimen.
5. **`StepVisionAndARAgent` (USP #8 & #9):**
   - Memverifikasi foto setiap langkah perakitan pengguna serta mengekstrak koordinat ternormalisasi `(x_norm, y_norm)` komponen fisik untuk menggambar lapisan animasi AR di atas benda nyata.
6. **`LabReportSynthesizerAgent` (USP #10):**
   - Menganalisis foto/video hasil akhir eksperimen, log langkah kerja, dan tabel pengamatan untuk menyusun **Laporan Praktikum Digital Berformat PDF** siap kumpul ke guru/dosen.

---

## 2. 4-Layer Architecture Map
- **Layer 1 (Domain):** `app/domain/` (`DetectedMaterial`, `FunctionalSubstitute`, `SafetyReport`, `StepVerificationResult`, `AROverlayPayload`, `LabReportSynthesis`)
- **Layer 2 (Use Cases):** `app/usecase/` (`ScanInventoryWorkflow`, `MatchAndScaffoldWorkflow`, `VerifyStepAndARWorkflow`, `GenerateLabReportWorkflow`)
- **Layer 3 (Adapters):** `app/agents/` (6 Google ADK Sub-Agents & Function Tools), `app/delivery/http/` (FastAPI REST & SSE handlers + `BackgroundTasks`)
- **Layer 4 (Infrastructure):** `app/infrastructure/` (`google-adk` Runner bootstrap, Gemini client config)

---

## 3. Development Port & Contracts
- Default Port: `8081`
- Internal Base Path: `/ai/v1`
- OpenAPI Contract: `contracts/api/openapi.yaml`
- Internal Event Contract: `contracts/events/PAYLOAD_CONTRACT.md`
