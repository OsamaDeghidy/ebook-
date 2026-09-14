-- ==============================================================================
-- 🚀 OSERA AI (OSERA SOFT) - Complete Database, Financial & Security Migration
-- File: supabase/complete_financial_and_approval_system.sql
-- 100% Deadlock-Free, Idempotent, Safe to run in Supabase SQL Editor anytime.
-- ==============================================================================

SET lock_timeout = '10s';

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (الحسابات، الأدوار، نقاط XP، ورصيد المحفظة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  phone TEXT,
  avatar_url TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  study_streak INTEGER DEFAULT 1,
  xp_points INTEGER DEFAULT 120,
  last_study_date DATE DEFAULT CURRENT_DATE,
  total_study_minutes INTEGER DEFAULT 0,
  badges JSONB DEFAULT '["welcome_badge"]'::jsonb,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 120;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_study_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_study_minutes INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '["welcome_badge"]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all manage profiles" ON public.profiles;
CREATE POLICY "Allow all manage profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. WALLET TRANSACTIONS TABLE (سجل حركات المحفظة: شحن، عمولات، استردادات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT,
  transaction_type TEXT NOT NULL DEFAULT 'deposit',
  balance_after NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  book_id TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'deposit';
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC DEFAULT 0;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS book_id TEXT;

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all wallet transactions access" ON public.wallet_transactions;
CREATE POLICY "Allow all wallet transactions access" ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. ENHANCED VOUCHERS TABLE (العمولات، الخصم، وإلغاء واسترداد الـ 24 ساعة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  book_id TEXT,
  voucher_type TEXT DEFAULT 'book_access',
  discount_percent INT DEFAULT 100,
  credit_amount NUMERIC DEFAULT 150,
  price_printed NUMERIC DEFAULT 150,
  commission_rate NUMERIC DEFAULT 10,
  commission_amount NUMERIC DEFAULT 15,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  created_by TEXT DEFAULT 'admin',
  created_by_user_id UUID,
  author_name TEXT DEFAULT 'إدارة المنصة',
  is_active BOOLEAN DEFAULT TRUE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by TEXT,
  used_by_user_id UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS voucher_type TEXT DEFAULT 'book_access';
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS credit_amount NUMERIC DEFAULT 150;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS price_printed NUMERIC DEFAULT 150;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 15;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS current_uses INT DEFAULT 0;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS used_by TEXT;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS used_by_user_id UUID;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_creator ON public.vouchers(created_by, is_used);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow vouchers access" ON public.vouchers;
DROP POLICY IF EXISTS "Allow all vouchers" ON public.vouchers;
CREATE POLICY "Allow all vouchers" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. BOOKS APPROVAL & REVISION WORKFLOW (دورة اعتماد ونشر المذكرات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT DEFAULT 'د. كريم كامل',
  author_id UUID,
  category TEXT DEFAULT 'digital_book',
  subcategory TEXT,
  grade_level TEXT,
  tags TEXT[] DEFAULT ARRAY['كتاب_تفاعلي'],
  price NUMERIC DEFAULT 0,
  is_external BOOLEAN DEFAULT FALSE,
  external_url TEXT,
  preview_video_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  approval_status TEXT DEFAULT 'approved',
  admin_rejection_reason TEXT,
  edit_request_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 120,
  chapters JSONB DEFAULT '[]'::jsonb,
  mind_map JSONB DEFAULT '{}'::jsonb,
  question_bank JSONB DEFAULT '[]'::jsonb,
  feature_toggles JSONB DEFAULT '{"show_podcast": true, "show_flashcards": true, "show_quiz": true, "show_sandbox": true, "show_mindmap": true, "show_videos": true}'::jsonb,
  is_stem_enhanced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS edit_request_notes TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_stem_enhanced BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_books_approval ON public.books(approval_status, is_published);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all manage books" ON public.books;
CREATE POLICY "Allow all manage books" ON public.books FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. REELS (استوديو الريلز التعليمية ومقاطع الفيديو)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reels (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  book_title TEXT,
  author_name TEXT,
  category TEXT,
  subcategory TEXT,
  thumbnail_url TEXT,
  chapter_id TEXT,
  chapter_title TEXT,
  style_type TEXT DEFAULT 'chalkboard',
  style TEXT DEFAULT 'chalkboard',
  voice TEXT DEFAULT 'ar-SA-HamedNeural',
  duration_seconds INTEGER DEFAULT 45,
  audio_url TEXT,
  narration_script TEXT,
  scenes JSONB DEFAULT '[]'::jsonb,
  word_timings JSONB DEFAULT '[]'::jsonb,
  visual_cards JSONB DEFAULT '[]'::jsonb,
  interactive_quiz JSONB,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  is_public_teaser BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reels_book_id ON public.reels(book_id);

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all manage reels" ON public.reels;
CREATE POLICY "Allow all manage reels" ON public.reels FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. QUIZ ATTEMPTS & STUDY SESSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  chapter_id TEXT,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow all quiz attempts" ON public.quiz_attempts FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  chapter_id TEXT,
  duration_minutes INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_book ON public.study_sessions(user_id, book_id);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow study sessions access" ON public.study_sessions;
CREATE POLICY "Allow study sessions access" ON public.study_sessions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. WITHDRAWALS TABLE (سجل طلبات سحب الأرباح للمدرسين)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  amount NUMERIC NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'vodafone_cash',
  payout_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_number TEXT,
  admin_note TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'vodafone_cash';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payout_details TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id, status);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow withdrawals access" ON public.withdrawals;
CREATE POLICY "Allow withdrawals access" ON public.withdrawals FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. PLATFORM SETTINGS (هوية المنصة واللوجو والبيانات المالية والعمولات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_settings',
  brand_name TEXT NOT NULL DEFAULT 'أوسيرا AI',
  brand_subtitle TEXT NOT NULL DEFAULT 'المنصة الذكية للكتب والمذكرات التعليمية',
  brand_logo_url TEXT DEFAULT '',
  company_name TEXT NOT NULL DEFAULT 'شركة أوسيرا سوفت للحلول الذكية (Osera Soft AI)',
  founder_name TEXT NOT NULL DEFAULT 'فريق مهندسي أوسيرا AI',
  support_phone TEXT NOT NULL DEFAULT '+201066906132',
  support_email TEXT NOT NULL DEFAULT 'support@osera-ai.com',
  whatsapp_number TEXT NOT NULL DEFAULT '+201066906132',
  copyright_text TEXT NOT NULL DEFAULT 'جميع الحقوق محفوظة © 2026 لشركة أوسيرا سوفت AI',
  platform_commission_rate NUMERIC DEFAULT 15,
  min_withdrawal_amount NUMERIC DEFAULT 100,
  book_generation_cost NUMERIC DEFAULT 25,
  allow_wallet_payment BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS platform_commission_rate NUMERIC DEFAULT 15;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS min_withdrawal_amount NUMERIC DEFAULT 100;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS book_generation_cost NUMERIC DEFAULT 25;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS allow_wallet_payment BOOLEAN DEFAULT TRUE;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all platform settings access" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow all platform settings" ON public.platform_settings;
CREATE POLICY "Allow all platform settings access" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.platform_settings (id, brand_name, brand_subtitle, company_name, founder_name, support_phone, support_email, whatsapp_number, copyright_text, platform_commission_rate, min_withdrawal_amount, book_generation_cost, allow_wallet_payment)
VALUES (
  'default_settings',
  'أوسيرا AI',
  'المنصة الذكية للكتب والمذكرات التعليمية',
  'شركة أوسيرا سوفت للحلول الذكية (Osera Soft AI)',
  'فريق مهندسي أوسيرا AI',
  '+201066906132',
  'support@osera-ai.com',
  '+201066906132',
  'جميع الحقوق محفوظة © 2026 لشركة أوسيرا سوفت AI',
  15,
  100,
  25,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. USER PURCHASES, PURCHASES & PAYMENTS (الوصول مدى الحياة وبوابات الدفع)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  access_type TEXT DEFAULT 'lifetime',
  payment_method TEXT DEFAULT 'wallet',
  payment_reference TEXT,
  amount_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user_book ON public.user_purchases(user_id, book_id);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user purchases access" ON public.user_purchases;
DROP POLICY IF EXISTS "Allow all user purchases" ON public.user_purchases;
CREATE POLICY "Allow all user purchases" ON public.user_purchases FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow purchases access" ON public.purchases;
DROP POLICY IF EXISTS "Allow all purchases" ON public.purchases;
CREATE POLICY "Allow all purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow payments access" ON public.payments;
DROP POLICY IF EXISTS "Allow all payments" ON public.payments;
CREATE POLICY "Allow all payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. ATOMIC FUNCTION: CANCEL VOUCHER & REFUND COMMISSION (Within 24 Hours)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_voucher_with_refund(
  p_voucher_code TEXT,
  p_instructor_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_instructor RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- 1. Check voucher existence, usage, and 24h deadline
  SELECT * INTO v_voucher 
  FROM public.vouchers 
  WHERE UPPER(code) = UPPER(p_voucher_code) 
    AND is_used = FALSE 
    AND is_cancelled = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'الكارت غير موجود، أو تم استخدامه، أو تم إلغاؤه مسبقاً.'
    );
  END IF;

  IF v_voucher.cancellation_deadline IS NOT NULL AND NOW() > v_voucher.cancellation_deadline THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'عفواً، انتهت مهلة الـ 24 ساعة المسموحة لإلغاء واسترجاع الكارت.'
    );
  END IF;

  -- 2. Mark voucher as cancelled
  UPDATE public.vouchers
  SET is_cancelled = TRUE,
      cancelled_at = NOW()
  WHERE id = v_voucher.id;

  -- 3. Refund commission to instructor wallet
  SELECT * INTO v_instructor FROM public.profiles WHERE id = p_instructor_id;
  v_new_balance := COALESCE(v_instructor.wallet_balance, 0) + COALESCE(v_voucher.commission_amount, 15);

  UPDATE public.profiles
  SET wallet_balance = v_new_balance
  WHERE id = p_instructor_id;

  -- 4. Record wallet transaction
  INSERT INTO public.wallet_transactions (user_id, transaction_type, amount, balance_after, description, reference_id)
  VALUES (
    p_instructor_id, 
    'refund', 
    COALESCE(v_voucher.commission_amount, 15), 
    v_new_balance, 
    'استرداد عمولة كارت ملغي خلال 24 ساعة (' || v_voucher.code || ')',
    v_voucher.code
  );

  RETURN jsonb_build_object(
    'success', true,
    'refunded_amount', COALESCE(v_voucher.commission_amount, 15),
    'new_balance', v_new_balance,
    'message', 'تم إلغاء الكارت بنجاح واسترداد عمولة المنصة (' || COALESCE(v_voucher.commission_amount, 15) || ' ج.م) لمحفظتك! 💰'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC PROFILE TRIGGER FOR SUPABASE AUTH
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

