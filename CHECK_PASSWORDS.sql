-- Check what password hashes are currently in the database
SELECT 
  id,
  name, 
  role, 
  branch_id,
  SUBSTRING(password_hash, 1, 30) as hash_start,
  LENGTH(password_hash) as hash_length,
  password_hash as full_hash
FROM users 
ORDER BY role, name;
