-- SCRIPT_00_FRESH_DATABASE.sql
-- Drops everything and creates fresh database with NO mock data
-- Just tables, indexes, and RLS policies - ready for real data

-- ============================================================================
-- PART 1: DROP ALL EXISTING DATA (in reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS public.shift_stock_entries CASCADE;
DROP TABLE IF EXISTS public.stock_additions CASCADE;
DROP TABLE IF EXISTS public.inventory_ledger CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wholesale_summaries CASCADE;
DROP TABLE IF EXISTS public.shifts CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- ============================================================================
-- PART 2: CREATE ALL TABLES (EMPTY)
-- ============================================================================

-- Users table
CREATE TABLE public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  branch_id TEXT DEFAULT 'branch1',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  weight_kg NUMERIC(10, 3),
  low_stock_threshold_kg NUMERIC(10, 3) DEFAULT 50,
  supplier TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE public.shifts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  cashier_name TEXT,
  branch_id TEXT DEFAULT 'branch1',
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_time TIMESTAMP WITH TIME ZONE NOT NULL,
  closing_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending_review')),
  opening_stock_total NUMERIC(12, 2) DEFAULT 0,
  closing_stock_total NUMERIC(12, 2),
  expected_stock NUMERIC(12, 2),
  actual_stock NUMERIC(12, 2),
  stock_variance NUMERIC(12, 2),
  closing_cash NUMERIC(12, 2),
  closing_mpesa NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  branch_id TEXT DEFAULT 'branch1',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  quantity_kg NUMERIC(10, 3) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock additions table
CREATE TABLE public.stock_additions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE SET NULL,
  cashier_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  branch_id TEXT DEFAULT 'branch1',
  addition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  addition_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  quantity_kg NUMERIC(10, 3) NOT NULL,
  unit_cost NUMERIC(12, 2),
  total_cost NUMERIC(12, 2),
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory ledger table
CREATE TABLE public.inventory_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id TEXT DEFAULT 'branch1',
  movement_type TEXT NOT NULL CHECK (movement_type IN ('opening', 'sale', 'addition', 'adjustment', 'closing')),
  quantity_change NUMERIC(10, 3) NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shift stock entries table
CREATE TABLE public.shift_stock_entries (
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

-- Wholesale summaries table
CREATE TABLE public.wholesale_summaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  branch_id TEXT DEFAULT 'branch1',
  total_meat_kg NUMERIC(10, 3) DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  cash_collected NUMERIC(12, 2) DEFAULT 0,
  mpesa_collected NUMERIC(12, 2) DEFAULT 0,
  expected_vs_actual_variance NUMERIC(12, 2),
  report_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_branch_id ON public.users(branch_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_shifts_cashier_id ON public.shifts(cashier_id);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_shifts_date ON public.shifts(shift_date DESC);
CREATE INDEX idx_shifts_branch ON public.shifts(branch_id);
CREATE INDEX idx_transactions_shift_id ON public.transactions(shift_id);
CREATE INDEX idx_transactions_cashier_id ON public.transactions(cashier_id);
CREATE INDEX idx_transactions_product_id ON public.transactions(product_id);
CREATE INDEX idx_transactions_payment_method ON public.transactions(payment_method);
CREATE INDEX idx_stock_additions_shift_id ON public.stock_additions(shift_id);
CREATE INDEX idx_stock_additions_product_id ON public.stock_additions(product_id);
CREATE INDEX idx_inventory_ledger_product ON public.inventory_ledger(product_id);
CREATE INDEX idx_shift_stock_entries_shift_id ON public.shift_stock_entries(shift_id);
CREATE INDEX idx_shift_stock_entries_product_id ON public.shift_stock_entries(product_id);
CREATE INDEX idx_shift_stock_entries_cashier_id ON public.shift_stock_entries(cashier_id);

-- ============================================================================
-- PART 4: DISABLE ROW LEVEL SECURITY (Permissive for development)
-- ============================================================================

-- Note: RLS disabled for development. Enable when moving to production with proper policies.
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.stock_additions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shift_stock_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.wholesale_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMIT;
