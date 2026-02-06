-- Add shift cash/mpesa reporting fields
-- Run this in Supabase SQL editor

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS closing_cash NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_mpesa NUMERIC(12,2) DEFAULT 0;

-- Optional: indexes for reporting
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON public.shifts(cashier_id);
