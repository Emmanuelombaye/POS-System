-- ============================================================================
-- EDEN TOP POS - SCRIPT 2: SETUP FRESH DATABASE
-- ============================================================================
-- Run this SECOND (after SCRIPT_01_RESET_SUPABASE.sql) to create everything
-- Copy and paste the ENTIRE content into Supabase SQL Editor and click RUN
-- ============================================================================

-- ============================================================================
-- 1. CREATE USERS TABLE
-- ============================================================================
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CREATE PRODUCTS TABLE
-- ============================================================================
CREATE TABLE public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beef', 'goat', 'offal', 'processed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CREATE TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_kg DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'm-pesa', 'card')),
  branch_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CREATE AUDIT_LOG TABLE
-- ============================================================================
CREATE TABLE public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. INSERT USERS (5 test users)
-- ============================================================================
INSERT INTO public.users (id, name, role) VALUES
  ('a1', 'Admin Eden', 'admin'),
  ('m1', 'Manager John', 'manager'),
  ('c1', 'Cashier David', 'cashier'),
  ('c2', 'Cashier Mary', 'cashier'),
  ('c3', 'Cashier Peter', 'cashier');

-- ============================================================================
-- 6. INSERT PRODUCTS (12 meat products)
-- ============================================================================
INSERT INTO public.products (code, name, category) VALUES
  ('BP001', 'Beef Prime Cuts', 'beef'),
  ('BK002', 'Beef Ribs', 'beef'),
  ('BS003', 'Beef Steak', 'beef'),
  ('GM001', 'Goat Meat Mixed', 'goat'),
  ('GS002', 'Goat Stew Meat', 'goat'),
  ('GC003', 'Goat Chops', 'goat'),
  ('BL001', 'Beef Liver', 'offal'),
  ('BKD002', 'Beef Kidney', 'offal'),
  ('BT003', 'Beef Tongue', 'offal'),
  ('MB001', 'Minced Beef', 'processed'),
  ('BAS002', 'Beef Sausage', 'processed'),
  ('GB003', 'Ground Beef', 'processed');

-- ============================================================================
-- 7. VERIFY DATA WAS INSERTED
-- ============================================================================
SELECT 'USERS' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'PRODUCTS', COUNT(*) FROM public.products;

SELECT '--- USERS ---' as info;
SELECT id, name, role FROM public.users ORDER BY id;

SELECT '--- PRODUCTS ---' as info;
SELECT code, name, category FROM public.products ORDER BY category, name;

-- ============================================================================
-- SETUP COMPLETE ✅
-- ============================================================================
-- Login Credentials:
-- User ID: a1  | Password: @AdminEdenTop | Role: Admin
-- User ID: m1  | Password: @AdminEdenTop | Role: Manager
-- User ID: c1  | Password: @AdminEdenTop | Role: Cashier
-- User ID: c2  | Password: @AdminEdenTop | Role: Cashier
-- User ID: c3  | Password: @AdminEdenTop | Role: Cashier
--
-- Products: 12 items across 4 categories (Beef, Goat, Offal, Processed)
-- ============================================================================
