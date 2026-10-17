# Product Requirements & Software Specifications Registry

> Master catalog of Product Requirements Documents (PRD) and Software Requirements Specifications (SRS) for **RekaSains**.

---

## Documents

| Doc ID | Title | Status | Scope |
|--------|-------|--------|-------|
| `PRD-001` | [RekaSains — Platform AI-Native STEM Lab & Physical-to-Digital Inventory Mapping](PRD-001-rekasains-stem-lab-platform.md) | 🟢 APPROVED | 10 Core USPs, User Personas, Kurikulum Merdeka & KSSR/KSSM, NFRs |
| `SRS-001` | [RekaSains — Software Requirements Specification & Technical Contracts](SRS-001-rekasains-technical-specifications.md) | 🟢 APPROVED | 4-Layer Clean Architecture, Cross-Service Boundaries, Zero-RabbitMQ Direct REST/SSE |
| `SRS-001-API` | [Core Control Plane API (`services/core-api`)](SRS-001-core-api-control-plane.md) | 🟢 APPROVED | Go Gin 4-Layer, PostgreSQL 16 Migrations, 3-Tier Matcher & Active Hazard Rules |
| `SRS-002` | [Google ADK Multi-Agent AI Engine (`services/ai-agent`)](SRS-002-ai-agent-google-adk.md) | 🟢 APPROVED | 6 Sub-Agents, ADK Tooling, Computer Vision & AR Coordinate Anchoring |
| `SRS-003` | [Mobile-First Progressive Web App (`apps/web`)](SRS-003-web-pwa-client.md) | 🟢 APPROVED | Next.js PWA, Universal Canvas/SVG AR Engine, Offline-First IndexedDB |


---

## Templates
- `PRD-TEMPLATE.md`: Template standar untuk PRD baru.
- `SRS-TEMPLATE.md`: Template standar untuk SRS baru.
