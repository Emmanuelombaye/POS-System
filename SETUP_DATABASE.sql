-- ============================================================================
-- EDEN TOP POS - Database Initialization Script
-- ============================================================================
-- This script sets up all tables and populates with initial data
-- Copy and paste the entire content into Supabase SQL Editor and run it

-- ============================================================================
-- 1. CREATE USERS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CLEAR EXISTING DATA (delete all previous records and start fresh)
-- ============================================================================
DELETE FROM public.audit_log;
DELETE FROM public.transactions;
DELETE FROM public.products;
DELETE FROM public.users;

-- ============================================================================
-- 3. INSERT SAMPLE USERS
-- ============================================================================
-- Password for all users: @AdminEdenTop
-- User: a1 (Admin)
INSERT INTO public.users (id, name, role) 
VALUES ('a1', 'Admin Eden', 'admin');

-- User: m1 (Manager)
INSERT INTO public.users (id, name, role) 
VALUES ('m1', 'Manager John', 'manager');

-- User: c1 (Cashier - Branch 1)
INSERT INTO public.users (id, name, role) 
VALUES ('c1', 'Cashier David', 'cashier');

-- User: c2 (Cashier - Branch 2)
INSERT INTO public.users (id, name, role) 
VALUES ('c2', 'Cashier Mary', 'cashier');

-- User: c3 (Cashier - Branch 3)
INSERT INTO public.users (id, name, role) 
VALUES ('c3', 'Cashier Peter', 'cashier');

-- ============================================================================
-- 4. CREATE PRODUCTS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beef', 'goat', 'offal', 'processed')),
  price DECIMAL(10, 2) NOT NULL,
  stock_kg DECIMAL(10, 2) DEFAULT 0,
  branch_id TEXT DEFAULT 'branch1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. INSERT SAMPLE PRODUCTS
-- ============================================================================
DELETE FROM public.products;

INSERT INTO public.products (id, name, category) VALUES
  (gen_random_uuid()::text, 'Beef Prime Cuts', 'beef'),
  (gen_random_uuid()::text, 'Goat Meat Mixed', 'goat'),
  (gen_random_uuid()::text, 'Beef Liver', 'offal'),
  (gen_random_uuid()::text, 'Minced Beef', 'processed'),
  (gen_random_uuid()::text, 'Beef Ribs', 'beef'),
  (gen_random_uuid()::text, 'Goat Stew Meat', 'goat'),
  (gen_random_uuid()::text, 'Beef Kidney', 'offal'),
  (gen_random_uuid()::text, 'Beef Sausage', 'processed'),
  (gen_random_uuid()::text, 'Beef Steak', 'beef'),
  (gen_random_uuid()::text, 'Goat Chops', 'goat'),
  (gen_random_uuid()::text, 'Beef Tongue', 'offal'),
  (gen_random_uuid()::text, 'Ground Beef', 'processed');

-- ============================================================================
-- 6. CREATE TRANSACTIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id),
  product_id TEXT REFERENCES public.products(id),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'm-pesa', 'card')),
  branch_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. CREATE AUDIT_LOG TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id),
  action TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. VERIFY DATA WAS INSERTED
-- ============================================================================
-- This will show you the users that were just created
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products;

-- Display all users
SELECT id, name, role FROM public.users ORDER BY id;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Login Credentials:
-- User ID: a1  | Password: @AdminEdenTop | Role: Admin
-- User ID: m1  | Password: @AdminEdenTop | Role: Manager
-- User ID: c1  | Password: @AdminEdenTop | Role: Cashier
-- User ID: c2  | Password: @AdminEdenTop | Role: Cashier
-- User ID: c3  | Password: @AdminEdenTop | Role: Cashier
-- ============================================================================
