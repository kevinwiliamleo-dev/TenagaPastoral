-- New tables for extended features
-- Run this manually in Supabase SQL Editor
-- =====================================================
-- PANCA TUGAS (5 PILLARS) - Pastoral Activities
-- =====================================================
CREATE TYPE pastoral_pillar AS ENUM (
    'LITURGIA',
    -- Peribadatan
    'DIAKONIA',
    -- Pelayanan Sosial
    'KERYGMA',
    -- Pewartaan
    'KOINONIA',
    -- Persekutuan
    'MARTYRIA' -- Kesaksian
);
CREATE TABLE IF NOT EXISTS pastoral_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pillar pastoral_pillar NOT NULL,
    date TIMESTAMP NOT NULL,
    duration INT DEFAULT 60,
    -- in minutes
    location VARCHAR(255),
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_activities_user ON pastoral_activities(user_id);
CREATE INDEX idx_activities_pillar ON pastoral_activities(pillar);
CREATE INDEX idx_activities_date ON pastoral_activities(date);
-- =====================================================
-- TASK MANAGEMENT
-- =====================================================
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TABLE IF NOT EXISTS pastoral_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    assigned_to UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
CREATE INDEX idx_tasks_status ON pastoral_tasks(status);
CREATE INDEX idx_tasks_assigned ON pastoral_tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON pastoral_tasks(created_by);
-- =====================================================
-- HELP CENTER / FAQ
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Umum',
    "order" INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_published ON faqs(is_published);
-- =====================================================
-- SEED DEFAULT FAQS
-- =====================================================
INSERT INTO faqs (question, answer, category, "order")
VALUES (
        'Bagaimana cara mengisi evaluasi?',
        'Buka menu "Evaluasi" dari sidebar, pilih periode yang aktif, pilih staf yang ingin dinilai, lalu isi formulir evaluasi dan klik "Kirim".',
        'Evaluasi',
        1
    ),
    (
        'Siapa yang bisa melihat hasil evaluasi saya?',
        'Hasil evaluasi Anda hanya dapat dilihat oleh Administrator dan diri Anda sendiri. Evaluator lain tidak dapat melihat hasil Anda.',
        'Evaluasi',
        2
    ),
    (
        'Bagaimana cara mengubah password?',
        'Buka menu "Profil" dari sidebar, scroll ke bagian "Keamanan", masukkan password lama dan password baru, lalu klik "Ubah Password".',
        'Akun',
        3
    ),
    (
        'Apa itu Panca Tugas?',
        'Panca Tugas adalah lima pilar pelayanan pastoral: Liturgia (Peribadatan), Diakonia (Pelayanan Sosial), Kerygma (Pewartaan), Koinonia (Persekutuan), dan Martyria (Kesaksian).',
        'Umum',
        4
    ),
    (
        'Bagaimana cara menghubungi admin?',
        'Hubungi admin melalui email atau telepon kantor Pusat Pastoral Keuskupan Surabaya.',
        'Umum',
        5
    ),
    (
        'Kapan periode evaluasi dibuka?',
        'Periode evaluasi biasanya dibuka setiap semester. Administrator akan mengaktifkan periode dan Anda akan melihat notifikasi di dashboard.',
        'Evaluasi',
        6
    );