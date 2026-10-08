-- ============================================================================
-- ONE SHOT FMGE — Telegram Cloud Architecture Database Schema (PostgreSQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    first_name VARCHAR(128),
    username VARCHAR(128),
    encrypted_session TEXT NOT NULL,
    session_auth_key_id VARCHAR(64),
    is_authenticated BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_sources (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) REFERENCES telegram_accounts(id) ON DELETE CASCADE,
    telegram_channel_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    username VARCHAR(128),
    type VARCHAR(32) NOT NULL DEFAULT 'channel',
    member_count INTEGER DEFAULT 0,
    is_monitored BOOLEAN DEFAULT FALSE,
    last_processed_message_id BIGINT DEFAULT 0,
    last_message_date TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_account_channel UNIQUE (account_id, telegram_channel_id)
);

CREATE TABLE IF NOT EXISTS telegram_messages (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) REFERENCES telegram_accounts(id) ON DELETE SET NULL,
    source_id VARCHAR(64) REFERENCES telegram_sources(id) ON DELETE CASCADE,
    telegram_message_id BIGINT NOT NULL,
    message_date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_text TEXT NOT NULL DEFAULT '',
    media_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
    telegram_media_reference TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'RECEIVED',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_source_message UNIQUE (source_id, telegram_message_id)
);

CREATE TABLE IF NOT EXISTS telegram_media (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE CASCADE,
    media_type VARCHAR(32) NOT NULL,
    storage_url TEXT NOT NULL,
    file_path TEXT,
    thumbnail_url TEXT,
    mime_type VARCHAR(64),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Clinical Recall',
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(8) NOT NULL,
    explanation TEXT NOT NULL,
    why_other_options_are_wrong JSONB DEFAULT '[]'::jsonb,
    source_channel VARCHAR(128) NOT NULL,
    image_asset_id VARCHAR(64) REFERENCES telegram_media(id) ON DELETE SET NULL,
    video_asset_id VARCHAR(64) REFERENCES telegram_media(id) ON DELETE SET NULL,
    difficulty VARCHAR(32) DEFAULT 'high-yield',
    content_fingerprint VARCHAR(64),
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of_question_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tips (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Exam Strategy',
    source_channel VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    cleaned_text TEXT NOT NULL,
    importance VARCHAR(32) NOT NULL DEFAULT 'important',
    notice_date TIMESTAMP WITH TIME ZONE,
    source_channel VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pearls (
    id VARCHAR(64) PRIMARY KEY,
    source_message_id VARCHAR(64) REFERENCES telegram_messages(id) ON DELETE SET NULL,
    question_id VARCHAR(64) REFERENCES questions(id) ON DELETE SET NULL,
    title VARCHAR(128) NOT NULL,
    takeaway TEXT NOT NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Clinical Pearl',
    is_saved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cross_checks (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) REFERENCES questions(id) ON DELETE CASCADE,
    original_answer VARCHAR(8) NOT NULL,
    ai_answer VARCHAR(8) NOT NULL,
    agreement_status VARCHAR(32) NOT NULL DEFAULT 'AGREED',
    reason TEXT NOT NULL,
    confidence NUMERIC(4, 3) DEFAULT 0.950,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
    id VARCHAR(64) PRIMARY KEY,
    worker_id VARCHAR(64) NOT NULL DEFAULT 'cloud-worker-1',
    worker_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_successful_telegram_update TIMESTAMP WITH TIME ZONE,
    active_sources_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canonical_items (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    subject VARCHAR(64) NOT NULL DEFAULT 'medicine',
    topic VARCHAR(128) NOT NULL DEFAULT 'Clinical High-Yield',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(8),
    explanation TEXT,
    what_to_remember TEXT,
    distractor_analysis JSONB DEFAULT '[]'::jsonb,
    fmge_relevance_score INTEGER DEFAULT 80,
    sources JSONB DEFAULT '[]'::jsonb,
    media_url TEXT,
    media_type VARCHAR(32) DEFAULT 'NONE',
    is_high_yield BOOLEAN DEFAULT TRUE,
    content_fingerprint VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Per-user study state is an aggregate in the client API. Keeping that aggregate
-- as JSONB preserves its existing API shape while user identity/profile and
-- Telegram ingestion remain relational. Every write replaces one user's state
-- atomically, so concurrent web instances do not share local files.
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(128) PRIMARY KEY,
    email TEXT NOT NULL DEFAULT '',
    display_name TEXT,
    photo_url TEXT,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_app_state (
    user_id VARCHAR(128) PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    state JSONB NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-scoped feature documents retain specialized histories (such as AI Coach
-- consultations) without coupling those features to the main study-state shape.
CREATE TABLE IF NOT EXISTS user_app_documents (
    user_id VARCHAR(128) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    document_key VARCHAR(64) NOT NULL,
    document JSONB NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, document_key)
);

-- Legacy Telegram pipeline documents are staged here for lossless backfill of
-- the older API model while it is migrated to normalized telegram_* tables.
CREATE TABLE IF NOT EXISTS telegram_legacy_state (
    namespace TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runtime Gemini configuration is stored in PostgreSQL when configured through
-- the owner-only API. Deployment environment variables still take precedence.
CREATE TABLE IF NOT EXISTS runtime_secrets (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persistence_migration_log (
    source_key TEXT PRIMARY KEY,
    records_discovered INTEGER NOT NULL DEFAULT 0,
    records_migrated INTEGER NOT NULL DEFAULT 0,
    records_deduplicated INTEGER NOT NULL DEFAULT 0,
    records_skipped INTEGER NOT NULL DEFAULT 0,
    records_failed INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persistence_migration_sources (
    source_key TEXT PRIMARY KEY,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_media_blobs (
    storage_key TEXT PRIMARY KEY,
    mime_type TEXT NOT NULL,
    payload BYTEA NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_app_state_updated_at ON user_app_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_source_received ON telegram_messages(source_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_questions_fingerprint
    ON questions(content_fingerprint)
    WHERE content_fingerprint IS NOT NULL AND is_duplicate = FALSE;

-- Upgrade columns missing from early iterations without dropping any data.
ALTER TABLE telegram_messages ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE telegram_messages ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE telegram_messages ADD COLUMN IF NOT EXISTS telegram_media_reference TEXT;
ALTER TABLE telegram_media ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE telegram_media ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_answer VARCHAR(8);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS ai_verified_answer VARCHAR(8);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_pearl TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_high_yield BOOLEAN;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS duplicate_sources JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE canonical_items ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'::jsonb;
