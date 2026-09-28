-- ==============================================================================
-- 🚀 OSERA AI LMS - SUPABASE COMPREHENSIVE SCHEMA MIGRATION SCRIPT
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to ensure all academic,
-- interactive, and media columns exist in the 'books' and supporting tables.
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Comprehensive Columns for 'books' Table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026/2025',
ADD COLUMN IF NOT EXISTS academic_system TEXT DEFAULT 'general_arabic',
ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'pre_university',
ADD COLUMN IF NOT EXISTS grade_level TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS preview_video_url TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS mind_map JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS question_bank JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY['كتاب_تفاعلي'];

-- 3. Ensure 'user_purchases' table exists for paid courses and offline unlocks
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'completed'
);

-- 4. Enable Row Level Security (RLS) policies if needed
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published books
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Public read access for published books'
  ) THEN
    CREATE POLICY "Public read access for published books" 
    ON public.books FOR SELECT USING (is_published = true OR is_published IS NULL);
  END IF;
END $$;

-- 5. Force reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
