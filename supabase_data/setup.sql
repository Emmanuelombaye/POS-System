-- Enable UUID extension for wholesale_summaries
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  stock_kg DECIMAL(10, 2) NOT NULL,
  low_stock_threshold_kg DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL REFERENCES users(id),
  shift_id UUID, -- Optional: link transaction to a shift
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB,
  discount JSONB,
  subtotal DECIMAL(10, 2),
  total DECIMAL(10, 2),
  payment_method TEXT
);

-- 4. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT,
  role TEXT,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create wholesale_summaries table
CREATE TABLE IF NOT EXISTS wholesale_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')),
  cash_received INTEGER NOT NULL DEFAULT 0,
  mpesa_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id TEXT NOT NULL REFERENCES users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING_REVIEW', 'APPROVED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create stock_additions table
CREATE TABLE IF NOT EXISTS stock_additions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id),
  item_id TEXT REFERENCES products(id),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_by TEXT REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create inventory_ledger table
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT REFERENCES products(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('OPENING_SNAPSHOT', 'SALE', 'STOCK_ADDED', 'WASTAGE', 'SHIFT_CLOSE', 'MANUAL_ADJUST')),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  user_id TEXT REFERENCES users(id),
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create shift_stock_snapshots table
CREATE TABLE IF NOT EXISTS shift_stock_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id),
  item_id TEXT REFERENCES products(id),
  opening_kg DECIMAL(10, 2) NOT NULL,
  expected_closing_kg DECIMAL(10, 2),
  actual_closing_kg DECIMAL(10, 2),
  variance_kg DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shift_id, item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_branch ON wholesale_summaries(branch);
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_date ON wholesale_summaries(date);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_item ON inventory_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_shift ON inventory_ledger(shift_id);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE wholesale_summaries;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_additions;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE shift_stock_snapshots;
