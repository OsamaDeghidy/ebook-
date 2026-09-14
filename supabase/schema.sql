-- ==============================================================================
-- 🚀 OSERA AI (OSERA SOFT) - MASTER PRODUCTION DATABASE SCHEMA
-- This script creates and ensures ALL tables exist in Supabase so no data is lost!
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (الحسابات، الأدوار، نقاط XP، ورصيد المحفظة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student', -- 'student', 'instructor', 'admin'
  phone TEXT,
  avatar_url TEXT,
  study_streak INTEGER DEFAULT 1,
  xp_points INTEGER DEFAULT 120,
  wallet_balance NUMERIC DEFAULT 0,
  last_study_date DATE DEFAULT CURRENT_DATE,
  badges JSONB DEFAULT '["welcome_badge"]'::jsonb,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 120;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_streak INTEGER DEFAULT 1;

-- ------------------------------------------------------------------------------
-- 2. BOOKS (المقررات والكتب التفاعلية بما فيها الفصول وبنوك الأسئلة)
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
  thumbnail_url TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 120,
  chapters JSONB DEFAULT '[]'::jsonb,
  mind_map JSONB DEFAULT '{}'::jsonb,
  question_bank JSONB DEFAULT '[]'::jsonb,
  feature_toggles JSONB DEFAULT '{"show_podcast": true, "show_flashcards": true, "show_quiz": true, "show_sandbox": true, "show_mindmap": true, "show_videos": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. REELS (استوديو الريلز ومقاطع الفيديو التفاعلية)
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

-- ------------------------------------------------------------------------------
-- 4. QUIZ ATTEMPTS (سجلات امتحانات وكويزات الطلاب)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  chapter_id TEXT,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  answers_log JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_book ON public.quiz_attempts(book_id);

-- ------------------------------------------------------------------------------
-- 5. PURCHASES & USER PURCHASES (المقررات المشتراة والمفتوحة)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  payment_id UUID,
  amount_paid NUMERIC DEFAULT 0,
  payment_gateway TEXT DEFAULT 'direct',
  payment_reference TEXT,
  access_type TEXT NOT NULL DEFAULT 'lifetime',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  book_id TEXT,
  payment_method TEXT DEFAULT 'voucher',
  reference_number TEXT,
  sender_phone TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. PAYMENTS (معاملات بوابات الدفع Paymob و PayPal)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  book_id TEXT NOT NULL,
  book_title TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  gateway TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,
  paymob_order_id TEXT,
  paypal_order_id TEXT,
  sender_phone TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. WALLET TRANSACTIONS & WITHDRAWALS (محفظة المعلمين وسحب الأرباح)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'credit', 'debit', 'sale_revenue', 'voucher_commission', 'deposit', 'withdrawal', 'refund'
  transaction_type TEXT,
  balance_after NUMERIC DEFAULT 0,
  description TEXT,
  book_id TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS balance_after NUMERIC DEFAULT 0;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  amount NUMERIC NOT NULL,
  method TEXT DEFAULT 'vodafone_cash',
  payout_method TEXT DEFAULT 'vodafone_cash',
  account_details TEXT,
  payout_details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
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

-- ------------------------------------------------------------------------------
-- 8. VOUCHERS (كروت شحن السناتر والمكتبات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  book_id TEXT,
  discount_percent INT DEFAULT 100,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS current_uses INT DEFAULT 0;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT false;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 15;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS price_printed NUMERIC DEFAULT 150;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS credit_amount NUMERIC DEFAULT 150;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- ------------------------------------------------------------------------------
-- 9. PLATFORM SETTINGS (هوية المنصة واللوجو والبيانات المالية)
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
-- 10. ENABLE ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for operational reliability
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all manage profiles" ON public.profiles;
CREATE POLICY "Allow all manage profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read books" ON public.books;
CREATE POLICY "Allow public read books" ON public.books FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all manage books" ON public.books;
CREATE POLICY "Allow all manage books" ON public.books FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read reels" ON public.reels;
CREATE POLICY "Allow public read reels" ON public.reels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all manage reels" ON public.reels;
CREATE POLICY "Allow all manage reels" ON public.reels FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Allow all quiz attempts" ON public.quiz_attempts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all user purchases" ON public.user_purchases;
CREATE POLICY "Allow all user purchases" ON public.user_purchases FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all payments" ON public.payments;
CREATE POLICY "Allow all payments" ON public.payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all platform settings" ON public.platform_settings;
CREATE POLICY "Allow all platform settings" ON public.platform_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all vouchers" ON public.vouchers;
CREATE POLICY "Allow all vouchers" ON public.vouchers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Allow all wallet transactions" ON public.wallet_transactions FOR ALL USING (true);

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
