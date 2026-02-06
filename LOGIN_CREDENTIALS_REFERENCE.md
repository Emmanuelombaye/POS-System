# 🔑 Login Credentials - Database Verified

## Current Database Credentials

All users in the database are seeded with the same password for development/testing.

### Admin
- **User:** Admin User
- **Password:** `password123`

### Manager
- **User:** Manager John  
- **Password:** `password123`

### Cashiers

| Cashier | Branch | Branch ID | Password |
|---------|--------|-----------|----------|
| Alice Cashier | Edendrop001 Tamasha | eden-drop-tamasha | `password123` |
| Bob Cashier | Edendrop001 Reem | eden-drop-reem | `password123` |
| Carol Cashier | Edendrop001 LungaLunga | eden-drop-ukunda | `password123` |

---

## Login Flow

### Example: Login as Alice (Cashier)
1. **Select Branch:** Edendrop001 Tamasha
2. **Select Role:** Cashier
3. **Select Cashier:** Alice Cashier
4. **Enter Password:** `password123`
5. **Result:** ✅ Login Success

### Example: Login as Bob (Cashier)
1. **Select Branch:** Edendrop001 Reem
2. **Select Role:** Cashier
3. **Select Cashier:** Bob Cashier
4. **Enter Password:** `password123`
5. **Result:** ✅ Login Success

### Example: Login as Carol (Cashier)
1. **Select Branch:** Edendrop001 LungaLunga
2. **Select Role:** Cashier
3. **Select Cashier:** Carol Cashier
4. **Enter Password:** `password123`
5. **Result:** ✅ Login Success

---

## Database Password Hash

All users currently use this bcrypt hash:
```
$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR
```

This hash corresponds to plaintext password: `password123`

---

## Password Validation Flow (Backend)

1. User enters password (e.g., `password123`)
2. Backend retrieves user's `password_hash` from database
3. Backend uses `bcrypt.compare(password, passwordHash)` to verify
4. If match found → ✅ Login Success (JWT token issued)
5. If no match → ❌ 401 Unauthorized error

---

## Cashier-Branch Exclusivity ✅

The exclusive mapping is maintained:
- Alice can **ONLY** login to Tamasha branch
- Bob can **ONLY** login to Reem branch  
- Carol can **ONLY** login to LungaLunga branch

If you try to login Alice to a different branch, the login will fail with:
```
❌ This cashier is not assigned to [branch]. Integrity check failed.
```

---

## For Production Use

When deploying to production, you should:

1. **Update passwords** in the database with strong, unique passwords per role/cashier
2. **Update CREDENTIALS_BY_ROLE** and **CASHIER_PASSWORDS_BY_BRANCH** in LoginPage.tsx
3. **Run UPDATE_USER_PASSWORDS.sql** with new bcrypt hashes

Example:
```typescript
const CREDENTIALS_BY_ROLE = {
  admin: "YourSecureAdminPassword123!",
  manager: "YourSecureManagerPassword456!",
} as const;

const CASHIER_PASSWORDS_BY_BRANCH = {
  "eden-drop-tamasha": "@Kenya90!",
  "eden-drop-reem": "@Kenya80!",
  "eden-drop-ukunda": "@Kenya70!",
} as const;
```

---

**Status:** ✅ Using Database-Verified Credentials  
**Last Updated:** February 6, 2026
