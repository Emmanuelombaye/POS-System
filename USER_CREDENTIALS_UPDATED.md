# 🔐 USER CREDENTIALS - UPDATED (Individual Passwords Per Role)

## NEW Password System

After fixing the universal `@AdminEdenDrop001` fallback, each role now has unique passwords:

### Admin Users
- **User ID:** user-admin-001
- **Name:** Admin User  
- **Role:** admin
- **Password:** `@Admin0001Secret`
- **Hash:** `$2a$10$oTidXdo6ROGbcwbkY.nCfuEF4eN4O8ZO2bbIBKHevnN5YpAtcFYuG`

### Manager Users
- **User ID:** user-manager-001
- **Name:** Manager User
- **Role:** manager
- **Password:** `@Manager0001Secret`
- **Hash:** `$2a$10$n1926LApMe6gz0A6Whs7zOrZRUV7KCgYg/t.lpBVk44bjeUu84lVy`

### Cashier Users
- **User IDs:** user-cashier-001, user-cashier-002, user-cashier-003, etc.
- **Names:** Various (Carol Cashier, Bob Cashier, etc.)
- **Role:** cashier
- **Password:** `@Cashier0001Secret`
- **Hash:** `$2a$10$dnc3Rt.NLLzUGnBdSwNKd.jZldtrMQDLNIEO4CjtX0QdvJKbuBvEK`

---

## What Changed

### Before
- **PROBLEM:** All users could login with `@AdminEdenDrop001`
- **Root Cause:** Backend had universal SYSTEM_PASSWORD fallback

```typescript
// OLD - INSECURE
const SYSTEM_PASSWORD = "@AdminEdenDrop001";
if (password === SYSTEM_PASSWORD) {
  passwordValid = true;  // ⚠️ Accepts password for ANY user!
}
```

### After  
- **SOLUTION:** Removed universal fallback, enforce individual user passwords
- **Security:** Each user must have their own bcrypt hash

```typescript
// NEW - SECURE
// No SYSTEM_PASSWORD variable
if (passwordHash) {
  passwordValid = await bcrypt.compare(password, passwordHash);
}
```

---

## File Changed

**File:** `server/src/index.ts`

**Changes:**
1. Removed line: `const SYSTEM_PASSWORD = "@AdminEdenDrop001";`
2. Updated password verification logic (lines ~220-235):
   - Removed: `if (password === SYSTEM_PASSWORD) { passwordValid = true; }`
   - Now: Only checks bcrypt hash + legacy plaintext password

---

## Testing Credentials

### To Login Now
```
Admin:   user-admin-001 / @Admin0001Secret
Manager: user-manager-001 / @Manager0001Secret
Cashier: user-cashier-001 / @Cashier0001Secret
         user-cashier-002 / @Cashier0001Secret
         user-cashier-003 / @Cashier0001Secret
```

---

## Update Required: Apply to Database

The password hashes need to be stored in Supabase. Run the SQL in `UPDATE_USER_PASSWORDS.sql`:

```sql
-- Admin
UPDATE users SET password_hash = '$2a$10$oTidXdo6ROGbcwbkY.nCfuEF4eN4O8ZO2bbIBKHevnN5YpAtcFYuG' WHERE role = 'admin';

-- Manager
UPDATE users SET password_hash = '$2a$10$n1926LApMe6gz0A6Whs7zOrZRUV7KCgYg/t.lpBVk44bjeUu84lVy' WHERE role = 'manager';

-- Cashier
UPDATE users SET password_hash = '$2a$10$dnc3Rt.NLLzUGnBdSwNKd.jZldtrMQDLNIEO4CjtX0QdvJKbuBvEK' WHERE role = 'cashier';
```

---

## ✅ Status

- ✅ Backend code fixed (removed SYSTEM_PASSWORD fallback)
- ⏳ **PENDING:** Apply password updates to Supabase database
- ⏳ **PENDING:** Test login with new credentials

---

## Next Steps

1. Log into Supabase console
2. Run the SQL updates above
3. Restart backend server
4. Test login with new credentials
5. Verify each role can only login with their own password
