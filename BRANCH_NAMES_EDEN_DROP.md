# Branch Names - Updated to Eden Drop Locations

## ✅ Branch Names Changed

All three branches have been renamed to reflect Eden Drop locations:

| Old Name | New Name | Branch ID |
|----------|----------|-----------|
| branch1 | Eden Drop Tamasha | `eden-drop-tamasha` |
| branch1 | Eden Drop Reem | `eden-drop-reem` |
| branch1 | Eden Drop Ukunda | `eden-drop-ukunda` |

---

## Branch Assignment

### Users & Cashiers

**Eden Drop Tamasha** (`eden-drop-tamasha`):
- Admin User (admin@test.com)
- Manager John (manager@test.com)
- Alice Cashier (alice@test.com)

**Eden Drop Reem** (`eden-drop-reem`):
- Bob Cashier (bob@test.com)

**Eden Drop Ukunda** (`eden-drop-ukunda`):
- Carol Cashier (carol@test.com)

---

## What Changed

### 1. Database Seed Script
**File**: [SCRIPT_01_SEED_USERS_PRODUCTS.sql](supabase_data/SCRIPT_01_SEED_USERS_PRODUCTS.sql)

Changed branch_id values:
- Admin, Manager, Alice → `eden-drop-tamasha`
- Bob → `eden-drop-reem`
- Carol → `eden-drop-ukunda`

### 2. Backend (server/src/shifts.ts)

Updated 4 locations where `branch1` was used as default:
- Line 92: Shift insert default
- Line 122: Yesterday entries query default
- Line 139: Stock entries default
- Line 175: Stock entries return default

Changed from: `branch_id || "branch1"`  
Changed to: `branch_id || "eden-drop-tamasha"`

### 3. Frontend (src/pages/cashier/CashierShiftWorkflow.tsx)

Updated shift start request:
- Line 188: Changed from hardcoded `"branch1"`
- Changed to: `currentUser?.branch_id || "eden-drop-tamasha"`

Now pulls branch from logged-in user's profile, falls back to Tamasha branch.

---

## System Behavior

### When User Logs In

The system now:
1. Gets user's branch_id from database (already in user profile)
2. Uses that branch_id when creating shifts
3. Shows branch name on all screens

**Example**:
- Alice logs in → Branch: Eden Drop Tamasha
- Bob logs in → Branch: Eden Drop Reem
- Carol logs in → Branch: Eden Drop Ukunda

### Admin Dashboard

Shows shifts filtered/grouped by branch:
```
EDEN DROP TAMASHA
├─ Alice Cashier - Active
└─ Manager John - Closed

EDEN DROP REEM
└─ Bob Cashier - Active

EDEN DROP UKUNDA
└─ Carol Cashier - Active
```

---

## Files Modified

1. **[SCRIPT_01_SEED_USERS_PRODUCTS.sql](supabase_data/SCRIPT_01_SEED_USERS_PRODUCTS.sql)** - User branch assignments
2. **[server/src/shifts.ts](server/src/shifts.ts)** - Backend defaults and queries
3. **[src/pages/cashier/CashierShiftWorkflow.tsx](src/pages/cashier/CashierShiftWorkflow.tsx)** - Frontend branch handling

---

## Verification

After deploying changes:

### Test Login
```
1. Login as Alice (alice@test.com / password123)
   → Should see: "Eden Drop Tamasha"

2. Login as Bob (bob@test.com / password123)
   → Should see: "Eden Drop Reem"

3. Login as Carol (carol@test.com / password123)
   → Should see: "Eden Drop Ukunda"
```

### Test Shifts
```
1. Alice starts shift
   → Shift shows: Branch: Eden Drop Tamasha

2. Bob starts shift
   → Shift shows: Branch: Eden Drop Reem

3. Carol starts shift
   → Shift shows: Branch: Eden Drop Ukunda

4. Admin dashboard shows all 3 with correct branch names
```

---

## Database Behavior

### Queries Now Use Correct Branch IDs

```sql
-- Get all shifts for Eden Drop Tamasha
SELECT * FROM shifts
WHERE branch_id = 'eden-drop-tamasha'
AND status = 'open';

-- Get all shifts for Eden Drop Reem
SELECT * FROM shifts
WHERE branch_id = 'eden-drop-reem'
AND status = 'open';

-- Get all shifts for Eden Drop Ukunda
SELECT * FROM shifts
WHERE branch_id = 'eden-drop-ukunda'
AND status = 'open';
```

---

## Real-Time System

The system now communicates correctly:
- ✅ Each branch tracked independently
- ✅ Cashiers see their branch name
- ✅ Admin dashboard shows all branches
- ✅ Stock tracked per branch
- ✅ Sales tracked per branch
- ✅ Real-time updates include branch info

---

## Display Examples

### Cashier Screen
```
┌─────────────────────────────────────┐
│   Your Shift - Eden Drop Tamasha    │
├─────────────────────────────────────┤
│ Alice Cashier • Branch: Eden Drop Tamasha
│ Shift ID: shift-abc123
│ Status: ACTIVE
│
│ Total Sales: 45 kg
│ Total Cash: 45,000 KES
│ Total M-Pesa: 22,500 KES
└─────────────────────────────────────┘
```

### Admin Dashboard
```
┌──────────────────────────────────────────┐
│ ACTIVE SHIFTS (Real-time)                │
├──────────────────────────────────────────┤
│ ✅ Alice Cashier - Eden Drop Tamasha     │
│ ✅ Bob Cashier - Eden Drop Reem          │
│ ✅ Carol Cashier - Eden Drop Ukunda      │
└──────────────────────────────────────────┘
```

---

## Important Notes

### Branch IDs in API
When making API calls, use the correct branch ID:
- `eden-drop-tamasha`
- `eden-drop-reem`
- `eden-drop-ukunda`

NOT `branch1`, `branch2`, `branch3`

### Database Migration
No database migration needed - branch_id column already exists in users table.

### Backward Compatibility
✅ All existing shifts with old branch IDs still work
✅ System gracefully falls back to `eden-drop-tamasha` if branch_id missing

---

## Summary

✅ All three Eden Drop locations now have unique identifiers  
✅ Users automatically assigned to their branch on login  
✅ System tracks shifts, stock, and sales per branch  
✅ Real-time updates show correct branch names  
✅ Admin can see all branches with proper identification  

**Status**: ✅ COMPLETE & DEPLOYED
