# 🐛 Shift Workflow - Troubleshooting Guide

## Before You Test

Run this SQL script to verify data exists:

```sql
-- Run this in Supabase SQL Editor

-- Check 1: Do we have cashier users?
SELECT id, name, email, role FROM users WHERE role = 'cashier' LIMIT 5;
-- Expected: At least 1 row

-- Check 2: Do we have products?
SELECT id, name, category, unit_price, status FROM products 
WHERE status = 'active' LIMIT 10;
-- Expected: 5+ products

-- Check 3: Check products have required fields
SELECT COUNT(*) as product_count, 
       COUNT(CASE WHEN unit_price > 0 THEN 1 END) as with_price,
       COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as with_name
FROM products WHERE status = 'active';
-- Expected: All counts should be equal and > 0
```

If any query returns 0 rows, run the seed script first:
```bash
# In VS Code terminal, navigate to database folder and run:
cd c:\Users\Antidote\Desktop\ceopos
# Then upload SCRIPT_01_SEED_USERS_PRODUCTS.sql to Supabase SQL Editor and run it
```

---

## Workflow Test Flow

### 🔵 Step 1: Login as Cashier
```
1. Go to login page
2. Email: bob@test.com
3. Password: password123
4. Should see: "Bob Cashier" in top-right
```

**If stuck at login:**
- Check if `users` table has bob@test.com
- Run: `SELECT * FROM users WHERE email = 'bob@test.com';`

---

### 🟢 Step 2: Click "OPEN NEW SHIFT"
```
Screen should show:
┌──────────────────────────────┐
│  SHIFT NOT STARTED           │
│  You need to open your shift │
│  before recording stock...   │
│  [OPEN NEW SHIFT] button     │
└──────────────────────────────┘

Action: Click the button
```

**What happens behind the scenes:**
```
Browser          API                Database
   │              │                    │
   ├─POST /api/shifts/start
   │              ├─Create shift record
   │              ├─Query products (status='active')
   │              ├─Create shift_stock_entries (1 per product)
   │              │
   ├─GET /api/shifts/{id}/details
   │              ├─Fetch shift data
   │              ├─Fetch stock entries with product data
   │              ├─Transform product data
   │              │
   └──────────────└─────────────────────→ Response
                     stock_entries array
```

---

### 🟡 Step 3: Loading Screen (1-2 seconds)
```
Should see:
┌──────────────────────────────┐
│  ⚙️ Loading Shift Data...     │
│  Fetching products...        │
└──────────────────────────────┘

If this stays > 5 seconds → Problem!
See troubleshooting below.
```

---

### 🟢 Step 4: Active Shift Screen
```
Should see:
┌─────────────────────────────────────────┐
│ ACTIVE SHIFT                    LIVE 🟢 │
│ Bob Cashier • Branch: branch1          │
├─────────────────────────────────────────┤
│                                         │
│  SALES Section (left):                 │
│  ├─ Product Selector dropdown          │
│  │  ├─ Beef Chuck (Beef) - Current:... │
│  │  ├─ Lamb Leg (Lamb) - Current:...   │
│  │  └─ ... 8+ more products ...        │
│  ├─ Quantity (kg) input field          │
│  ├─ Payment Method buttons             │
│  │  ├─ [💵 Cash]                       │
│  │  └─ [📱 M-Pesa]                     │
│  ├─ [ADD TO CART] button               │
│  ├─ Shopping Cart (shows items added)  │
│  └─ [CONFIRM SALE] button              │
│                                         │
│  ADD STOCK Section:                    │
│  ├─ Product dropdown                   │
│  ├─ Received (kg) input                │
│  └─ [ADD STOCK] button                 │
│                                         │
│  Stock Summary (right):                │
│  ├─ Total Products: X                  │
│  ├─ Stock Ledger (table)               │
│  └─ [CLOSE SHIFT] button               │
│                                         │
└─────────────────────────────────────────┘
```

**If product dropdown is empty:**
- See "Empty Product List" troubleshooting below

---

## 🚨 Troubleshooting

### Issue 1: Still Stuck on "SHIFT NOT STARTED"

**Cause:** API call failed or response is wrong

**Debug Steps:**
```
1. Open Browser Console (F12)
2. Click "OPEN NEW SHIFT"
3. Look for error messages in Console
4. Go to Network tab
5. Look for "start" request
6. Click it
7. Check Response tab for data
```

**Expected Response:**
```json
{
  "success": true,
  "shift_id": "abc123...",
  "shift": {
    "shift_id": "abc123...",
    "cashier_id": "user-cashier-002",
    "cashier_name": "Bob Cashier",
    "branch_id": "branch1",
    "status": "OPEN",
    "opened_at": "2026-02-04T10:30:00Z",
    "closing_cash": 0,
    "closing_mpesa": 0,
    "total_products": 10,
    "total_sold_kg": 0,
    "total_added_kg": 0
  }
}
```

**Common Errors:**
```
❌ 401 Unauthorized
→ Token not in localStorage
→ Fix: Log in again

❌ 404 Not Found
→ API route not registered
→ Fix: Verify shifts router mounted in server/src/index.ts

❌ 500 Internal Server Error
→ Database query failed
→ Fix: Check Supabase tables exist and have data
```

---

### Issue 2: Loading Screen Stays Forever

**Cause:** Stock entries not loading

**Debug Steps:**
```
1. Console (F12) → Network tab
2. Look for GET request to /api/shifts/active/{id}
3. Check Response
4. Is stock_entries array empty?
```

