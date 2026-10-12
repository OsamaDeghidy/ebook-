-- =========================================================================
-- Supabase Migration: International & Multilingual Platform Support
-- Target Languages: Arabic (ar), English (en), Italian (it), French (fr), German (de)
-- Run this in your Supabase Project Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Add language column to books table (Default: 'ar')
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'ar';

-- 2. Add language learning mode columns
-- is_language_learning: Flag indicating this book/course is for teaching a second language
-- target_learning_language: The language being taught (e.g., 'it' for Italian, 'en' for English)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS is_language_learning BOOLEAN DEFAULT false;

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS target_learning_language VARCHAR(10) DEFAULT NULL;

-- 3. Add index for fast filtering by language in marketplace & search
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);
CREATE INDEX IF NOT EXISTS idx_books_lang_learning ON books(is_language_learning);

-- 4. Add descriptive comments
COMMENT ON COLUMN books.language IS 'Primary language of the book/curriculum: ar, en, it, fr, de';
COMMENT ON COLUMN books.is_language_learning IS 'Flag for bilingual language-learning courses (e.g. Italian for Arabic speakers)';
COMMENT ON COLUMN books.target_learning_language IS 'The target foreign language being taught in bilingual mode';

-- 5. Reload PostgREST schema cache so columns are immediately active
NOTIFY pgrst, 'reload schema';
