-- ============================================================================
-- CREATE SHIFT_STOCK_ENTRIES TABLE - Shift-Based Stock Tracking
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor to enable closed shift tracking
-- This table stores opening/added/sold/closing stock per shift per product

CREATE TABLE IF NOT EXISTS public.shift_stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  branch_id TEXT NOT NULL DEFAULT 'branch1',
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,

  opening_stock DECIMAL(10, 2) DEFAULT 0,
  added_stock DECIMAL(10, 2) DEFAULT 0,
  sold_stock DECIMAL(10, 2) DEFAULT 0,
  closing_stock DECIMAL(10, 2) DEFAULT 0,
  variance DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(shift_id, product_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_branch_date
ON public.shift_stock_entries(branch_id, shift_date DESC);

CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_cashier
ON public.shift_stock_entries(cashier_id, shift_date DESC);

-- ============================================================================
-- Verify the table was created
-- ============================================================================
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'shift_stock_entries';
