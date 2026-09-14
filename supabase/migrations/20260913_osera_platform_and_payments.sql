-- ==============================================================================
-- 🚀 OSERA AI - RESILIENT DATABASE SCHEMA & MIGRATIONS
-- ==============================================================================

-- 1. جدول إعدادات الهوية والتحكم في الخصائص (Platform Settings)
CREATE TABLE IF NOT EXISTS platform_settings (
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
  features JSONB NOT NULL DEFAULT '{"showReels": true, "showGamification": true, "showInstructorHubShortcut": true, "showAiRobot": true, "showWalletAndCredits": true, "enableVoucherCodes": true}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS brand_name TEXT NOT NULL DEFAULT 'أوسيرا AI';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS brand_subtitle TEXT NOT NULL DEFAULT 'المنصة الذكية للكتب والمذكرات التعليمية';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS brand_logo_url TEXT DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS company_name TEXT NOT NULL DEFAULT 'شركة أوسيرا سوفت للحلول الذكية (Osera Soft AI)';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS founder_name TEXT NOT NULL DEFAULT 'فريق مهندسي أوسيرا AI';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_phone TEXT NOT NULL DEFAULT '+201066906132';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS support_email TEXT NOT NULL DEFAULT 'support@osera-ai.com';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '+201066906132';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS copyright_text TEXT NOT NULL DEFAULT 'جميع الحقوق محفوظة © 2026 لشركة أوسيرا سوفت AI';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{"showReels": true, "showGamification": true, "showInstructorHubShortcut": true, "showAiRobot": true, "showWalletAndCredits": true, "enableVoucherCodes": true}'::jsonb;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

INSERT INTO platform_settings (id, brand_name, brand_subtitle, company_name, founder_name, support_phone, support_email, whatsapp_number, copyright_text)
VALUES (
  'default_settings',
  'أوسيرا AI',
  'المنصة الذكية للكتب والمذكرات التعليمية',
  'شركة أوسيرا سوفت للحلول الذكية (Osera Soft AI)',
  'فريق مهندسي أوسيرا AI',
  '+201066906132',
  'support@osera-ai.com',
  '+201066906132',
  'جميع الحقوق محفوظة © 2026 لشركة أوسيرا سوفت AI'
)
ON CONFLICT (id) DO UPDATE SET
  brand_name = EXCLUDED.brand_name,
  company_name = EXCLUDED.company_name;

-- 2. جدول المعاملات وتفاصيل الدفع (Payments & Transactions)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS book_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS book_title TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paymob_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. جدول فتح المقررات للمستخدمين (User Book Purchases)
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL DEFAULT 'lifetime',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, book_id)
);

ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'lifetime';
ALTER TABLE user_purchases ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 4. جدول كروت الشحن وأكواد السناتر (Center Vouchers) - مع التحديث الآمن
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  book_id TEXT,
  discount_percent INT DEFAULT 100,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS book_id TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 100;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS current_uses INT DEFAULT 0;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- إدراج الأكواد التجريبية المعتمدة
INSERT INTO vouchers (code, book_id, discount_percent, max_uses, is_active)
VALUES 
  ('SIMP-2026-VIP', NULL, 100, 10000, true),
  ('OSERA-PRO-2026', NULL, 100, 10000, true)
ON CONFLICT (code) DO NOTHING;

-- 5. تفعيل الصلاحيات (Row Level Security - RLS)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read platform settings" ON platform_settings;
CREATE POLICY "Public read platform settings" ON platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage platform settings" ON platform_settings;
CREATE POLICY "Service role manage platform settings" ON platform_settings FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access payments" ON payments;
CREATE POLICY "Service role full access payments" ON payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own purchases" ON user_purchases;
CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access user purchases" ON user_purchases;
CREATE POLICY "Service role full access user purchases" ON user_purchases FOR ALL USING (true);

DROP POLICY IF EXISTS "Public can view active vouchers" ON vouchers;
CREATE POLICY "Public can view active vouchers" ON vouchers FOR SELECT USING (is_active = true);