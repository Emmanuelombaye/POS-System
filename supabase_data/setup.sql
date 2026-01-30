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

-- Create indexes for wholesale_summaries
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_branch ON wholesale_summaries(branch);
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_date ON wholesale_summaries(date);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE wholesale_summaries;
