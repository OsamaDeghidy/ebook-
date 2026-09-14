-- ==============================================================================
-- 🚀 simplest LMS - Withdrawals, Electronic Gateways & Approvals Migration
-- File: supabase/withdrawals_and_approvals_schema.sql
-- ==============================================================================

-- 1. WITHDRAWALS TABLE (سجل طلبات سحب الأرباح للمعلمين)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'vodafone_cash', -- 'vodafone_cash', 'instapay', 'bank_transfer', 'fawry'
  payout_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'rejected'
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id, status);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Allow withdrawals access') THEN
    CREATE POLICY "Allow withdrawals access" ON public.withdrawals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. ENSURE BOOKS APPROVAL FIELDS ARE FULLY PRESENT
ALTER TABLE IF EXISTS public.books
  ADD COLUMN IF NOT EXISTS author_id UUID,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved', -- 'draft', 'pending_approval', 'approved', 'rejected', 'edit_requested'
  ADD COLUMN IF NOT EXISTS admin_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS edit_request_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
