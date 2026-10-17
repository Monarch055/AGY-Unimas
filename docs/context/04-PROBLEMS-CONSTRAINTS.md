# 04-PROBLEMS-CONSTRAINTS: Technical Bottlenecks, AR/Vision Constraints & Safety Guardrails

> **Blueprint 04:** Known Constraints, Failure Modes, and Mitigations for **RekaSains**
> Location: `docs/context/04-PROBLEMS-CONSTRAINTS.md`

---

## 1. Physical, Device & Connectivity Constraints

- **Low-to-Mid Range Smartphones without ARCore/LiDAR:**
  - Banyak siswa di Indonesia & Malaysia menggunakan smartphone Android entry-level yang tidak mendukung WebXR 3D/ARCore penuh.
  - **Constraint & Mitigation:** Fitur **Augmented Reality (AR) Overlay Simulation (USP #9)** dirancang menggunakan **AI Coordinate Anchoring `(x_norm, y_norm)` + HTML5 Canvas / SVG 2D/2.5D Vector Animation Overlay** di atas feed kamera/foto benda nyata. Pendekatan ini berjalan mulus 60fps di seluruh browser mobile tanpa membutuhkan sensor ARCore khusus.
- **Unstable Connectivity During Step-by-Step Lab Execution & Report Submission:**
  - Koneksi internet di ruang laboratorium sekolah atau rumah sering terputus di tengah praktikum.
  - **Constraint & Mitigation:**
    1. *Interactive AI Vision Step Checker (USP #8)* menggunakan pola **Hybrid Smart Checkpoint**: verifikasi kamera AI real-time saat Online, dan fallback tombol *"Konfirmasi Langkah Mandiri (Mode Offline)"* saat Offline.
    2. *Lab Report PDF Generator (USP #10)* memiliki dual-engine: sintesis pembahasan mendalam oleh `LabReportSynthesizerAgent` saat Online, serta pencetakan PDF langsung di sisi client (`apps/web`) sehingga siswa tetap bisa mengunduh file `.pdf` tugas sekolah meskipun sedang Offline.
- **Zero External Broker Overhead (No RabbitMQ):**
  - Menghindari penggunaan container message broker berat (seperti RabbitMQ) agar penggunaan RAM server dan lingkungan pengembangan lokal tetap hemat.
  - **Mitigation:** Menggunakan **Direct Internal HTTP/REST & Server-Sent Events (SSE)** antara `services/core-api` dan `services/ai-agent` dengan *Exponential Backoff Retry* dan *Smart Deterministic Fallback*.

---

## 2. Regulatory, Child Safety & Privacy Constraints

- **Active Co-Location Chemical/Physical Safety (USP #7):**
  - Meja kerja di rumah sering kali memiliki bahan pembersih berbahaya yang berdekatan (misal: pembersih lantai asam/HCl dan pemutih pakaian/NaOCl).
  - **Constraint:** Sistem wajib mendeteksi ko-lokasi bahan berbahaya langsung pada tahap pemindaian foto awal dan menampilkan **Banner Peringatan Merah Berisiko Tinggi** beserta instruksi memisahkan bahan tersebut sebelum praktikum dimulai.
- **Data Privacy (UU PDP Indonesia & PDPA Malaysia):**
  - Foto langkah praktikum hanya digunakan untuk verifikasi objek dan laporan praktikum milik pengguna itu sendiri; tidak pernah dibagikan secara publik tanpa izin eksplisit.

---

## 3. Known Failure Modes & Automated Mitigations

| Failure Mode | Root Cause Risk | Automated Mitigation |
|--------------|-----------------|----------------------|
| **Vision Step Verification False Rejection** | Pencahayaan ruangan redup atau sudut foto membuat kabel/komponen tertutup tangan | `StepVisionAndARAgent` mengembalikan `CONFIDENCE_LOW` beserta saran sudut pengambilan foto ulang, serta mengizinkan override manual oleh siswa/guru setelah 2x percobaan. |
| **AR Anchor Coordinate Drift on Resize** | Perbedaan rasio aspek layar HP vs resolusi foto yang dianalisis AI | Seluruh koordinat anchor disimpan dalam nilai relatif ternormalisasi `x_norm, y_norm` $\in [0.0, 1.0]$ dan ditransformasikan secara dinamis oleh komponen Canvas di `apps/web`. |
| **Hallucinated Material or Substitute** | LLM menyarankan bahan pengganti yang tidak aman atau tidak setara secara fisika | Substitusi bahan divalidasi terhadap tabel `functional_substitutes` dan tetap wajib melewati pemeriksaan `SafetyGuardianAgent`. |
| **Internal AI Service Timeout / Transient Error** | Lonjakan request ke Gemini API pada jam praktikum | HTTP Client di `core-api` menerapkan timeout terukur + 3x Exponential Backoff Retry + *Smart Deterministic Fallback* dari katalog terkurasi PostgreSQL. |
