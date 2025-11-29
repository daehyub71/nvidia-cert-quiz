-- NVIDIA Cert Quiz - Supabase Table Creation Script
-- All tables use 'nq_' prefix to avoid conflicts with other projects

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Questions table (문제 은행)
CREATE TABLE IF NOT EXISTS nq_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text_en TEXT NOT NULL,
    question_text_ko TEXT NOT NULL,
    options_en JSONB NOT NULL,  -- Array of options
    options_ko JSONB NOT NULL,
    correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 5),
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_day INTEGER,
    source_image_en VARCHAR(255),
    source_image_ko VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users table (사용자 - Supabase Auth 연동)
CREATE TABLE IF NOT EXISTS nq_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    email VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'ko' CHECK (preferred_language IN ('en', 'ko')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quiz History table (시험 이력)
CREATE TABLE IF NOT EXISTS nq_quiz_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES nq_users(id) ON DELETE CASCADE,
    question_ids JSONB NOT NULL,  -- Array of question UUIDs
    config JSONB NOT NULL,  -- Quiz configuration (count, language, filters)
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    score INTEGER,
    total_time_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Bookmarks table (북마크)
CREATE TABLE IF NOT EXISTS nq_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES nq_users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES nq_questions(id) ON DELETE CASCADE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 5. Wrong Answers table (오답 노트)
CREATE TABLE IF NOT EXISTS nq_wrong_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES nq_users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES nq_questions(id) ON DELETE CASCADE,
    selected_answer INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 6. Explanations Cache table (해설 캐시)
CREATE TABLE IF NOT EXISTS nq_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES nq_questions(id) ON DELETE CASCADE UNIQUE,
    explanation_en TEXT NOT NULL,
    explanation_ko TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Question Stats table (문제별 통계)
CREATE TABLE IF NOT EXISTS nq_question_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES nq_questions(id) ON DELETE CASCADE UNIQUE,
    total_attempts INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    avg_time_seconds REAL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nq_questions_category ON nq_questions(category);
CREATE INDEX IF NOT EXISTS idx_nq_questions_difficulty ON nq_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_nq_questions_source_day ON nq_questions(source_day);

CREATE INDEX IF NOT EXISTS idx_nq_quiz_history_user ON nq_quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nq_quiz_history_status ON nq_quiz_history(status);
CREATE INDEX IF NOT EXISTS idx_nq_quiz_history_completed ON nq_quiz_history(completed_at);

CREATE INDEX IF NOT EXISTS idx_nq_bookmarks_user ON nq_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_nq_wrong_answers_user ON nq_wrong_answers(user_id);

-- Row Level Security (RLS)
ALTER TABLE nq_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nq_quiz_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nq_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nq_wrong_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON nq_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON nq_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own quiz history" ON nq_quiz_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz history" ON nq_quiz_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz history" ON nq_quiz_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks" ON nq_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON nq_bookmarks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wrong answers" ON nq_wrong_answers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wrong answers" ON nq_wrong_answers
    FOR ALL USING (auth.uid() = user_id);

-- Questions and explanations are publicly readable
CREATE POLICY "Questions are publicly readable" ON nq_questions
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Explanations are publicly readable" ON nq_explanations
    FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Question stats are publicly readable" ON nq_question_stats
    FOR SELECT TO PUBLIC USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_nq_questions_updated_at
    BEFORE UPDATE ON nq_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nq_question_stats_updated_at
    BEFORE UPDATE ON nq_question_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO nq_users (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

COMMENT ON TABLE nq_questions IS 'NVIDIA Cert Quiz - Question bank with bilingual support';
COMMENT ON TABLE nq_users IS 'NVIDIA Cert Quiz - User profiles linked to Supabase Auth';
COMMENT ON TABLE nq_quiz_history IS 'NVIDIA Cert Quiz - Quiz session history';
COMMENT ON TABLE nq_bookmarks IS 'NVIDIA Cert Quiz - User bookmarked questions';
COMMENT ON TABLE nq_wrong_answers IS 'NVIDIA Cert Quiz - User wrong answer tracking';
COMMENT ON TABLE nq_explanations IS 'NVIDIA Cert Quiz - AI-generated explanation cache';
COMMENT ON TABLE nq_question_stats IS 'NVIDIA Cert Quiz - Per-question statistics';
