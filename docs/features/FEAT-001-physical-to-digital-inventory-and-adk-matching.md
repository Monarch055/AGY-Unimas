# FEAT-001: Physical-to-Digital Inventory Mapping, Active Co-Location Safety & 3-Tier Functional Substitute Matcher (ID & MY)

> **Feature Specification Document (FEAT) — RekaSains**
> Location: `docs/features/FEAT-001-physical-to-digital-inventory-and-adk-matching.md`
> Status: 🟢 IMPLEMENTED (Gate 5 Verified)
> Implemented: 2026-10-17
> Created: 2026-10-17
> Author: RekaSains Architecture Team
> Target Service: `services/core-api`, `services/ai-agent`, `apps/web`, `packages/shared-types`
> Priority: P0-Critical
> Breaking Change: NO

---

## 1. Background & Motivation

Fitur ini mewujudkan **USP #1, #2, #3, #4, dan #7**:
1. **Physical-to-Digital Inventory Mapping (USP #1):** Mengekstrak daftar alat/bahan beserta jumlahnya dari foto meja kerja/barang bekas tanpa ketik manual menggunakan `VisionInventoryAgent`.
2. **Active Safety & Co-Location Hazard Detection (USP #7):** Mendeteksi secara aktif sejak foto pertama kali dipindai apabila terdapat kombinasi bahan berisiko tinggi di area yang sama (misal: pembersih lantai asam + pemutih pakaian $\rightarrow$ `CRITICAL_CO_LOCATION_WARNING`).
3. **Multi-Item Interaction Logic & Automatic Alternative Material Recommender (USP #2 & #3):** Mencocokkan inventaris fisik ke dalam 3 Tier (`STRICT_100`, `DIY_SUBSTITUTE`, `LOCAL_MICRO_SHOP`) termasuk menyarankan **Substitusi Bahan Berfungsi Fisika/Kimia Serupa** (misal: kekurangan pipa PVC $\rightarrow$ gunakan sedotan plastik tebal atau gulungan karton bekas untuk prinsip aliran udara yang sama).
4. **Hyper-Localized & Low-Cost Adaptation (USP #4):** Menyesuaikan istilah lokal dan merekomendasikan toko sekitar di **Indonesia** (`Rp`, Warung/Indomaret/Toko Bangunan) dan **Malaysia** (`RM`, Kedai Runcit/MR.DIY/Eco-Shop) lengkap dengan *Smart Deep-Links*.

---

## 2. Scope & Cross-Service Impact Matrix

### 2.1 In-Scope
- Tabel `canonical_materials`, `functional_substitutes`, `safety_hazard_rules`, `curriculum_standards`, `experiments`, dan `user_inventories` di PostgreSQL.
- Orkestrasi `VisionInventoryAgent`, `ResourceMatcherAgent`, dan `SafetyGuardianAgent` di `services/ai-agent` (`google-adk`).
- Endpoint `/v1/inventory/scan`, `/v1/inventory/items`, dan `/v1/recommendations/match`.

### 2.2 Out-of-Scope
- Verifikasi langkah kamera saat praktikum berlangsung, AR Overlay, dan Lab Report PDF Generator (dicakup secara mendalam di `FEAT-002`).

### 2.3 Cross-Service Impact Matrix

| Service / Package | Impact Type | Description of Required Changes |
|-------------------|-------------|----------------------------------|
| `services/core-api` | New Endpoints & DB Migrations | Implementasi Go 4-Layer untuk Inventory, Functional Substitutes, 3-Tier Set-Matcher, dan Safety Matrix. |
| `services/ai-agent` | Google ADK Sub-Agents 1, 2, 4 | Implementasi `VisionInventoryAgent`, `ResourceMatcherAgent`, dan `SafetyGuardianAgent`. |
| `apps/web` | Scanner & 3-Tier Explorer UI | Kamera Scanner + Banner Bahaya Merah Aktif + Kartu Rekomendasi 3-Tier & Substitusi Bahan. |
| `packages/shared-types` | New TypeScript Interfaces | DTO untuk `InventoryScanResponse`, `FunctionalMaterialSubstituteDTO`, `SafetyAlertDTO`. |

---

## 3. API & Event Changes

### 3.1 REST API Specification (`contracts/api/openapi.yaml`)
- `POST /v1/inventory/scan` — Mengembalikan `detected_items` dan `active_workspace_hazards`.
- `PUT /v1/inventory/items` — Mengonfirmasi inventaris pengguna setelah direview.
- `POST /v1/recommendations/match` — Mengembalikan `strict_100_matches`, `diy_substitute_matches` (lengkap dengan `functional_substitutes`), `local_micro_shop_matches`, dan `blocked_hazard_alerts`.

### 3.2 Internal SSE / Event Specification (`contracts/events/PAYLOAD_CONTRACT.md`)
- `inventory.scan.completed` melalui Direct Internal REST (`/ai/v1/vision/scan`).

---

## 4. 4-Layer Clean Architecture Mapping

- **Layer 1 (Domain):** `CanonicalMaterial`, `FunctionalSubstituteRule`, `UserInventoryItem`, `SafetyHazardRule`, `MatchTier`.
- **Layer 2 (Use Case):** `ScanAndEvaluateCoLocationSafetyUseCase`, `MatchThreeTierWithFunctionalSubstitutesUseCase`.
- **Layer 3 (Adapter):** Gin REST handlers (`services/core-api`), Google ADK Agents (`services/ai-agent`), PostgreSQL/Valkey repositories.
- **Layer 4 (Infrastructure):** `pgxpool`, `google-adk` Runner, Internal HTTP Client.

---

## 5. Database Schema Changes (`services/core-api`)

```sql
-- Migration: 001_create_inventory_substitutes_and_safety_schema.sql

CREATE TABLE canonical_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- RECYCLED, KITCHEN_CHEMICAL, HOUSEHOLD_TOOL, ELECTRONICS, LAB_APPARATUS
    name_id VARCHAR(150) NOT NULL,
    name_my VARCHAR(150) NOT NULL,
    aliases_id TEXT[] NOT NULL DEFAULT '{}',
    aliases_my TEXT[] NOT NULL DEFAULT '{}',
    functional_tags TEXT[] NOT NULL DEFAULT '{}',  -- e.g. {'FLUID_CONDUIT','ACID_REAGENT','CONDUCTOR'}
    default_unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    est_price_idr BIGINT NOT NULL DEFAULT 0,       -- Integer Rupiah (Zero floating-point)
    est_price_myr_sen INT NOT NULL DEFAULT 0,      -- Integer Sen MYR (e.g. 240 = RM 2.40)
    store_types_id TEXT[] NOT NULL DEFAULT '{}',
    store_types_my TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE functional_substitutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    missing_material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug),
    substitute_material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug),
    shared_scientific_principle_id TEXT NOT NULL,
    shared_scientific_principle_my TEXT NOT NULL,
    adaptation_steps_id TEXT[] NOT NULL DEFAULT '{}',
    adaptation_steps_my TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (missing_material_slug, substitute_material_slug)
);

CREATE TABLE safety_hazard_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    material_slug_a VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug),
    material_slug_b VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug),
    severity VARCHAR(40) NOT NULL, -- ADULT_SUPERVISION, CRITICAL_CO_LOCATION_WARNING, CRITICAL_HAZARD_BLOCKED
    warning_id TEXT NOT NULL,
    warning_my TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (material_slug_a, material_slug_b)
);
```

---

## 6. Critical Edge Cases & Test Scenarios

### Edge Cases
1. **Active Co-Location Chemical Detection:** Saat `sodium_hypochlorite` (Pemutih) dan `floor_cleaner_acidic` (Pembersih Lantai Asam) terdeteksi di satu foto meja kerja, `/v1/inventory/scan` wajib langsung mengembalikan `CRITICAL_CO_LOCATION_WARNING` sebelum pengguna memilih eksperimen apa pun.
2. **Functional Substitute Cycle Prevention:** Pencarian substitusi bahan dibatasi 1 hop langsung (`missing -> substitute`) dan bahan pengganti wajib sudah ada di inventaris pengguna agar masuk ke `DIY_SUBSTITUTE`.
3. **Zero Floating-Point Currency:** Harga lokal disimpan dalam integer penuh (`est_price_idr` dan `est_price_myr_sen`).

### Test Scenarios
- [ ] Unit Test: Deteksi ko-lokasi bahan berbahaya menghasilkan `CRITICAL_CO_LOCATION_WARNING` dengan recall 100%.
- [ ] Unit Test: Pencocokan `pvc_pipe_half_inch` yang kurang berhasil disubstitusi oleh `thick_plastic_straw` atau `cardboard_roll_core` pada `DIY_SUBSTITUTE`.
