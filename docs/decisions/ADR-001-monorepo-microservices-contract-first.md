# ADR-001: Adopsi Monorepo Microservices & Contract-First Architecture

> **Architecture Decision Record (ADR) — RekaSains**
> Location: `docs/decisions/ADR-001-monorepo-microservices-contract-first.md`
> Status: ACCEPTED
> Created: 2026-10-17
> Author: RekaSains Architecture Team
> Deciders: Project Owner & Lead Architects

---

## 1. Context & Problem Statement

**RekaSains** adalah platform STEM Lab AI-Native yang menggabungkan:
- Web PWA Mobile-First (`apps/web` - Next.js/React PWA)
- High-throughput deterministic Control Plane (`services/core-api` - Go 1.25+)
- Multimodal Google ADK 6-Agent AI Engine (`services/ai-agent` - Python 3.12+ / FastAPI)
- Shared data types & pure technical utilities (`packages/shared-types`, `packages/shared-core`)

Tantangan utama dari sistem terdistribusi multi-bahasa (Go, Python, TypeScript) adalah:
1. Risiko *API Schema Drift* di mana frontend dan backend tidak sinkron mengenai payload request/response.
2. Fragmentasi repositori (*polyrepo*) yang memperlambat integrasi end-to-end, mempersulit audit perubahan lintas-layanan, dan menciptakan *dependency hell*.
3. Perbedaan format representasi data (misal: penanganan mata uang desimal vs integer, batasan koordinat kamera AR).

---

## 2. Decision

Kami memutuskan untuk mengadopsi pola **Monorepo Microservices** yang dikombinasikan dengan prinsip **Contract-First Development**:

1. **Monorepo Structure:**
   - Seluruh artefak kode, dokumentasi, kontrak, dan deployment disimpan dalam satu repositori terpadu dengan isolasi batas direktori yang ketat (`apps/`, `services/`, `packages/`, `contracts/`, `deployments/`, `docs/`, `.Artifacts/`).
   - Setiap service backend (`core-api`, `ai-agent`) 100% terisolasi dan dilarang saling mengimpor kode secara langsung (*Zero Direct Import Rule*).
2. **Contract-First & Single Source of Truth:**
   - Semua antarmuka HTTP/REST didefinisikan secara deklaratif di `contracts/api/openapi.yaml` (OpenAPI v1.1.0).
   - Seluruh schema payload event asinkron / SSE didokumentasikan di `contracts/events/PAYLOAD_CONTRACT.md`.
   - Modifikasi kode dilarang dilakukan sebelum spesifikasi kontrak dan dokumentasi diperbarui (*The Docs-First Covenant*).
3. **Purity of Shared Packages:**
   - `packages/shared-types` dan `packages/shared-core` hanya memuat representasi tipe data murni dan fungsi utilitas teknis tanpa logika bisnis (*Zero Business Logic Rule*).

---

## 3. Rationale & Alternatives Considered

- **Alternative A: Polyrepo (Repositori Terpisah per Service):**
  - *Kelebihan:* Hak akses terisolasi, repositori lebih kecil.
  - *Kekurangan:* Menyulitkan koordinasi multi-agen AI, versioning kontrak API menjadi lambat, *friction* tinggi saat melakukan migrasi skema lintas-service.
- **Alternative B: Monolit Tradisional (Satu Bahasa, misal Full-Stack Python atau Full-Stack TypeScript):**
  - *Kelebihan:* Satu bahasa dan satu runtime.
  - *Kekurangan:* Kehilangan kecepatan eksekusi tinggi dan efisiensi memori Go untuk control plane/relational database matching; ekosistem Python Google ADK & AI/ML sulit diintegrasikan secara optimal jika dipaksa ke Node.js.
- **Mengapa Opsi Monorepo Microservices + Contract-First Terpilih:**
  - Memungkinkan penggunaan bahasa terbaik untuk setiap ranah (*Go untuk deterministik & concurrency tinggi, Python untuk Google ADK AI multimodal, TypeScript untuk UI PWA*), sementara kontrak OpenAPI dan shared packages menjaga keselarasan tipe data 100%.

---

## 4. Consequences

- **Positive:**
  - Single git history memungkinkan verifikasi atomik lintas layanan dalam satu commit.
  - Koordinasi multi-agen AI dapat dipantau secara terpusat melalui `docs/context/06-CURRENT-STATE.md`.
  - Zero schema drift berkat verifikasi kontrak OpenAPI v1.1.0 sebelum kompilasi.
- **Negative / Trade-offs:**
  - Membutuhkan tooling tooling monorepo yang disiplin (linting, Docker Compose, Makefile multi-target).
  - Eksekusi CI/CD perlu memfilter direktori yang berubah (*path-based caching*).
