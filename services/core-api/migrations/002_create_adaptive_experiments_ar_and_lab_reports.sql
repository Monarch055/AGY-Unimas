-- Migration 002: Create 4-Level Adaptive Experiments, Step Vision Verifications, Lab Reports & Offline Sync Ledger
-- Owning Service: services/core-api (PostgreSQL 16)
-- Spec Reference: docs/features/FEAT-002-interactive-vision-ar-and-lab-report-generator.md

CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    title_id VARCHAR(200) NOT NULL,
    title_my VARCHAR(200) NOT NULL,
    safety_severity VARCHAR(40) NOT NULL DEFAULT 'SAFE' CHECK (safety_severity IN ('SAFE', 'ADULT_SUPERVISION')),
    adaptive_scaffolds_json JSONB NOT NULL,
    steps_json JSONB NOT NULL,
    reflection_questions_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiment_materials (
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    material_slug VARCHAR(100) NOT NULL REFERENCES canonical_materials(slug) ON DELETE CASCADE,
    min_quantity NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (min_quantity > 0),
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    PRIMARY KEY (experiment_id, material_slug)
);

CREATE TABLE IF NOT EXISTS experiment_step_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    experiment_slug VARCHAR(120) NOT NULL REFERENCES experiments(slug) ON DELETE CASCADE,
    step_number INT NOT NULL CHECK (step_number >= 1),
    is_verified_correct BOOLEAN NOT NULL,
    verification_mode VARCHAR(30) NOT NULL DEFAULT 'AI_VISION' CHECK (verification_mode IN ('AI_VISION', 'OFFLINE_MANUAL')),
    confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    feedback_message TEXT NOT NULL,
    ar_overlay_json JSONB,
    verified_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    experiment_slug VARCHAR(120) NOT NULL REFERENCES experiments(slug) ON DELETE CASCADE,
    age_adaptive_level VARCHAR(40) NOT NULL CHECK (age_adaptive_level IN ('SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI')),
    student_name VARCHAR(150) NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    class_or_nim VARCHAR(80) NOT NULL,
    instructor_name VARCHAR(150),
    observation_data_json JSONB NOT NULL DEFAULT '[]',
    report_content_json JSONB NOT NULL,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_sync_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    client_mutation_id VARCHAR(100) NOT NULL,
    experiment_slug VARCHAR(120) NOT NULL,
    quiz_score INT NOT NULL DEFAULT 0,
    xp_awarded INT NOT NULL DEFAULT 0,
    completed_at_utc TIMESTAMPTZ NOT NULL,
    synced_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, client_mutation_id)
);

CREATE INDEX IF NOT EXISTS idx_step_verifications_user_exp ON experiment_step_verifications(user_id, experiment_slug);
CREATE INDEX IF NOT EXISTS idx_lab_reports_user_exp ON lab_reports(user_id, experiment_slug);
