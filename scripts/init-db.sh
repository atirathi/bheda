#!/bin/bash
set -e

echo "=== Bheda Database Initialization ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'
BEGIN;

-- ─── Extensions ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tables ───

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) UNIQUE NOT NULL,
    icon VARCHAR(64),
    color VARCHAR(16),
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(32) NOT NULL DEFAULT 'medium',
    cvss_score FLOAT,
    owasp_mapping VARCHAR(64),
    real_cve VARCHAR(64),
    endpoint VARCHAR(512),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    waf_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    hint_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    max_attempts INTEGER NOT NULL DEFAULT 0,
    requires JSONB,
    metadata JSONB,
    flag_hash VARCHAR(256) NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(320) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    invite_code VARCHAR(32) UNIQUE NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS ctf_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(256) NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    max_team_size INTEGER NOT NULL DEFAULT 5,
    isolation_mode BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES ctf_events(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    instance_id VARCHAR(128),
    instance_status VARCHAR(16) NOT NULL DEFAULT 'pending',
    UNIQUE(event_id, team_id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    flag_hash VARCHAR(256) NOT NULL,
    correct BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) UNIQUE NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(256) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id UUID,
    cron_expression VARCHAR(64) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rabbit_holes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(256) NOT NULL,
    endpoint VARCHAR(512) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'decoy',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_challenges_category_id ON challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_enabled ON challenges(enabled);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_correct ON submissions(correct);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run_at ON schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_rabbit_holes_type ON rabbit_holes(type);
CREATE INDEX IF NOT EXISTS idx_challenges_requires ON challenges USING gin(requires);
CREATE INDEX IF NOT EXISTS idx_profiles_is_default ON profiles(is_default);

-- ─── Seed Admin User ───
INSERT INTO users (email, username, password_hash, role)
VALUES (
    'admin@bheda.lab',
    'admin',
    crypt('admin', gen_salt('bf')),
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- ─── Seed Categories ───
INSERT INTO categories (name, icon, color, sort_order, description) VALUES
    ('SQL Injection', 'database', '#FF6B6B', 1, 'SQL injection vulnerabilities across multiple databases'),
    ('Cross-Site Scripting', 'code', '#4ECDC4', 2, 'Reflected, stored, DOM-based, and advanced XSS'),
    ('Access Control', 'lock', '#45B7D1', 3, 'IDOR, privilege escalation, path traversal'),
    ('SSRF', 'globe', '#96CEB4', 4, 'Server-Side Request Forgery exploits'),
    ('JWT', 'key', '#FFEAA7', 5, 'JSON Web Token vulnerabilities'),
    ('SSTI', 'terminal', '#DDA0DD', 6, 'Server-Side Template Injection'),
    ('XXE', 'file-text', '#98D8C8', 7, 'XML External Entity processing'),
    ('Deserialization', 'package', '#F7DC6F', 8, 'Insecure deserialization attacks'),
    ('Race Condition', 'zap', '#E8DAEF', 9, 'Time-of-check Time-of-use exploits'),
    ('OAuth', 'users', '#F8C471', 10, 'OAuth 2.0 implementation flaws'),
    ('GraphQL', 'git-commit', '#AED6F1', 11, 'GraphQL injection and introspection'),
    ('WebSocket', 'radio', '#A3E4D7', 12, 'WebSocket security vulnerabilities'),
    ('WASM', 'cpu', '#F5B7B1', 13, 'WebAssembly reverse engineering'),
    ('Crypto', 'shield', '#D5F5E3', 14, 'Cryptographic implementation weaknesses'),
    ('Business Logic', 'briefcase', '#FADBD8', 15, 'Application logic flaws'),
    ('Infrastructure', 'server', '#D6EAF8', 16, 'Infrastructure misconfigurations'),
    ('WAF Bypass', 'shield-off', '#E6B0AA', 17, 'Web Application Firewall evasion'),
    ('TLS', 'lock', '#A9CCE3', 18, 'TLS/SSL misconfigurations'),
    ('Zero Day', 'alert-circle', '#F1948A', 19, 'Simulated zero-day vulnerabilities'),
    ('Rabbit Holes', 'compass', '#D7BDE2', 20, 'Deception and misdirection challenges')
ON CONFLICT (name) DO NOTHING;

-- ─── Seed Default Profile ───
INSERT INTO profiles (name, description, config, is_default)
SELECT
    'Full Surface',
    'All challenges enabled across all categories. The complete attack surface.',
    jsonb_build_object(
        'categories_enabled', (SELECT jsonb_agg(name) FROM categories),
        'challenges_enabled', 'all',
        'difficulty_range', jsonb_build_array('beginner', 'easy', 'medium', 'hard', 'expert'),
        'waf_enabled', true,
        'rabbit_holes_enabled', true
    ),
    true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE name = 'Full Surface');

INSERT INTO profiles (name, description, config, is_default)
SELECT
    'Beginner Track',
    'SQL Injection, XSS, and Access Control challenges only — ideal for newcomers.',
    jsonb_build_object(
        'categories_enabled', jsonb_build_array('SQL Injection', 'Cross-Site Scripting', 'Access Control'),
        'challenges_enabled', 'all',
        'difficulty_range', jsonb_build_array('beginner', 'easy'),
        'waf_enabled', false,
        'rabbit_holes_enabled', false
    ),
    false
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE name = 'Beginner Track');

INSERT INTO profiles (name, description, config, is_default)
SELECT
    'Expert Gauntlet',
    'Hard and expert challenges only. SSRF through Zero Day categories.',
    jsonb_build_object(
        'categories_enabled', 'all',
        'challenges_enabled', 'all',
        'difficulty_range', jsonb_build_array('hard', 'expert'),
        'waf_enabled', true,
        'rabbit_holes_enabled', true
    ),
    false
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE name = 'Expert Gauntlet');

COMMIT;
EOSQL

echo "=== Database initialization complete ==="