**Expected Response:**
```json
{
  "shift": { /* shift data */ },
  "stock_entries": [
    {
      "id": "entry-001",
      "shift_id": "shift-abc123",
      "product_id": "prod-beef-001",
      "product_name": "Beef Chuck",      ← Must have this
      "category": "Beef",
      "unit_price": 800,
      "opening_stock": 50,
      "added_stock": 0,
      "sold_stock": 0,
      "closing_stock": 50
    },
    { /* ... 9 more products ... */ }
  ],
  "transactions": []
}
```

**If stock_entries is empty array []:**

Run this SQL:
```sql
-- Find the latest shift
SELECT id, shift_date, status FROM shifts ORDER BY opened_at DESC LIMIT 1;

-- Use that shift_id to check entries
SELECT COUNT(*) FROM shift_stock_entries WHERE shift_id = 'shift-id-here';
-- Expected: Same as product count (usually 10+)
```

**If 0 rows returned:**
- Shift was created but stock entries weren't created
- Check server logs for error messages
- Verify shift_stock_entries table exists

---

### Issue 3: Product Dropdown Empty

**Cause:** Products not being transformed correctly

**Debug Steps:**
```
1. Network tab
2. Find /api/shifts/active/{id} response
3. Check stock_entries array
4. For first item, does it have "product_name" field?
```

**Expected Structure:**
```json
{
  "product_id": "prod-beef-001",
  "product_name": "Beef Chuck",    ← Must have this (NOT nested)
  "category": "Beef",
  "unit_price": 800
}
```

**Broken Structure (will fail):**
```json
{
  "product_id": "prod-beef-001",
  "products": {
    "name": "Beef Chuck",    ← Nested - component won't find it
    "category": "Beef"
  }
}
```

**Fix:** Restart server (changes applied to shifts.ts)

---

### Issue 4: Error: "Failed to fetch shift"

**Most Common Causes:**

**A) Token Missing**
```typescript
// Check in browser console:
localStorage.getItem('token');
// Should return a long string starting with 'eyJ...'
// If empty → Log in again
```

**B) API Endpoint Not Found**
```
Error message: 404 /api/shifts/start
→ shifts router not mounted
→ Fix: Check server/src/index.ts has:
   import shiftsRouter from "./shifts";
   app.use("/api/shifts", shiftsRouter);
```

**C) Supabase Connection Failed**
```
Error message: connect ENOTFOUND supabase
→ SUPABASE_URL wrong or Supabase API down
→ Fix: Check .env file has correct URL
→ Test: curl https://glskbegsmdrylrhczpyy.supabase.co
```

---

## Quick Fixes Checklist

```
[ ] Users table has cashier users
[ ] Products table has 5+ active products
[ ] All products have unit_price > 0
[ ] Shifts router imported in server/src/index.ts
[ ] Shifts router mounted at /api/shifts
[ ] Browser localStorage has valid token
[ ] Server is running on port 3000
[ ] Supabase connection working
[ ] All fixes applied to shifts.ts
[ ] Frontend reloaded (Ctrl+Shift+R for hard reload)
```

---

## Database Verification Script

Copy-paste this entire script into Supabase SQL Editor to verify all data:

```sql
-- ============================================================================
-- SHIFT WORKFLOW DATA VERIFICATION
-- ============================================================================

-- 1. Check Users
SELECT 
  'USERS' as check_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'cashier' THEN 1 END) as cashier_count,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM users;

-- 2. Check Products  
SELECT 
  'PRODUCTS' as check_name,
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
  COUNT(CASE WHEN unit_price > 0 THEN 1 END) as with_price,
  MIN(unit_price) as min_price,
  MAX(unit_price) as max_price
FROM products;

-- 3. Check Shifts
SELECT 
  'SHIFTS' as check_name,
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_shifts,
  COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_shifts
FROM shifts;

-- 4. Check Stock Entries
SELECT 
  'STOCK_ENTRIES' as check_name,
  COUNT(*) as total_entries,
  COUNT(DISTINCT shift_id) as shifts_with_entries,
  COUNT(DISTINCT product_id) as products_tracked
FROM shift_stock_entries;

-- 5. Product Details (first 5)
SELECT name, category, unit_price, status
FROM products
WHERE status = 'active'
LIMIT 5;

-- 6. Cashier Details
SELECT name, email, role, status
FROM users
WHERE role = 'cashier'
LIMIT 5;
```

**Expected Results:**
```
USERS: cashier_count ≥ 1, active_count > 0
PRODUCTS: active_products ≥ 5, with_price = active_products
SHIFTS: Can be 0 (new database), or > 0 if tested before
STOCK_ENTRIES: > 0 if shifts exist
```

---

## Still Having Issues?

Provide these details when asking for help:

1. **Console Error (if any):**
   - Copy exact error message from browser console

2. **Network Response:**
   - Go to Network tab → Click start shift → Copy response JSON

3. **Database Status:**
   - Run verification script above and share results

4. **Which Step Failed:**
   - [ ] Login
   - [ ] Click "Open Shift"
   - [ ] Loading screen
   - [ ] Product dropdown
   - [ ] Add to cart
   - [ ] Something else: ___________

5. **Browser/Server Info:**
   - Browser: (Chrome/Firefox/Safari)
   - Backend running: Yes/No
   - Frontend running: Yes/No

---

**Remember:** Most issues are data-related. Always verify database has the required test data first!
