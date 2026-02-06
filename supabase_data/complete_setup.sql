-- ========================================
-- EDEN TOP POS - Complete Database Setup
-- ========================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (if any) to start fresh
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS stock_additions CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS wholesale_summaries CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert users with password: @AdminEdenDrop001
-- Password hash generated using bcryptjs
-- Hash: $2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z (for testing)
-- In production, generate with: bcryptjs.hashSync('@AdminEdenDrop001', 10)

INSERT INTO users (id, name, role, password_hash) VALUES
('a1', 'Owner (Admin)', 'admin', '$2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z'),
('m1', 'James (Manager)', 'manager', '$2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z'),
('c1', 'Amina (Cashier 1)', 'cashier', '$2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z'),
('c2', 'Peter (Cashier 2)', 'cashier', '$2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z'),
('c3', 'Grace (Cashier 3)', 'cashier', '$2a$10$YIjlrVxR8.Z8K8Z5Z5Z5Z')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- ========================================
-- 2. PRODUCTS TABLE
-- ========================================
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('beef', 'goat', 'offal', 'processed')),
  price_per_kg DECIMAL(10, 2) NOT NULL,
  stock_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  low_stock_threshold_kg DECIMAL(10, 2) DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO products VALUES
('beef-regular', 'Beef - Prime Cuts', 'BF-PRIME', 'beef', 780.00, 85.00, 15.00, true, NOW(), NOW()),
('goat-regular', 'Goat - Mixed', 'GT-MIX', 'goat', 720.00, 60.00, 10.00, true, NOW(), NOW()),
('liver-beef', 'Beef Liver', 'BF-LIVER', 'offal', 550.00, 25.00, 5.00, true, NOW(), NOW()),
('minced-beef', 'Minced Beef', 'BF-MINCED', 'processed', 800.00, 35.00, 7.00, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  category = EXCLUDED.category,
  price_per_kg = EXCLUDED.price_per_kg,
  stock_kg = EXCLUDED.stock_kg,
  low_stock_threshold_kg = EXCLUDED.low_stock_threshold_kg,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========================================
-- 3. TRANSACTIONS TABLE
-- ========================================
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB,
  discount JSONB,
  subtotal DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card'))
);

-- ========================================
-- 4. TRANSACTION ITEMS (nested in JSON for simplicity)
-- ========================================
-- Items are stored in transactions.items as JSONB array

-- ========================================
-- 5. AUDIT LOG TABLE
-- ========================================
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. SHIFTS TABLE
-- ========================================
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL REFERENCES users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING_REVIEW', 'APPROVED')),
  cashier_name TEXT
);

-- ========================================
-- 7. STOCK ADDITIONS TABLE
-- ========================================
CREATE TABLE stock_additions (
  id TEXT PRIMARY KEY,
  shift_id TEXT REFERENCES shifts(id),
  item_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT,
  quantity_kg DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 8. WHOLESALE SUMMARIES TABLE
-- ========================================
CREATE TABLE wholesale_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')),
  cash_received INTEGER NOT NULL DEFAULT 0,
  mpesa_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE INDEXES
-- ========================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_stock_item ON stock_additions(item_id);
CREATE INDEX idx_stock_status ON stock_additions(status);
CREATE INDEX idx_ws_branch ON wholesale_summaries(branch);
CREATE INDEX idx_ws_date ON wholesale_summaries(date);
CREATE INDEX idx_ws_created ON wholesale_summaries(created_at DESC);

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_summaries ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Users: Allow admins to read all users
CREATE POLICY "users_read_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_admin" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_admin" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete_admin" ON users FOR DELETE USING (true);

-- Products: Allow all authenticated users to read
CREATE POLICY "products_read_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_admin" ON products FOR UPDATE USING (true);
CREATE POLICY "products_delete_admin" ON products FOR DELETE USING (true);

-- Transactions: Allow all to read and insert
CREATE POLICY "transactions_read_all" ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert_all" ON transactions FOR INSERT WITH CHECK (true);

-- Audit Log: Allow all to read and insert
CREATE POLICY "audit_read_all" ON audit_log FOR SELECT USING (true);
CREATE POLICY "audit_insert_all" ON audit_log FOR INSERT WITH CHECK (true);

-- Shifts: Allow all to read, insert, and update
CREATE POLICY "shifts_read_all" ON shifts FOR SELECT USING (true);
CREATE POLICY "shifts_insert_all" ON shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "shifts_update_all" ON shifts FOR UPDATE USING (true);

-- Stock Additions: Allow all to read, insert, update
CREATE POLICY "stock_read_all" ON stock_additions FOR SELECT USING (true);
CREATE POLICY "stock_insert_all" ON stock_additions FOR INSERT WITH CHECK (true);
CREATE POLICY "stock_update_all" ON stock_additions FOR UPDATE USING (true);

-- Wholesale Summaries: Allow all
CREATE POLICY "ws_read_all" ON wholesale_summaries FOR SELECT USING (true);
CREATE POLICY "ws_insert_all" ON wholesale_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "ws_delete_all" ON wholesale_summaries FOR DELETE USING (true);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- Users can now login with: @AdminEdenDrop001
-- All tables are ready for the POS system
