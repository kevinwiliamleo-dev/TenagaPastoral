-- =====================================================
-- Sistem Evaluasi Kinerja Tenaga Pastoral
-- Database Schema (PostgreSQL/Supabase)
-- Last updated: January 28, 2026
-- =====================================================
-- NOTE: Schema ini adalah referensi. Database sebenarnya
-- dikelola via Prisma schema (prisma/schema.prisma)
-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    -- bcrypt hashed (12 rounds)
    role VARCHAR(50) NOT NULL DEFAULT 'PASTORAL_STAFF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'PASTORAL_STAFF'))
);
-- Index untuk query user
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- =====================================================
-- EVALUATION PERIODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);
-- Index untuk query periode
CREATE INDEX IF NOT EXISTS idx_periods_status ON evaluation_periods(status);
CREATE INDEX IF NOT EXISTS idx_periods_dates ON evaluation_periods(start_date, end_date);
-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    period_id UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
    CONSTRAINT chk_type CHECK (type IN ('SCALE_1_TO_5', 'TEXT', 'BOOLEAN'))
);
-- Index untuk query pertanyaan
CREATE INDEX IF NOT EXISTS idx_questions_period ON questions(period_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions("order");
-- =====================================================
-- EVALUATION SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS evaluation_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appraiser_id UUID REFERENCES users(id),
    -- Penilai (null jika anonim)
    appraisee_id UUID REFERENCES users(id),
    -- Yang dinilai
    period_id UUID NOT NULL REFERENCES evaluation_periods(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_submission UNIQUE (appraiser_id, appraisee_id, period_id)
);
-- Index untuk query submission
CREATE INDEX IF NOT EXISTS idx_submissions_period ON evaluation_submissions(period_id);
CREATE INDEX IF NOT EXISTS idx_submissions_appraiser ON evaluation_submissions(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_submissions_appraisee ON evaluation_submissions(appraisee_id);
-- =====================================================
-- ANSWERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES evaluation_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    score_value INTEGER,
    -- Untuk tipe SCALE_1_TO_5 (1-5)
    text_value TEXT,
    -- Untuk tipe TEXT
    bool_value BOOLEAN,
    -- Untuk tipe BOOLEAN
    CONSTRAINT chk_score_range CHECK (
        score_value IS NULL
        OR (
            score_value >= 1
            AND score_value <= 5
        )
    )
);
-- Index untuk query jawaban
CREATE INDEX IF NOT EXISTS idx_answers_submission ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
-- =====================================================
-- SAMPLE DATA (untuk development)
-- =====================================================
-- Admin user (password: admin123)
-- Hash dihasilkan dengan bcrypt 12 rounds
INSERT INTO users (email, name, password, role)
VALUES (
        'admin@kpi.com',
        'Administrator',
        '$2b$12$JmA/ka5OGpBrMpzKm3AuPuZ...',
        -- bcrypt hash
        'ADMIN'
    ) ON CONFLICT (email) DO NOTHING;
-- =====================================================
-- NOTES
-- =====================================================
-- 1. Semua ID menggunakan UUID untuk keamanan
-- 2. Password HARUS di-hash dengan bcrypt (12 rounds)
-- 3. Status flow: DRAFT -> ACTIVE -> CLOSED (tidak bisa kembali)
-- 4. Submission dengan appraiser_id NULL = evaluasi anonim
-- 5. Unique constraint mencegah duplikasi evaluasi