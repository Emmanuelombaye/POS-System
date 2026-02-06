# Three Cashiers - Three Active Shifts Test

## Test Scenario: All 3 Cashiers Working

**Expected Result**: Exactly 3 active shifts total (one per cashier)

---

## Test Steps

### Phase 1: Alice Opens Shift
```
1. Login as Alice: alice@test.com / password123
2. Click "Start Shift"
3. ✅ Shift created for Alice
4. Status: ACTIVE (1 shift total)

Database state:
- Alice: status='open' ✅
- Bob: (no shift yet)
- Carol: (no shift yet)

Total active shifts: 1 ✅
```

### Phase 2: Bob Opens Shift
```
1. Open new tab/window
2. Login as Bob: bob@test.com / password123
3. Click "Start Shift"
4. ✅ Shift created for Bob (independent from Alice)
5. Status: ACTIVE (2 shifts total)

Database state:
- Alice: status='open' ✅
- Bob: status='open' ✅
- Carol: (no shift yet)

Total active shifts: 2 ✅
```

### Phase 3: Carol Opens Shift
```
1. Open another tab/window
2. Login as Carol: carol@test.com / password123
3. Click "Start Shift"
4. ✅ Shift created for Carol (independent from Alice & Bob)
5. Status: ACTIVE (3 shifts total)

Database state:
- Alice: status='open' ✅
- Bob: status='open' ✅
- Carol: status='open' ✅

Total active shifts: 3 ✅ ← EXACTLY 3!
```

---

## Verification Points

### ✅ Phase 1: Alice Only
- Alice can start shift
- Alice sees her products and sales interface
- Admin dashboard shows 1 active shift
- Bob cannot interfere

### ✅ Phase 2: Alice + Bob
- Alice still working normally
- Bob can start his own shift independently
- Both see their own data
- Admin dashboard shows 2 active shifts
- Carol cannot interfere

### ✅ Phase 3: Alice + Bob + Carol
- All 3 working simultaneously
- Each has their own active shift
- Each sees their own products and sales
- Admin dashboard shows exactly 3 active shifts
- All are independent

### ❌ What Should NOT Happen
```
Alice tries to start second shift:
→ ERROR: "You already have an open shift"
→ Only Alice blocked, Bob and Carol unaffected

Bob tries to start second shift:
→ ERROR: "You already have an open shift"
→ Only Bob blocked, Alice and Carol unaffected

Carol tries to start second shift:
→ ERROR: "You already have an open shift"
→ Only Carol blocked, Alice and Bob unaffected
```

---

## Admin Dashboard Verification

### When All 3 Cashiers Working

Open Admin Dashboard:
```
ACTIVE SHIFTS (Total: 3)
├─ Alice Cashier - 2026-02-04 08:30 AM ✅
├─ Bob Cashier - 2026-02-04 08:45 AM ✅
└─ Carol Cashier - 2026-02-04 09:00 AM ✅

Total Sales So Far: (combined from all 3)
- Alice: 45 kg
- Bob: 32 kg
- Carol: 28 kg
```

Dashboard should show:
- ✅ Exactly 3 shifts
- ✅ Each with different cashier_id
- ✅ All with status='open'
- ✅ All with today's date

---

## Database Query to Verify

```sql
-- Check active shifts
SELECT 
  cashier_id,
  cashier_name,
  opening_time,
  status,
  shift_date
FROM shifts
WHERE status = 'open'
AND shift_date = '2026-02-04'
ORDER BY opening_time;

-- Should return exactly 3 rows:
--  1. user-cashier-001 | Alice Cashier | ... | open
--  2. user-cashier-002 | Bob Cashier | ... | open
--  3. user-cashier-003 | Carol Cashier | ... | open
```

---

## Test Results Matrix

