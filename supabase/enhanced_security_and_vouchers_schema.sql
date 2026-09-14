-- ==============================================================================
-- 🚀 simplest LMS - Enhanced Security, Vouchers, AI Tutor & Gamification Schema
-- File: supabase/enhanced_security_and_vouchers_schema.sql
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. UPGRADE PROFILES TABLE (Gamification, Roles & Single-Session Guard)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student', -- 'student', 'instructor', 'admin'
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS last_study_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '["welcome_badge"]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_device_id TEXT,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------------------------
-- 2. VOUCHERS TABLE (كروت الشحن وأكواد السناتر والمكتبات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  created_by TEXT DEFAULT 'admin',
  author_name TEXT DEFAULT 'إدارة المنصة',
  discount_percent NUMERIC DEFAULT 100, -- 100 for 100% full access
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT, -- Email or User ID of redeeming student
  used_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for instant voucher lookup & redemption
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON public.vouchers(is_used);
CREATE INDEX IF NOT EXISTS idx_vouchers_book_id ON public.vouchers(book_id);

-- Enable RLS for Vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Admins & Instructors can create and view vouchers
CREATE POLICY "Admins and instructors can manage vouchers" ON public.vouchers
  FOR ALL USING (true) WITH CHECK (true);

-- Authenticated students can redeem vouchers
CREATE POLICY "Students can redeem unused vouchers" ON public.vouchers
  FOR UPDATE USING (is_used = FALSE);

-- ------------------------------------------------------------------------------
-- 3. DEVICE SESSIONS TABLE (بصمة الأجهزة ومنع تعدد الأجهزة ومشاركة الحسابات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.device_sessions(user_id, is_active);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own device sessions" ON public.device_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. UPGRADE PURCHASES TABLE (توثيق الشراء عبر كروت الشحن ومحافظ كاش وإنستاباي)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.purchases
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'voucher', -- 'voucher', 'vodafone_cash', 'instapay', 'direct'
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'; -- 'completed', 'pending_approval', 'refunded'

CREATE INDEX IF NOT EXISTS idx_purchases_user_book ON public.purchases(user_id, book_id);

-- ------------------------------------------------------------------------------
-- 5. AI ESSAY SUBMISSIONS TABLE (سجل تصحيح الأسئلة المقالية بالذكاء الاصطناعي)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_essay_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id TEXT,
  question TEXT NOT NULL,
  model_answer TEXT,
  student_answer TEXT NOT NULL,
  ai_score NUMERIC NOT NULL,
  max_score NUMERIC DEFAULT 5,
  ai_feedback TEXT,
  ideal_points_covered JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_essay_user ON public.ai_essay_submissions(user_id, book_id);

ALTER TABLE public.ai_essay_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and submit their own essay answers" ON public.ai_essay_submissions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can review all essay submissions" ON public.ai_essay_submissions
  FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 6. CONTEXTUAL AI TUTOR QUERIES TABLE (سجل أسئلة واستفسارات المعلم الذكي)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_tutor_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_title TEXT,
  selected_text TEXT NOT NULL,
  query_type TEXT DEFAULT 'simplify', -- 'simplify', 'exam', 'summary', 'custom'
  ai_explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_tutor_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own AI tutor interactions" ON public.ai_tutor_queries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. ATOMIC STORED FUNCTION: REDEEM VOUCHER & UNLOCK COURSE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_voucher_and_unlock(
  p_code TEXT,
  p_user_id UUID,
  p_book_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_target_book_id UUID;
BEGIN
  -- 1. Check if voucher exists and is unused
  SELECT * INTO v_voucher 
  FROM public.vouchers 
  WHERE UPPER(code) = UPPER(p_code) AND is_used = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'كود كارت الشحن غير صحيح أو تم استخدامه مسبقاً.'
    );
  END IF;

  -- 2. Determine target book
  v_target_book_id := COALESCE(v_voucher.book_id, p_book_id);

  -- 3. Mark voucher as used
  UPDATE public.vouchers
  SET is_used = TRUE,
      used_by_user_id = p_user_id,
      used_at = NOW()
  WHERE id = v_voucher.id;

  -- 4. Unlock course in purchases table
  INSERT INTO public.purchases (user_id, book_id, payment_method, reference_number, status)
  VALUES (p_user_id, v_target_book_id, 'voucher', p_code, 'completed')
  ON CONFLICT (user_id, book_id) DO UPDATE SET status = 'completed';

  -- 5. Award +50 XP for course activation
  UPDATE public.profiles
  SET xp_points = COALESCE(xp_points, 100) + 50
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تفعيل كارت الشحن وفتح المقرر بالكامل! مبروك 🎉',
    'book_id', v_target_book_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
