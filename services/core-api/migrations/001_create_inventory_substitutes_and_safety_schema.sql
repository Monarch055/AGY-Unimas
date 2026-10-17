-- Migration 001: Create Physical Inventory, Functional Substitutes, Curricula & Active Safety Hazard Schema
-- Owning Service: services/core-api (PostgreSQL 16)
-- Spec Reference: docs/features/FEAT-001-physical-to-digital-inventory-and-adk-matching.md

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS canonical_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('RECYCLED', 'KITCHEN_CHEMICAL', 'HOUSEHOLD_TOOL', 'ELECTRONICS', 'LAB_APPARATUS')),
    name_id VARCHAR(150) NOT NULL,
    name_my VARCHAR(150) NOT NULL,
    aliases_id TEXT[] NOT NULL DEFAULT '{}',
    aliases_my TEXT[] NOT NULL DEFAULT '{}',
    functional_tags TEXT[] NOT NULL DEFAULT '{}',
    default_unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    est_price_idr BIGINT NOT NULL DEFAULT 0 CHECK (est_price_idr >= 0),
    est_price_myr_sen INT NOT NULL DEFAULT 0 CHECK (est_price_myr_sen >= 0),
    store_types_id TEXT[] NOT NULL DEFAULT '{}',
    store_types_my TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS functional_substitutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    missing_material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    substitute_material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    shared_scientific_principle_id TEXT NOT NULL,
    shared_scientific_principle_my TEXT NOT NULL,
    adaptation_steps_id TEXT[] NOT NULL DEFAULT '{}',
    adaptation_steps_my TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (missing_material_slug, substitute_material_slug)
);

CREATE TABLE IF NOT EXISTS safety_hazard_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    material_slug_a VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    material_slug_b VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    severity VARCHAR(40) NOT NULL CHECK (severity IN ('SAFE', 'ADULT_SUPERVISION', 'CRITICAL_CO_LOCATION_WARNING', 'CRITICAL_HAZARD_BLOCKED')),
    warning_id TEXT NOT NULL,
    warning_my TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (material_slug_a, material_slug_b)
);

CREATE TABLE IF NOT EXISTS curriculum_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(5) NOT NULL CHECK (region IN ('ID', 'MY')),
    curriculum_code VARCHAR(50) NOT NULL CHECK (curriculum_code IN ('ID_KURIKULUM_MERDEKA', 'ID_DIKTI_HIGHER_ED', 'MY_KSSR', 'MY_KSSM', 'MY_MATRIKULASI_UNI')),
    age_adaptive_level VARCHAR(40) NOT NULL CHECK (age_adaptive_level IN ('SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI')),
    grade_level VARCHAR(50) NOT NULL,
    competency_code VARCHAR(80) NOT NULL,
    topic_local VARCHAR(200) NOT NULL,
    learning_objective TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, material_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_inventories_user_id ON user_inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_functional_substitutes_missing ON functional_substitutes(missing_material_slug);
