-- Migration 004: Create Tanya Lab AI Chat Sessions & Messages Store
-- Owning Service: services/core-api (PostgreSQL 16)
-- Spec Reference: docs/features/FEAT-003-tanya-lab-ai-conversational-tutor.md

CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    region VARCHAR(10) NOT NULL CHECK (region IN ('ID', 'MY')),
    age_adaptive_level VARCHAR(40) NOT NULL CHECK (age_adaptive_level IN ('SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI')),
    curriculum_code VARCHAR(50) NOT NULL,
    messages_json JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
