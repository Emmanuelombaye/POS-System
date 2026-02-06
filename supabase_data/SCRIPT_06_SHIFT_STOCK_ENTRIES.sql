-- SCRIPT_06_SHIFT_STOCK_ENTRIES.sql
-- Creates the shift_stock_entries table for tracking stock per shift

-- Create shift_stock_entries table
CREATE TABLE IF NOT EXISTS public.shift_stock_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  branch_id TEXT NOT NULL DEFAULT 'branch1',
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_stock NUMERIC(10, 2) DEFAULT 0,
  added_stock NUMERIC(10, 2) DEFAULT 0,
  sold_stock NUMERIC(10, 2) DEFAULT 0,
  closing_stock NUMERIC(10, 2) DEFAULT 0,
  variance NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shift_id, product_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_shift_id ON public.shift_stock_entries(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_product_id ON public.shift_stock_entries(product_id);
CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_cashier_id ON public.shift_stock_entries(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_branch_date ON public.shift_stock_entries(branch_id, shift_date DESC);

-- Enable RLS if needed
ALTER TABLE public.shift_stock_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read shift stock entries
CREATE POLICY "Allow authenticated users to read shift_stock_entries"
  ON public.shift_stock_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert shift stock entries
CREATE POLICY "Allow authenticated users to insert shift_stock_entries"
  ON public.shift_stock_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update shift stock entries
CREATE POLICY "Allow authenticated users to update shift_stock_entries"
  ON public.shift_stock_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
