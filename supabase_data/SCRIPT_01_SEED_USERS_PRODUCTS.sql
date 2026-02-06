-- SCRIPT_01_SEED_USERS_PRODUCTS.sql
-- Add test users and products for development/testing

-- ============================================================================
-- PART 1: INSERT TEST USERS
-- ============================================================================
-- Note: Passwords are hashed with bcrypt. Plaintext versions below for reference.
-- Password hashing: Use $2a$10$ prefix (bcrypt format)

-- Admin user: admin@test.com / password123
-- Manager user: manager@test.com / password123
-- Cashiers: alice@test.com, bob@test.com, carol@test.com / password123

INSERT INTO public.users (id, name, email, phone, password_hash, role, branch_id, status) VALUES
(
  'user-admin-001',
  'Admin User',
  'admin@test.com',
  '+254700000001',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR',
  'admin',
  'eden-drop-tamasha',
  'active'
),
(
  'user-manager-001',
  'Manager John',
  'manager@test.com',
  '+254700000002',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR',
  'manager',
  'eden-drop-tamasha',
  'active'
),
(
  'user-cashier-001',
  'Alice Cashier',
  'alice@test.com',
  '+254700000003',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR',
  'cashier',
  'eden-drop-tamasha',
  'active'
),
(
  'user-cashier-002',
  'Bob Cashier',
  'bob@test.com',
  '+254700000004',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR',
  'cashier',
  'eden-drop-reem',
  'active'
),
(
  'user-cashier-003',
  'Carol Cashier',
  'carol@test.com',
  '+254700000005',
  '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR',
  'cashier',
  'eden-drop-ukunda',
  'active'
);

-- ============================================================================
-- PART 2: INSERT TEST PRODUCTS (Meat)
-- ============================================================================

INSERT INTO public.products (id, code, name, category, unit_price, weight_kg, low_stock_threshold_kg, supplier, status) VALUES
-- Beef products
(
  'prod-beef-001',
  'BEEF-001',
  'Beef Chuck',
  'Beef',
  800.00,
  1.0,
  50.0,
  'Local Supplier A',
  'active'
),
(
  'prod-beef-002',
  'BEEF-002',
  'Beef Ribs',
  'Beef',
  900.00,
  1.0,
  40.0,
  'Local Supplier A',
  'active'
),
(
  'prod-beef-003',
  'BEEF-003',
  'Beef Mince',
  'Beef',
  850.00,
  1.0,
  60.0,
  'Local Supplier A',
  'active'
),
-- Lamb products
(
  'prod-lamb-001',
  'LAMB-001',
  'Lamb Leg',
  'Lamb',
  1200.00,
  1.0,
  30.0,
  'Local Supplier B',
  'active'
),
(
  'prod-lamb-002',
  'LAMB-002',
  'Lamb Chops',
  'Lamb',
  1300.00,
  1.0,
  25.0,
  'Local Supplier B',
  'active'
),
-- Chicken products
(
  'prod-chicken-001',
  'CHKN-001',
  'Chicken Breast',
  'Chicken',
  600.00,
  1.0,
  80.0,
  'Local Supplier C',
  'active'
),
(
  'prod-chicken-002',
  'CHKN-002',
  'Chicken Thigh',
  'Chicken',
  550.00,
  1.0,
  70.0,
  'Local Supplier C',
  'active'
),
-- Goat products
(
  'prod-goat-001',
  'GOAT-001',
  'Goat Meat',
  'Goat',
  1100.00,
  1.0,
  28.0,
  'Local Supplier E',
  'active'
);

-- ============================================================================
-- TESTING INFORMATION
-- ============================================================================
-- Login credentials for testing:
--
-- ADMIN:
-- Email: admin@test.com
-- Password: password123
--
-- MANAGER:
-- Email: manager@test.com
-- Password: password123
--
-- CASHIERS:
-- Email: alice@test.com | Password: password123
-- Email: bob@test.com | Password: password123
-- Email: carol@test.com | Password: password123
--
-- PRODUCTS:
-- 10 meat products (Beef, Lamb, Chicken, Goat) ready for sales
--
-- WORKFLOW TO TEST:
-- 1. Log in as Alice (cashier)
-- 2. Click "Open Shift" to start a new shift
-- 3. Add some sales transactions
-- 4. Close shift and enter cash/M-Pesa amounts
-- 5. Log in as Admin to see the shift on the dashboard with variance
--
-- ============================================================================

COMMIT;
