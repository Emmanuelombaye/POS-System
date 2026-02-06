-- 🔐 Update User Passwords - Unique per Role and Branch
-- This script updates each user with their own unique password
-- Generated: February 6, 2026

-- ADMIN PASSWORD
-- Password: @Admin001Eden
UPDATE users 
SET password_hash = '$2a$10$pbMOVm8uJlwPjQkprAoAA.GKjqXrM9J0B1m7NmPeLRHFfn.QOOxXK'
WHERE role = 'admin';

-- MANAGER PASSWORD
-- Password: @Manager001Eden
UPDATE users 
SET password_hash = '$2a$10$zMURfc3zGw6QXlsAevelMOeHk6DzqWq4Q3GbSabax4sg8.cyGqOt6'
WHERE role = 'manager';

-- CASHIER PASSWORDS BY BRANCH
-- Branch: branch1 (Tamasha): @Kenya90!
-- For: Alice Cashier
UPDATE users 
SET password_hash = '$2a$10$T6SEGFVPZAz2jnNpHY8aNevbLhchwf8Dc4.Kfa6MGnEOJEqxSZyDa'
WHERE role = 'cashier' AND branch_id = 'branch1';

-- Branch: branch2 (Reem): @Kenya80!
-- For: Bob Cashier
UPDATE users 
SET password_hash = '$2a$10$iwi3/Q86HOzamF3iFEtz6.ygI/zAhrkFW74hevSXk8QI7WxbK0.hy'
WHERE role = 'cashier' AND branch_id = 'branch2';

-- Branch: branch3 (LungaLunga): @Kenya70!
-- For: Carol Cashier
UPDATE users 
SET password_hash = '$2a$10$yKOW9vFig.Fecqg9jLzHxey2A/Luw.fdstOVqJFyni/anuTjzXG8i'
WHERE role = 'cashier' AND branch_id = 'branch3';

-- Verify the updates
SELECT id, name, role, 
  CASE 
    WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✓ Hash set'
    ELSE '✗ No hash'
  END as password_status
FROM users 
ORDER BY role, name;
