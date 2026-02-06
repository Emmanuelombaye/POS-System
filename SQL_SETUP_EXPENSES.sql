-- 🎯 EDEN DROP 001 POS - EXPENSE TRACKING FEATURE
-- Run this in Supabase SQL Editor to enable expenses

-- ====================================================================
-- 1. CREATE EXPENSES TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS expenses (
  -- Core identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  
  -- Expense details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('Transport', 'Supplies', 'Repairs', 'Other')),
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  
  -- Status & Audit
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_expenses_shift_id 
  ON expenses(shift_id);

CREATE INDEX IF NOT EXISTS idx_expenses_cashier_id 
  ON expenses(cashier_id);

CREATE INDEX IF NOT EXISTS idx_expenses_branch_id 
  ON expenses(branch_id);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at 
  ON expenses(created_at);

CREATE INDEX IF NOT EXISTS idx_expenses_approved 
  ON expenses(approved);

CREATE INDEX IF NOT EXISTS idx_expenses_payment_method 
  ON expenses(payment_method);

-- ====================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 4. CREATE RLS POLICIES
-- ====================================================================

-- DROP EXISTING POLICIES (if needed)
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can view all expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can approve expenses" ON expenses;

-- POLICY: Cashiers can insert expenses for their own shift
CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

-- POLICY: Users can view expenses from their shifts
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (
    cashier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLICY: Admins can view all expenses
CREATE POLICY "Admins can view all expenses" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- POLICY: Admins can approve expenses
CREATE POLICY "Admins can approve expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ====================================================================
-- 5. VERIFICATION
-- ====================================================================
-- Check if table was created successfully
-- SELECT * FROM expenses LIMIT 1;
-- 
-- Check indexes
-- SELECT * FROM pg_indexes WHERE tablename = 'expenses';
-- 
-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'expenses';
