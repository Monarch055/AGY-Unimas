# RekaSains — AI-Native Monorepo

> Platform AI-Native STEM Lab & Physical-to-Digital Inventory Mapping berbasis Kurikulum Merdeka (Indonesia) & KSSR/KSSM (Malaysia) dengan Google ADK
> Built with an uncompromising **AI-Native Engineering** architecture.

---

## Quick Start

1. **Clone & Setup Environment:**
   ```bash
   cp docs/setup/ENV-VARIABLES.md .env
   ```

2. **Start Local Infrastructure:**
   ```bash
   make infra-up
   # or: docker compose up -d
   ```

3. **Start Development Stack:**
   ```bash
   make dev
   ```

---

## AI-Native Constitution & Workflow

Proyek ini dirancang agar dikelola dan di-code bersama AI Assistant (Claude, Cursor, Copilot, Antigravity) dengan disiplin tinggi tanpa halusinasi:
- **Konstitusi AI:** Baca [AGENTS.md](AGENTS.md) dan [CLAUDE.md](CLAUDE.md).
- **Aturan Editor:** Dikonfigurasi di [.cursorrules](.cursorrules) dan [.aiignore](.aiignore).
- **The 5-Gate Workflow:** Docs-First Covenant wajib dijalankan sebelum menulis kode implementasi.
- **Living Context:** Seluruh blueprint sistem tersimpan di folder [docs/context/](docs/context/).
- **Single Source of Truth:** Semua schema API dan Event diatur di folder [contracts/](contracts/).

---

## Monorepo Layout

```text
├── apps/          # Client-facing applications (web, mobile, admin)
├── services/      # 100% isolated backend microservices
├── contracts/     # Single source of truth (REST OpenAPI, Event schemas)
├── packages/      # Shared utilities only (zero business logic)
├── deployments/   # Docker, proxy, and IaC deployment configs
├── docs/          # Complete documentation hub (Context 01-07, PRD, FEAT, ADR)
└── .Artifacts/    # AI work session tracking (plan.md + result.md)
```
