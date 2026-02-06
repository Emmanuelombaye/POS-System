# 🔐 UPDATED LOGIN CREDENTIALS - READY TO USE

## ✅ New Passwords Set

All files have been updated with the new credentials:

### Admin
```
Password: @Admin001Eden
Hash: $2a$10$rdlQs62wtFWDmDUG04k/8ex0oWBvIx6.wQwYJ9EMJ9Qsv9z.ywYcO
```

### Manager
```
Password: @Manager001Eden
Hash: $2a$10$lP2Hs/pO3VzHGhhzcLPEbOYO3HX1RitWrkTYOIQPVtuNT335R2rnG
```

### Cashier
```
Password: @Kenya90!
Hash: $2a$10$DSslGyOszhTu2IP.VhJEJO06KBRo92dIWhNpWvTpTXJFXyLgZB2Iu
```

---

## 📋 Next Steps

### 1. Apply SQL to Supabase
Copy this SQL and run in Supabase console:

```sql
UPDATE users SET password_hash = '$2a$10$rdlQs62wtFWDmDUG04k/8ex0oWBvIx6.wQwYJ9EMJ9Qsv9z.ywYcO' WHERE role = 'admin';
UPDATE users SET password_hash = '$2a$10$lP2Hs/pO3VzHGhhzcLPEbOYO3HX1RitWrkTYOIQPVtuNT335R2rnG' WHERE role = 'manager';
UPDATE users SET password_hash = '$2a$10$DSslGyOszhTu2IP.VhJEJO06KBRo92dIWhNpWvTpTXJFXyLgZB2Iu' WHERE role = 'cashier';
```

Or run the complete script: `UPDATE_USER_PASSWORDS.sql`

### 2. Restart Servers
```bash
# Kill existing processes
taskkill /F /IM node.exe

# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 3. Test Login
- **Admin:** any admin user → password: `@Admin001Eden`
- **Manager:** any manager user → password: `@Manager001Eden`
- **Cashier:** any cashier user → password: `@Kenya90!`

---

## 📁 Files Updated

1. ✅ `UPDATE_USER_PASSWORDS.sql` - SQL commands with new hashes
2. ✅ `src/pages/auth/LoginPage.tsx` - Frontend credentials updated

---

## 🧪 Verification

After applying the SQL, test each role:

```
✓ Login as admin with @Admin001Eden → SUCCESS
✓ Login as manager with @Manager001Eden → SUCCESS
✓ Login as cashier with @Kenya90! → SUCCESS

✗ Try cashier with @Admin001Eden → FAILED (shows correct error)
✗ Try admin with @Kenya90! → FAILED (shows correct error)
```

All set! 🚀