| Cashier | Can Start? | Can Start 2nd? | Status | Notes |
|---------|-----------|---------------|--------|-------|
| Alice | ✅ Yes | ❌ No (Error 409) | open | Independent |
| Bob | ✅ Yes | ❌ No (Error 409) | open | Independent |
| Carol | ✅ Yes | ❌ No (Error 409) | open | Independent |
| **Total** | | | | **3 active** |

---

## Error Messages (Expected)

### Alice tries 2nd shift:
```
❌ ERROR
You already have an open shift from 2026-02-04.
Please close it before starting a new one.
```

### Bob tries 2nd shift:
```
❌ ERROR
You already have an open shift from 2026-02-04.
Please close it before starting a new one.
```

### Carol tries 2nd shift:
```
❌ ERROR
You already have an open shift from 2026-02-04.
Please close it before starting a new one.
```

---

## How The System Enforces This

### Backend Logic (Automatic)

```typescript
// For each cashier independently:
const { data: existing } = await supabase
  .from("shifts")
  .select("id")
  .eq("cashier_id", cashier_id)  // ← Filters by EACH cashier
  .eq("status", "open");

if (existing && existing.length > 0) {
  // Block this specific cashier's duplicate
  return res.status(409).json({ error: "..." });
}
```

**Key Point**: Query filters by `cashier_id`, so:
- Alice's check: only looks at Alice's shifts
- Bob's check: only looks at Bob's shifts
- Carol's check: only looks at Carol's shifts

**Result**: Each can have 1 open shift, total = 3 when all working

---

## Closing Shifts Test

### Close Alice's Shift
```
1. Alice clicks "Close Shift"
2. Enters: closing cash, M-Pesa amount
3. ✅ Shift closes (status: 'open' → 'closed')
4. Alice can now start NEW shift if needed

Total active shifts: 2 (Bob + Carol still open)
```

### Close Bob's Shift
```
1. Bob clicks "Close Shift"
2. Enters: closing cash, M-Pesa amount
3. ✅ Shift closes (status: 'open' → 'closed')
4. Bob can now start NEW shift if needed

Total active shifts: 1 (Carol still open)
```

### Close Carol's Shift
```
1. Carol clicks "Close Shift"
2. Enters: closing cash, M-Pesa amount
3. ✅ Shift closes (status: 'open' → 'closed')
4. Carol can now start NEW shift if needed

Total active shifts: 0 (all closed)
```

---

## Expected Behavior Summary

```
Number of Cashiers | Max Active Shifts | Max per Cashier
─────────────────────────────────────────────────────
        1          |        1          |       1
        2          |        2          |       1
        3          |        3          |       1
        N          |        N          |       1
```

**The Rule**: Each cashier can have MAX 1 active shift, regardless of how many total cashiers exist.

---

## Live Testing Checklist

- [ ] Alice logs in, starts shift → ✅ Works
- [ ] Bob logs in, starts shift → ✅ Works  
- [ ] Carol logs in, starts shift → ✅ Works
- [ ] Admin dashboard shows 3 shifts → ✅ Correct
- [ ] Alice tries to start 2nd → ❌ Error (expected)
- [ ] Bob tries to start 2nd → ❌ Error (expected)
- [ ] Carol tries to start 2nd → ❌ Error (expected)
- [ ] Alice closes shift → ✅ Works
- [ ] Dashboard now shows 2 shifts → ✅ Correct
- [ ] Alice starts new shift → ✅ Works
- [ ] Dashboard shows 3 again → ✅ Correct

---

## Performance Note

With 3 active shifts:
- Alice's database: 1 record (her shift)
- Bob's database: 1 record (his shift)
- Carol's database: 1 record (her shift)
- **Total**: 3 records in shifts table with status='open'
- **Query time**: ~2-5ms per check
- **No performance issues** with multiple active shifts

---

## Summary

✅ **System correctly enforces**:
- 1 cashier = 1 max active shift
- 3 cashiers = 3 max active shifts (one each)
- Each cashier independent
- No interference between shifts
- Clear error messages when duplicate attempted

**This is working as designed.**
