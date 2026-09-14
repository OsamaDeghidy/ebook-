-- ==============================================================================
-- 🚀 simplest LMS - EduReels Master Schema (TikTok Engine for Learning & Lore)
-- File: supabase/edureels_master_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. REELS TABLE (جدول الريلز الفردية لكل فصل ومقرر ورواية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  style_type TEXT NOT NULL DEFAULT 'chalkboard', -- 'cyberpunk', 'chalkboard', 'cinematic', 'gamified'
  voice TEXT DEFAULT 'ar-SA-HamedNeural',
  duration_seconds INTEGER NOT NULL DEFAULT 45,
  audio_url TEXT,
  narration_script TEXT NOT NULL,
  scenes JSONB DEFAULT '[]'::jsonb, -- Array of { id, act: 'hook'|'concept'|'takeaway', title, badgeText, visualType, visualData, startSec, endSec }
  word_timings JSONB DEFAULT '[]'::jsonb, -- Array of { word, start_ms, end_ms }
  visual_cards JSONB DEFAULT '[]'::jsonb, -- Array of { title, content, type: 'formula'|'code'|'lore', start_sec, end_sec }
  interactive_quiz JSONB DEFAULT '{}'::jsonb, -- { question, options, correct_index, trigger_sec, explanation }
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  is_public_teaser BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrations for existing deployments
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS scenes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'ar-SA-HamedNeural';

CREATE INDEX IF NOT EXISTS idx_reels_book_chapter ON public.reels(book_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_reels_style_views ON public.reels(style_type, views_count DESC);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reels' AND policyname = 'Public reels are viewable by everyone') THEN
    CREATE POLICY "Public reels are viewable by everyone" ON public.reels FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reels' AND policyname = 'Instructors and Admins can manage reels') THEN
    CREATE POLICY "Instructors and Admins can manage reels" ON public.reels FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. REEL INTERACTIONS TABLE (سجل تفاعل الطلاب، المشاهدات، والأسئلة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reel_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
  watch_time_seconds NUMERIC DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_liked BOOLEAN DEFAULT FALSE,
  quiz_answered BOOLEAN DEFAULT FALSE,
  quiz_is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reel_interactions_user ON public.reel_interactions(user_id, reel_id);

ALTER TABLE public.reel_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reel_interactions' AND policyname = 'Users can manage their reel interactions') THEN
    CREATE POLICY "Users can manage their reel interactions" ON public.reel_interactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. STUDENT PREFERENCES TABLE (تفضيلات الطالب وخوارزمية التوصية)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  education_level TEXT DEFAULT 'third_secondary',
  academic_system TEXT DEFAULT 'thanawya_amma',
  preferred_topics JSONB DEFAULT '["physics", "chemistry", "programming", "novels"]'::jsonb,
  preferred_styles JSONB DEFAULT '["chalkboard", "cyberpunk", "cinematic", "gamified"]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_preferences' AND policyname = 'Users can view and edit their preferences') THEN
    CREATE POLICY "Users can view and edit their preferences" ON public.student_preferences FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
