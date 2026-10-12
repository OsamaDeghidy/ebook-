-- ==============================================================================
-- 🚀 تحديثات قاعدة بيانات سوبابيز (Supabase Schema Updates) - منصة إيبوك الذكية
-- انسخ هذا الملف والصقه في Supabase SQL Editor ثم اضغط Run
-- ==============================================================================

-- 1. إضافة حقول دعم اللغات المتعددة وتعليم اللغات في جدول الكتب (books)
ALTER TABLE IF EXISTS public.books
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar',
ADD COLUMN IF NOT EXISTS is_language_learning BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_learning_language TEXT DEFAULT 'ar';

-- 2. إضافة حقل الخريطة الذهنية الشاملة لكامل المنهج (curriculum_mindmap)
ALTER TABLE IF EXISTS public.books
ADD COLUMN IF NOT EXISTS curriculum_mindmap JSONB DEFAULT NULL;

-- 3. إضافة حقل سجل وبنك الامتحانات المعتمدة (exams)
ALTER TABLE IF EXISTS public.books
ADD COLUMN IF NOT EXISTS exams JSONB DEFAULT '[]'::jsonb;

-- 4. التأكد من وجود حقول الفصول وتوليد الأصول
ALTER TABLE IF EXISTS public.books
ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pregeneration_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS pregeneration_percent INTEGER DEFAULT 0;

-- 5. جدول سجل محاولات واختبارات الطلاب (quiz_attempts) لحفظ الدرجات
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    answers_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS وسياسات الأمان
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_attempts' AND policyname = 'Allow users to read their own quiz attempts'
    ) THEN
        CREATE POLICY "Allow users to read their own quiz attempts" 
        ON public.quiz_attempts 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quiz_attempts' AND policyname = 'Allow users to insert their own quiz attempts'
    ) THEN
        CREATE POLICY "Allow users to insert their own quiz attempts" 
        ON public.quiz_attempts 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- تحديث الكاش وإشعار نجاح التنفيذ
COMMENT ON TABLE public.quiz_attempts IS 'سجل نتائج ومحاولات الطلاب في الاختبارات التفاعلية والامتحانات الشاملة';
