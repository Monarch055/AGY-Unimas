# SRS-002: Google ADK AI Agent Service (`services/ai-agent`)

> **System Requirements Specification (SRS) — RekaSains**
> Target Service: `services/ai-agent`
> Status: APPROVED
> Owner: AI & Vision Engineering Lead

---

## 1. System Overview & Boundaries

`services/ai-agent` adalah layanan backend cerdas berbasis Python 3.12+ dan FastAPI yang mengimplementasikan **Google Agent Development Kit (Google ADK)**.
Fitur utama:
- **Dual-Mode Engine:** Mendukung Google Gemini 2.5 Flash API (online) dan *High-Fidelity Deterministic Science Knowledge Engine* (offline fallback) yang memuat ribuan baris basis pengetahuan sains lokal Indonesia dan Malaysia.
- **6 Specialized Sub-Agents:**
  1. `VisionInventoryAgent`: Deteksi visual objek bahan fisik & tumpukan barang bekas.
  2. `ResourceMatcherAgent`: Logika pencocokan 3-Tier & penemuan substitusi fungsional fisika/kimia.
  3. `CurriculumScaffolderAgent`: Perancah modul 4 jenjang usia adaptif (`SD` s.d. `Mahasiswa`).
  4. `SafetyGuardianAgent`: Validasi guardrail keselamatan & deteksi bahaya ko-lokasi aktif.
  5. `StepVisionAndARAgent`: Verifikasi visual langkah demi langkah & penentuan titik jangkar AR.
  6. `LabReportSynthesizerAgent`: Sintesis narasi laporan praktikum akademik ilmiah.

---

## 2. Functional Requirements (FR)

- **FR-01 (Workspace Multimodal Scanning):** Endpoint `POST /ai/v1/vision/scan` menerima citra base64 meja kerja, mengekstrak item inventaris dengan bounding box, dan mendeteksi bahaya ko-lokasi aktif meja kerja.
- **FR-02 (3-Tier & Alternative Material Engine):** Endpoint `POST /ai/v1/recommendations/match` mengevaluasi inventaris fisik dan menyarankan eksperimen `STRICT_100`, `DIY_SUBSTITUTE`, dan `LOCAL_MICRO_SHOP`.
- **FR-03 (Curriculum Scaffolder):** Endpoint `POST /ai/v1/curriculum/scaffold/{experiment_slug}` menghasilkan panduan modul adaptif lengkap dengan rumus LaTeX dan variabel pengamatan.
- **FR-04 (Step Vision & AR Coordinates):** Endpoint `POST /ai/v1/vision/verify-step` mengecek kepatuhan fisik rakitan per langkah dan menghasilkan anchor coordinate ternormalisasi `[0.0, 1.0]`.
- **FR-05 (Lab Report Synthesis):** Endpoint `POST /ai/v1/lab-report/synthesize` menghasilkan draf laporan praktikum siap cetak.
- **FR-06 (SSE Event Stream):** Endpoint `GET /ai/v1/events/stream` memancarkan stream Server-Sent Events tanpa broker eksternal.

---

## 3. Interface & Contract Requirements

- **REST Endpoints:** Didefinisikan di [`contracts/api/openapi.yaml`](file:///d:/Tugas/SEMESTER%207/Monorepo/contracts/api/openapi.yaml) di bawah prefix ganda `/ai/v1/*` dan `/v1/*`.
- **Event Contracts:** Mematuhi amplop JSON di [`contracts/events/PAYLOAD_CONTRACT.md`](file:///d:/Tugas/SEMESTER%207/Monorepo/contracts/events/PAYLOAD_CONTRACT.md).
