-- =========================================================================
-- Supabase Migration: Interactive V2 Curriculum Explanations & Mind Maps
-- Run this in your Supabase Project Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. Add curriculum_explanation column (Stores full curriculum dual-voice interactive breakdown)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS curriculum_explanation JSONB DEFAULT NULL;

-- 2. Add curriculum_mindmap column (Stores AI-generated comprehensive curriculum mind map)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS curriculum_mindmap JSONB DEFAULT NULL;

-- 3. Comments for documentation
COMMENT ON COLUMN books.curriculum_explanation IS 'AI-generated interactive dual-voice synchronized curriculum explanation V2 with whiteboard graphics, quizzes, and timeline';
COMMENT ON COLUMN books.curriculum_mindmap IS 'AI-generated interactive comprehensive curriculum mind map nodes and Mermaid schema';

-- 4. Reload PostgREST schema cache so columns are immediately accessible via API
NOTIFY pgrst, 'reload schema';
