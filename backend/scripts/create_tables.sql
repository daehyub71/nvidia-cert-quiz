-- NVIDIA Cert Quiz - Supabase Database Schema
-- Table names use 'nq_' prefix to avoid conflicts with other projects

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS nq_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS nq_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text_en TEXT NOT NULL,
    question_text_ko TEXT,
    options_en JSONB NOT NULL,
    options_ko JSONB,
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 5),
    category VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_day INTEGER,
    source_image VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question statistics
CREATE TABLE IF NOT EXISTS nq_question_stats (
    question_id UUID PRIMARY KEY REFERENCES nq_questions(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz history
CREATE TABLE IF NOT EXISTS nq_quiz_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    question_ids UUID[] NOT NULL,
    config JSONB,
    score INTEGER,
    total_time_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS nq_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    question_id UUID NOT NULL REFERENCES nq_questions(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Wrong answers
CREATE TABLE IF NOT EXISTS nq_wrong_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    question_id UUID NOT NULL REFERENCES nq_questions(id) ON DELETE CASCADE,
    selected_answer INTEGER NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Explanations cache
CREATE TABLE IF NOT EXISTS nq_explanations (
    question_id UUID PRIMARY KEY REFERENCES nq_questions(id) ON DELETE CASCADE,
    explanation_en TEXT,
    explanation_ko TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nq_questions_category ON nq_questions(category);
CREATE INDEX IF NOT EXISTS idx_nq_questions_difficulty ON nq_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_nq_quiz_history_user_id ON nq_quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nq_quiz_history_status ON nq_quiz_history(status);
CREATE INDEX IF NOT EXISTS idx_nq_bookmarks_user_id ON nq_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_nq_wrong_answers_user_id ON nq_wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_nq_wrong_answers_reviewed ON nq_wrong_answers(reviewed);

-- Row Level Security (RLS) - Optional, enable if needed
-- ALTER TABLE nq_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nq_quiz_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nq_bookmarks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nq_wrong_answers ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to questions table
DROP TRIGGER IF EXISTS update_nq_questions_updated_at ON nq_questions;
CREATE TRIGGER update_nq_questions_updated_at
    BEFORE UPDATE ON nq_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
