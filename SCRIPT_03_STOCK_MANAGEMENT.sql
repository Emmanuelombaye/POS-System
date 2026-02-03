-- ============================================================================
-- STOCK MANAGEMENT MODULE - DATABASE MIGRATION
-- ============================================================================
-- Add stock_entries table for daily stock tracking per product per branch
-- Run this in Supabase SQL Editor after SCRIPT_02_SETUP_FRESH.sql

-- ============================================================================
-- 1. CREATE STOCK_ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL DEFAULT 'branch1',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Daily stock tracking
  opening_stock_kg DECIMAL(10, 2) DEFAULT 0,
  added_stock_kg DECIMAL(10, 2) DEFAULT 0,
  sold_stock_kg DECIMAL(10, 2) DEFAULT 0,
  closing_stock_kg DECIMAL(10, 2) DEFAULT 0,
  
  -- Variance tracking
  variance_kg DECIMAL(10, 2) DEFAULT 0,
  variance_reason TEXT,
  adjusted_closing_stock_kg DECIMAL(10, 2),
  
  -- Stock thresholds
  low_stock_threshold_kg DECIMAL(10, 2) DEFAULT 10,
  is_low_stock BOOLEAN DEFAULT FALSE,
  
  -- Audit trail
  recorded_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint per product per branch per date
  UNIQUE(product_id, branch_id, entry_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_entries_product_branch_date 
ON public.stock_entries(product_id, branch_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_stock_entries_low_stock 
ON public.stock_entries(branch_id, is_low_stock) WHERE is_low_stock = TRUE;

-- ============================================================================
-- 2. CREATE STOCK_ADJUSTMENTS TABLE (for variance tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stock_entry_id TEXT NOT NULL REFERENCES public.stock_entries(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('damage', 'theft', 'recount', 'supplier_return', 'other')),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CREATE STOCK_ALERTS TABLE (for low-stock notifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'variance', 'critical')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_unresolved 
ON public.stock_alerts(branch_id, is_resolved) WHERE is_resolved = FALSE;

-- ============================================================================
-- 4. CREATE SHIFT_STOCK_ENTRIES TABLE (shift-based stock tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shift_stock_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_branch_date
ON public.shift_stock_entries(branch_id, shift_date DESC);

CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_cashier
ON public.shift_stock_entries(cashier_id, shift_date DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
-- - stock_entries: Daily stock tracking per product per branch
-- - stock_adjustments: Variance tracking and adjustments
-- - stock_alerts: Low-stock and critical alerts
-- ============================================================================
