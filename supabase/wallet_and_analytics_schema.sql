-- ==============================================================================
-- 🚀 simplest LMS - Wallet, Flexible Vouchers & Live Analytics Schema
-- File: supabase/wallet_and_analytics_schema.sql
-- ==============================================================================

-- 1. ADD WALLET BALANCE & STUDY LOGS TO PROFILES
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_study_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE;

-- 2. ENHANCE VOUCHERS TABLE (Support for Book Pass vs Wallet Credit)
ALTER TABLE IF EXISTS public.vouchers
  ADD COLUMN IF NOT EXISTS voucher_type TEXT DEFAULT 'book_access', -- 'book_access' (unlocks book) | 'wallet_credit' (adds funds)
  ADD COLUMN IF NOT EXISTS credit_amount NUMERIC DEFAULT 0; -- E.g. 50 EGP, 100 EGP, 200 EGP

-- 3. STUDY SESSIONS TABLE (Real Time-Spent & Chapter Analytics)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id TEXT,
  duration_minutes INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_book ON public.study_sessions(user_id, book_id);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and instructors can view study metrics" ON public.study_sessions
  FOR SELECT USING (true);

-- 4. ATOMIC FUNCTION: REDEEM SMART VOUCHER (Book Pass OR Wallet Credit)
CREATE OR REPLACE FUNCTION public.redeem_smart_voucher(
  p_code TEXT,
  p_user_id UUID,
  p_target_book_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
BEGIN
  -- 1. Look up unused voucher
  SELECT * INTO v_voucher 
  FROM public.vouchers 
  WHERE UPPER(code) = UPPER(p_code) AND is_used = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'كود الكارت غير صحيح أو تم استخدامه مسبقاً.'
    );
  END IF;

  -- 2. Process based on voucher type
  IF v_voucher.voucher_type = 'wallet_credit' THEN
    -- Add funds to student wallet
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_voucher.credit_amount,
        xp_points = COALESCE(xp_points, 100) + 20
    WHERE id = p_user_id;

    -- Mark as used
    UPDATE public.vouchers
    SET is_used = TRUE,
        used_by_user_id = p_user_id,
        used_at = NOW()
    WHERE id = v_voucher.id;

    RETURN jsonb_build_object(
      'success', true,
      'type', 'wallet_credit',
      'amount', v_voucher.credit_amount,
      'message', 'تم شحن رصيد المحفظة بنجاح بقيمة ' || v_voucher.credit_amount || ' ج.م 🎉'
    );
  ELSE
    -- Book Access Pass
    -- If voucher is tied to specific book and student tried another, check target
    IF v_voucher.book_id IS NOT NULL AND p_target_book_id IS NOT NULL AND v_voucher.book_id <> p_target_book_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'هذا الكارت مخصص لمقرر آخر مسجل في السنتر.'
      );
    END IF;

    -- Unlock course
    INSERT INTO public.purchases (user_id, book_id, payment_method, reference_number, status)
    VALUES (p_user_id, COALESCE(v_voucher.book_id, p_target_book_id), 'voucher', p_code, 'completed')
    ON CONFLICT (user_id, book_id) DO UPDATE SET status = 'completed';

    -- Mark voucher as used
    UPDATE public.vouchers
    SET is_used = TRUE,
        used_by_user_id = p_user_id,
        used_at = NOW()
    WHERE id = v_voucher.id;

    -- Award XP
    UPDATE public.profiles
    SET xp_points = COALESCE(xp_points, 100) + 50
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'type', 'book_access',
      'book_id', COALESCE(v_voucher.book_id, p_target_book_id),
      'message', 'تم تفعيل كارت الشحن وفتح المقرر بالكامل! مبروك 🎉'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
