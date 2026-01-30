-- Fallback Data Insertion Script
-- Use this if CSV import is not working for you.

-- 1. Insert initial users
INSERT INTO users (id, name, role, created_at, updated_at) VALUES
('c1', 'Amina (Cashier 1)', 'cashier', NOW(), NOW()),
('c2', 'Peter (Cashier 2)', 'cashier', NOW(), NOW()),
('c3', 'Grace (Cashier 3)', 'cashier', NOW(), NOW()),
('m1', 'James (Manager)', 'manager', NOW(), NOW()),
('a1', 'Owner (Admin)', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert initial products
INSERT INTO products (id, name, code, category, price_per_kg, stock_kg, low_stock_threshold_kg, is_active, created_at, updated_at) VALUES
('beef-regular', 'Beef - Prime Cuts', 'BF-PRIME', 'beef', 780, 85, 15, true, NOW(), NOW()),
('goat-regular', 'Goat - Mixed', 'GT-MIX', 'goat', 720, 60, 10, true, NOW(), NOW()),
('liver-beef', 'Beef Liver', 'BF-LIVER', 'offal', 550, 25, 5, true, NOW(), NOW()),
('minced-beef', 'Minced Beef', 'BF-MINCED', 'processed', 800, 35, 7, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
