-- Insert users for Eden Top POS
-- All users use the password: @AdminEdenTop

INSERT INTO users (id, name, role, created_at, updated_at) VALUES
('a1', 'Owner (Admin)', 'admin', NOW(), NOW()),
('m1', 'James (Manager)', 'manager', NOW(), NOW()),
('c1', 'Amina (Cashier 1)', 'cashier', NOW(), NOW()),
('c2', 'Peter (Cashier 2)', 'cashier', NOW(), NOW()),
('c3', 'Grace (Cashier 3)', 'cashier', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();
