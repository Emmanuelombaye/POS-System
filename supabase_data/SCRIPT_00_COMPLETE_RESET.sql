-- SCRIPT_00_COMPLETE_RESET.sql
-- Drops everything and creates fresh database with sample data

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
DROP TABLE IF EXISTS public.branches CASCADE;

-- ============================================================================
-- PART 2: CREATE ALL TABLES
-- ============================================================================

-- Branches table
CREATE TABLE public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  manager_id TEXT,
  manager_name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
-- PART 4: INSERT FRESH DATA
-- ============================================================================

-- Insert users (admin, manager, cashiers)
INSERT INTO public.users (id, name, email, phone, password_hash, role, branch_id, status) VALUES
('user-admin-1', 'Admin User', 'admin@ceopos.com', '+254700000001', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'admin', 'branch1', 'active'),
('user-manager-1', 'Manager John', 'manager@ceopos.com', '+254700000002', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'manager', 'branch1', 'active'),
('user-cashier-1', 'Cashier Alice', 'alice@ceopos.com', '+254700000003', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'cashier', 'branch1', 'active'),
('user-cashier-2', 'Cashier Bob', 'bob@ceopos.com', '+254700000004', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'cashier', 'branch1', 'active'),
('user-cashier-3', 'Cashier Carol', 'carol@ceopos.com', '+254700000005', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'cashier', 'branch1', 'active'),
('user-cashier-4', 'Cashier David', 'david@ceopos.com', '+254700000006', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'cashier', 'branch1', 'active');

-- Insert meat products
INSERT INTO public.products (id, code, name, category, unit_price, weight_kg, low_stock_threshold_kg, supplier, status) VALUES
('prod-beef-1', 'BEEF-001', 'Beef Chuck', 'Beef', 800.00, 1.0, 50.0, 'Local Supplier A', 'active'),
('prod-beef-2', 'BEEF-002', 'Beef Ribs', 'Beef', 900.00, 1.0, 40.0, 'Local Supplier A', 'active'),
('prod-beef-3', 'BEEF-003', 'Beef Mince', 'Beef', 850.00, 1.0, 60.0, 'Local Supplier A', 'active'),
('prod-lamb-1', 'LAMB-001', 'Lamb Leg', 'Lamb', 1200.00, 1.0, 30.0, 'Local Supplier B', 'active'),
('prod-lamb-2', 'LAMB-002', 'Lamb Chops', 'Lamb', 1300.00, 1.0, 25.0, 'Local Supplier B', 'active'),
('prod-chicken-1', 'CHKN-001', 'Chicken Breast', 'Chicken', 600.00, 1.0, 80.0, 'Local Supplier C', 'active'),
('prod-chicken-2', 'CHKN-002', 'Chicken Thigh', 'Chicken', 550.00, 1.0, 70.0, 'Local Supplier C', 'active'),

('prod-goat-1', 'GOAT-001', 'Goat Meat', 'Goat', 1100.00, 1.0, 28.0, 'Local Supplier E', 'active');

-- Insert branches
INSERT INTO public.branches (id, name, location, manager_name, phone, email, status) VALUES
('branch1', 'Main Branch', 'Nairobi CBD', 'John Mwangi', '+254722111111', 'main@edentop.co.ke', 'active'),
('branch2', 'Westlands Branch', 'Westlands', 'Jane Kipchoge', '+254722222222', 'westlands@edentop.co.ke', 'active'),
('branch3', 'Karen Branch', 'Karen', 'Peter Otieno', '+254722333333', 'karen@edentop.co.ke', 'active');

-- Insert shifts (2 open, 2 closed, multiple transactions)
INSERT INTO public.shifts (id, cashier_id, cashier_name, branch_id, shift_date, opening_time, closing_time, status, opening_stock_total, closing_stock_total, closing_cash, closing_mpesa) VALUES
('shift-001', 'user-cashier-1', 'Cashier Alice', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '8 hours', NULL, 'open', 500.0, NULL, NULL, NULL),
('shift-002', 'user-cashier-2', 'Cashier Bob', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '6 hours', NULL, 'open', 450.0, NULL, NULL, NULL),
('shift-003', 'user-cashier-3', 'Cashier Carol', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '32 hours', CURRENT_TIMESTAMP - INTERVAL '24 hours', 'closed', 400.0, 380.0, 8500.00, 3200.00),
('shift-004', 'user-cashier-4', 'Cashier David', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '30 hours', CURRENT_TIMESTAMP - INTERVAL '22 hours', 'closed', 420.0, 410.0, 9200.00, 2800.00);

