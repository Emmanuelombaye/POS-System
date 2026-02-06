-- Expense Tracking System Table
-- Tracks all cashier expenses during shifts (transport, packaging, repairs, etc.)

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Financial details
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50) NOT NULL, -- Transport, Packaging, Repairs, Food, Supplies, Other
  description TEXT,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  
  -- Relationships
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  branch_id VARCHAR(100) NOT NULL,
  
  -- Approval & audit
  approved_by_admin BOOLEAN DEFAULT false,
  receipt_url TEXT, -- Optional receipt image
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_shift_id ON expenses(shift_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cashier_id ON expenses(cashier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Row level security (RLS) policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Cashiers can view their own expenses
CREATE POLICY "Cashiers can view own expenses" ON expenses
  FOR SELECT
  USING (cashier_id = auth.uid());

-- Policy: Cashiers can insert their own expenses
CREATE POLICY "Cashiers can insert own expenses" ON expenses
  FOR INSERT
  WITH CHECK (cashier_id = auth.uid());

-- Policy: Admins can view all expenses (handled by backend)
CREATE POLICY "Admins can view all expenses" ON expenses
  FOR SELECT
  USING (true);

-- Policy: Admins can update expenses (approval)
CREATE POLICY "Admins can update expenses" ON expenses
  FOR UPDATE
  USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

COMMENT ON TABLE expenses IS 'Tracks all cashier expenses during shifts for accurate profit calculation';
COMMENT ON COLUMN expenses.amount IS 'Expense amount in KES';
COMMENT ON COLUMN expenses.category IS 'Expense category: Transport, Packaging, Repairs, Food, Supplies, Other';
COMMENT ON COLUMN expenses.payment_method IS 'How expense was paid: cash or mpesa';
COMMENT ON COLUMN expenses.approved_by_admin IS 'Admin approval status for expense validation';
