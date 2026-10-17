# AI-Native Engineer Monorepo Playbook

> Panduan Master: Cara Membangun dan Mengembangkan Proyek Bersama AI Assistant Tanpa Halusinasi, Tanpa Scope Drift, dan 100% Rapi & Terstruktur.

---

## 1. Mengapa Proyek Ini Begitu Rapi dan Disiplin?

Dalam software engineering konvensional, manusia sering kali melompat langsung ke kode sebelum dokumentasi jelas. Ketika dipasangkan dengan AI (Claude, Cursor, GPT, Antigravity), kebiasaan ini menghasilkan:
- **Halusinasi arsitektur:** AI menebak-nebak nama field database, routing endpoint, atau dependensi.
- **Wasted Context Window:** AI membaca ribuan baris `node_modules`, log, dan build file yang tidak relevan.
- **Melenceng dari kesepakatan (Arbitrary Drift):** Menghadapi kendala kecil, AI mengambil jalan pintas liar (misal mengunduh binary ke host alih-alih container).
- **Amnesia Antar Sesi:** Sesi baru tidak tahu apa yang sudah selesai dan apa yang sedang dikerjakan.

**AI-Native Monorepo ini membalik paradigma tersebut dengan 5 Pilar Fundamental:**

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   5 PILAR AI-NATIVE ENGINEERING                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. The Docs-First Covenant (5-Gate Workflow: No Code Before Spec)      │
│ 2. The 7 Living Blueprints (docs/context/01 sampai 07)                │
│ 3. Single Source of Truth Contracts (contracts/api & contracts/events) │
│ 4. 4-Layer Clean Architecture (Inward Dependency, Zero Cross-Imports)  │
│ 5. Lossless Session Tracking (.Artifacts/YYYY-MM-DD/HH-MM/ Standard)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 5-Gate Workflow (SOP Wajib Setiap Task)

Sebelum AI menulis 1 baris kode produksi, AI wajib mematuhi 5 gerbang ini:

| Gate | Fase | Aksi | Berkas Luaran |
|------|------|------|---------------|
| **Gate 1** | **Discovery** | Baca `docs/context/` dan kontrak terkait untuk memahami konteks. | Context understanding |
| **Gate 2** | **Specification** | Tulis spesifikasi fitur di `docs/features/FEAT-XXX-*.md` dan buat `.Artifacts/.../plan.md`. | Feature spec & plan.md |
| **Gate 3** | **Review** | Audit cross-service impact, edge case keamanan, race condition, naming convention. | Revision notes di plan.md |
| **Gate 4** | **Implementation** | Tulis kode produksi yang mematuhi spesifikasi 100%. | Production code |
| **Gate 5** | **Verification** | Jalankan 3-Layer Alignment check, linter, test suite, dan ekspor `.Artifacts/.../result.md`. | Verification & result.md |

---

## 3. Anatomi 7 Blueprint AI Context (`docs/context/`)

Mengapa folder `docs/context/` diberi nomor `01` sampai `07`?
Karena AI membaca file secara berurutan saat melakukan bootstrap konteks:

1. **`01-PROJECT-BRIEF.md`** → Siapa pengguna sistem, apa masalah yang diselesaikan, apa KPI suksesnya?
2. **`02-ARCHITECTURE.md`** → Topologi sistem, pembagian monorepo, protokol komunikasi antar service.
3. **`03-DOMAIN-KNOWLEDGE.md`** → Glosarium istilah bisnis (Ubiquitous Language) dan hukum mutlak bisnis.
4. **`04-PROBLEMS-CONSTRAINTS.md`** → Batasan teknis, network, memori, regulasi, dan risiko kegagalan.
5. **`05-SOLUTION-APPROACH.md`** → Keputusan arsitektural strategis dan alasan pemilihan teknologi.
6. **`06-CURRENT-STATE.md`** → Status hidup pengerjaan modul (Production, In-Progress, Planned). AI tahu persis di mana harus melanjutkan tanpa bertanya lagi.
7. **`07-STANDARDS-RULES.md`** → Aturan Clean Architecture 4 layer, standar error handling, dan linting.

---

## 4. Struktur Enklave Monorepo (Zero Coupling)

- **`apps/`** → Tempat aplikasi client (Web, Mobile, Admin Dashboard). Aplikasi di sini hanya boleh mengonsumsi API melalui interface yang didefinisikan di `contracts/api/` dan tipe di `packages/shared-types/`.
- **`services/`** → Microservices independen. **Aturan Mutlak:** Antar-service dilarang keras mengimpor kode secara langsung (`import "service-a/..."` adalah HARAM).
- **`contracts/`** → Pusat kontrak data (`openapi.yaml` untuk REST, `PAYLOAD_CONTRACT.md` untuk Event broker).
- **`packages/`** → Kode utility bersama murni (logger, error helper, validator). **Aturan Mutlak:** Zero business logic!
- **`deployments/`** → Dockerfile, reverse proxy Caddy/Nginx, dan Terraform IaC.
- **`.Artifacts/`** → Folder jejak rekam per sesi kerja `YYYY-MM-DD/HH-MM/` berisi `plan.md` (req, initial_plan, revision, final_plan) dan `result.md` (walkthrough & audit checklist).

---

## 5. Cara Menggunakan Template untuk Proyek Baru

### Opsi A: Menggunakan PowerShell (Windows)
Buka terminal PowerShell di folder template dan jalankan:
```powershell
.\scaffold.ps1 -ProjectName "NamaProyek" -TargetDir "D:\Projects\NamaProyek"
```
Skrip akan secara otomatis:
1. Menyalin seluruh hierarki folder dan template.
2. Mengganti semua placeholder (`RekaSains`, `2026-10-17`, dll).
3. Menginisialisasi repositori Git kosong.

### Opsi B: Menggunakan Bash (Linux / macOS)
```bash
chmod +x scaffold.sh
./scaffold.sh "NamaProyek" "/path/to/NamaProyek"
```

---

## 6. Prompting AI Cheat Sheet (Cara Berinteraksi)

Gunakan kata kunci di bawah saat memberikan prompt ke AI:

- **/feat [deskripsi]**:
  > *"AI, jalankan 5-Gate Workflow untuk `/feat implementasi autentikasi JWT`. Buat spec di `docs/features/FEAT-001-auth.md` dan `.Artifacts/` sebelum menulis kode."*
- **/fix [deskripsi]**:
  > *"AI, jalankan `/fix koneksi redis timeout`. Lakukan Root Cause Analysis, perbarui docs jika ada parameter baru, dan jalankan verifikasi."*
- **/audit**:
  > *"AI, lakukan `/audit` pada package ini terhadap 4 kategori: Security, Business Logic, Infrastructure, dan Data Integrity."*
- **/docs [topik]**:
  > *"AI, perbarui `docs/context/06-CURRENT-STATE.md` dan buat ADR di `docs/decisions/` untuk adopsi arsitektur baru."*