-- Insert transactions for open shifts
INSERT INTO public.transactions (id, shift_id, cashier_id, product_id, branch_id, transaction_date, transaction_time, quantity_kg, unit_price, total, payment_method, description) VALUES
-- Shift 001 transactions
('trans-001', 'shift-001', 'user-cashier-1', 'prod-beef-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '7 hours', 5.0, 800.00, 4000.00, 'cash', 'Morning sale'),
('trans-002', 'shift-001', 'user-cashier-1', 'prod-chicken-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '6.5 hours', 8.0, 600.00, 4800.00, 'cash', 'Morning bulk'),
('trans-003', 'shift-001', 'user-cashier-1', 'prod-lamb-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '6 hours', 3.0, 1200.00, 3600.00, 'mpesa', 'Customer order'),


-- Shift 002 transactions
('trans-005', 'shift-002', 'user-cashier-2', 'prod-beef-2', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '5.5 hours', 6.0, 900.00, 5400.00, 'mpesa', 'Wholesale order'),
('trans-006', 'shift-002', 'user-cashier-2', 'prod-goat-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '5 hours', 2.5, 1100.00, 2750.00, 'cash', 'Premium cut'),
('trans-007', 'shift-002', 'user-cashier-2', 'prod-chicken-2', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '4.5 hours', 7.0, 550.00, 3850.00, 'cash', 'Retail pack'),

-- Shift 003 transactions (closed)
('trans-008', 'shift-003', 'user-cashier-3', 'prod-beef-1', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '31 hours', 4.0, 800.00, 3200.00, 'cash', 'Morning'),
('trans-009', 'shift-003', 'user-cashier-3', 'prod-lamb-2', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '28 hours', 2.0, 1300.00, 2600.00, 'mpesa', 'Customer'),


-- Shift 004 transactions (closed)
('trans-011', 'shift-004', 'user-cashier-4', 'prod-chicken-1', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '29 hours', 10.0, 600.00, 6000.00, 'cash', 'Retail'),
('trans-012', 'shift-004', 'user-cashier-4', 'prod-beef-3', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '26 hours', 3.0, 850.00, 2550.00, 'mpesa', 'Order'),
('trans-013', 'shift-004', 'user-cashier-4', 'prod-goat-1', 'branch1', CURRENT_DATE - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '23 hours', 1.5, 1100.00, 1650.00, 'cash', 'Premium');

-- Insert stock additions
INSERT INTO public.stock_additions (id, shift_id, product_id, cashier_id, branch_id, addition_date, addition_time, quantity_kg, unit_cost, total_cost, supplier) VALUES
('stock-add-001', 'shift-001', 'prod-beef-1', 'user-cashier-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '7.5 hours', 50.0, 600.00, 30000.00, 'Local Supplier A'),
('stock-add-002', 'shift-001', 'prod-chicken-1', 'user-cashier-1', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '7 hours', 80.0, 450.00, 36000.00, 'Local Supplier C'),
('stock-add-003', 'shift-002', 'prod-lamb-1', 'user-cashier-2', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '6 hours', 30.0, 900.00, 27000.00, 'Local Supplier B'),
('stock-add-004', 'shift-002', 'prod-beef-3', 'user-cashier-2', 'branch1', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '5.5 hours', 35.0, 700.00, 24500.00, 'Local Supplier A');

-- Insert shift stock entries for open shifts
INSERT INTO public.shift_stock_entries (id, shift_id, cashier_id, branch_id, product_id, shift_date, opening_stock, added_stock, sold_stock, closing_stock) VALUES
('entry-001', 'shift-001', 'user-cashier-1', 'branch1', 'prod-beef-1', CURRENT_DATE, 60.0, 50.0, 5.0, NULL),
('entry-002', 'shift-001', 'user-cashier-1', 'branch1', 'prod-chicken-1', CURRENT_DATE, 70.0, 80.0, 8.0, NULL),
('entry-003', 'shift-001', 'user-cashier-1', 'branch1', 'prod-lamb-1', CURRENT_DATE, 35.0, 0.0, 3.0, NULL),

('entry-005', 'shift-002', 'user-cashier-2', 'branch1', 'prod-beef-2', CURRENT_DATE, 55.0, 0.0, 6.0, NULL),
('entry-006', 'shift-002', 'user-cashier-2', 'branch1', 'prod-goat-1', CURRENT_DATE, 32.0, 0.0, 2.5, NULL),
('entry-007', 'shift-002', 'user-cashier-2', 'branch1', 'prod-chicken-2', CURRENT_DATE, 65.0, 0.0, 7.0, NULL);

-- ============================================================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Allow authenticated users to read users"
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read shifts"
  ON public.shifts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read transactions"
  ON public.transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read stock_additions"
  ON public.stock_additions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read shift_stock_entries"
  ON public.shift_stock_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read wholesale_summaries"
  ON public.wholesale_summaries FOR SELECT TO authenticated USING (true);

-- Allow inserts for authenticated users
CREATE POLICY "Allow authenticated users to insert shifts"
  ON public.shifts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert transactions"
  ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert stock_additions"
  ON public.stock_additions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert shift_stock_entries"
  ON public.shift_stock_entries FOR INSERT TO authenticated WITH CHECK (true);

-- Allow updates for authenticated users
CREATE POLICY "Allow authenticated users to update shifts"
  ON public.shifts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update shift_stock_entries"
  ON public.shift_stock_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

COMMIT;
