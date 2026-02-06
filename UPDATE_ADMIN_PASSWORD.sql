-- 🔐 EDEN DROP 001 POS - UPDATE ADMIN PASSWORD TO @AdminEdenDrop001
-- Run this in Supabase SQL Editor to update the admin user password

-- Hash: bcryptjs.hashSync('@AdminEdenDrop001', 10)
-- This is the bcrypt hash of @AdminEdenDrop001
UPDATE users 
SET 
  password_hash = '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxXX'
WHERE id = 'a1' AND role = 'admin';

-- Note: Replace the hash above with the actual bcrypt hash
-- You can generate it using: node -e "console.log(require('bcryptjs').hashSync('@AdminEdenDrop001', 10))"
-- Then replace 'a1' with actual admin user ID

-- Verify the update
SELECT id, name, role, password_hash FROM users WHERE role = 'admin' LIMIT 1;
