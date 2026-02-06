# ✅ SHIFT WORKFLOW - STEP-BY-STEP TEST GUIDE

## Before Testing

**Prerequisite:** Seed the database with test data
```bash
# 1. Go to Supabase Dashboard
# 2. Open SQL Editor
# 3. Copy entire content of SCRIPT_01_SEED_USERS_PRODUCTS.sql
# 4. Paste into SQL Editor
# 5. Click "Run"
# 6. Verify "User created" and "Products inserted" messages
```

---

## Test Scenario Setup

| Entity | Count | Details |
|--------|-------|---------|
| Users | 5 | 1 Admin, 1 Manager, 3 Cashiers |
| Products | 10 | Beef, Lamb, Chicken, Goat |
| Opening Stock | 10 per product | Loaded from yesterday |
| Test User | Bob Cashier | bob@test.com / password123 |

---

## 🎯 Test Case: TCS-001 - Start Shift Successfully

### Precondition
- [ ] User logged in as Bob Cashier (bob@test.com)
- [ ] On cashier dashboard
- [ ] No active shift for this cashier
- [ ] At least 5 products in database

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Click "OPEN NEW SHIFT" button | Button shows loading spinner | [ ] |
| 2 | Wait 1-2 seconds | Loading spinner completes | [ ] |
| 3 | Observe screen | Redirects to "Active Shift" view | [ ] |
| 4 | Check header | Shows "Active Shift" with LIVE indicator | [ ] |
| 5 | Check product dropdown | Contains all 10 products | [ ] |
| 6 | Check right panel | Shows stock summary table | [ ] |

### Verification

**In Browser Console (F12):**
```javascript
// Should show shift data
console.log(localStorage.getItem('currentShift'));
// Output: shift_id, status='OPEN', cashier_name='Bob Cashier'
```

**In Supabase:**
```sql
SELECT id, cashier_name, status, opened_at 
FROM shifts 
WHERE cashier_name = 'Bob Cashier' 
ORDER BY opened_at DESC 
LIMIT 1;
-- Should return 1 row with status='OPEN'
```

**In Browser Network Tab:**
- [ ] POST /api/shifts/start → Response 201
- [ ] GET /api/shifts/{id}/details → Response 200
- [ ] Both return shift data with stock_entries array

### Result
- [ ] **PASS** - All steps completed, shift started successfully
- [ ] **FAIL** - Error at step ____, see troubleshooting guide

---

## 🎯 Test Case: TCS-002 - Add Single Sale

### Precondition
- [ ] Shift is active (from TCS-001)
- [ ] On "Active Shift" screen
- [ ] Product dropdown shows products

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Click product dropdown | Shows list of 10 products | [ ] |
| 2 | Select "Beef Chuck" | "Beef Chuck" selected in dropdown | [ ] |
| 3 | Enter quantity "2.5" | Shows "2.5" in quantity field | [ ] |
| 4 | Verify payment is "Cash" | Cash button is highlighted | [ ] |
| 5 | Click "ADD TO CART" | Item added to cart (see below table) | [ ] |
| 6 | Verify cart shows: | **Beef Chuck** 2.5kg × 800 = **2000 KES** 💵 | [ ] |

### Cart Verification
```
Expected Cart Display:
┌─────────────────────────────────────┐
│ Beef Chuck 2.5kg × 800 = 2000 KES 💵│
│ [Remove] ✕                          │
├─────────────────────────────────────┤
│ Total: 5.0kg = 2000 KES              │
├─────────────────────────────────────┤
│ [CONFIRM SALE]                      │
└─────────────────────────────────────┘
```

### Verification

**Check cart items:**
```javascript
// In console, check component state
// Should show 1 item in cart with quantity=2.5
```

**Before Confirming:**
- [ ] Cart subtotal correct (2.5 × 800 = 2000)
- [ ] Payment method shown as Cash
- [ ] Remove button works

### Result
- [ ] **PASS** - Item added to cart correctly
- [ ] **FAIL** - Issue at step ____

---

## 🎯 Test Case: TCS-003 - Confirm Sale

### Precondition
- [ ] Item in cart (from TCS-002)
- [ ] Cart shows correct total
- [ ] "CONFIRM SALE" button visible

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Click "CONFIRM SALE" | Button shows loading state | [ ] |
| 2 | Wait 1-2 seconds | Sale recorded (no error message) | [ ] |
| 3 | Observe cart | Cart clears, ready for next item | [ ] |
| 4 | Check right panel | Stock numbers updated | [ ] |
| 5 | Look for transaction | New transaction visible in list | [ ] |

### Expected Stock Changes

Before Sale:
```
Beef Chuck: Opening 50kg + Added 0kg - Sold 0kg = Expected 50kg
```

After Sale (2.5kg sold):
```
Beef Chuck: Opening 50kg + Added 0kg - Sold 2.5kg = Expected 47.5kg
```

### Verification

**In Database:**
```sql
-- Find latest transaction
SELECT id, shift_id, product_id, quantity_kg, payment_method, total_amount
FROM transactions
WHERE shift_id = (
  SELECT id FROM shifts WHERE cashier_name = 'Bob Cashier' 
  ORDER BY opened_at DESC LIMIT 1
)
ORDER BY created_at DESC
LIMIT 1;
-- Should show: quantity_kg=2.5, payment_method='cash', total_amount=2000
```

**Stock Entry Updated:**
```sql
SELECT product_id, opening_stock, sold_stock, closing_stock, expected_closing
FROM shift_stock_entries
WHERE shift_id = (
  SELECT id FROM shifts WHERE cashier_name = 'Bob Cashier' 
  ORDER BY opened_at DESC LIMIT 1
)
AND product_id LIKE '%beef%';
-- Should show: sold_stock=2.5, closing_stock=47.5
```

### Result
- [ ] **PASS** - Transaction recorded, stock updated
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCS-004 - Add Multiple Sales

### Precondition
- [ ] Shift active
- [ ] At least one sale completed (from TCS-003)
- [ ] Cart empty

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Add 1.5kg Lamb Leg (Cash) | Added to cart | [ ] |
| 2 | Add 3.0kg Chicken Breast (M-Pesa) | Added to cart (separate line) | [ ] |
| 3 | Verify payment indicators | Cash ✓, M-Pesa ✓ shown | [ ] |
| 4 | Check total | Correct calculation shown | [ ] |
| 5 | Click CONFIRM SALE | Both sales recorded | [ ] |

### Expected Cart Before Confirm
```
┌────────────────────────────────────────────┐
│ Lamb Leg 1.5kg × 1200 = 1800 KES 💵       │
│ Chicken Breast 3.0kg × 600 = 1800 KES 📱 │
├────────────────────────────────────────────┤
│ Total: 4.5kg = 3600 KES                    │
├────────────────────────────────────────────┤
│ [CONFIRM SALE]                             │
└────────────────────────────────────────────┘
```

### Verification

**Two transactions should exist:**
```sql
SELECT product_id, quantity_kg, payment_method, total_amount
FROM transactions
WHERE shift_id = (SELECT id FROM shifts 
  WHERE cashier_name = 'Bob Cashier' 
  ORDER BY opened_at DESC LIMIT 1)
ORDER BY created_at DESC
LIMIT 2;

-- Expected:
-- 1. product=chicken, qty=3.0, method=mpesa, amount=1800
-- 2. product=lamb, qty=1.5, method=cash, amount=1800
```

### Result
- [ ] **PASS** - Multiple sales with mixed payment methods work
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCS-005 - Add Mid-Shift Stock

### Precondition
- [ ] Shift active with completed sales
- [ ] "ADD STOCK" section visible on right panel

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Click product dropdown in ADD STOCK | Shows all products | [ ] |
| 2 | Select "Beef Chuck" | Dropdown updates | [ ] |
| 3 | Enter "10.0" in Received field | Shows "10.0 kg" | [ ] |
| 4 | Click "ADD STOCK" button | Button shows loading state | [ ] |
| 5 | Wait 1 second | Stock updated message appears | [ ] |
| 6 | Check right panel stock ledger | Beef Chuck added_stock now 10kg | [ ] |

### Expected Stock Before ADD STOCK
```
Beef Chuck:
- Opening: 50kg
- Sold: 2.5kg
- Added: 0kg
- Expected Closing: 47.5kg
```

### Expected Stock After ADD STOCK
```
Beef Chuck:
- Opening: 50kg
- Sold: 2.5kg
- Added: 10.0kg ← Updated
- Expected Closing: 57.5kg ← Recalculated
```

### Verification

**In Database:**
```sql
SELECT opening_stock, added_stock, sold_stock, closing_stock
FROM shift_stock_entries
WHERE shift_id = (SELECT id FROM shifts 
  WHERE cashier_name = 'Bob Cashier' 
  ORDER BY opened_at DESC LIMIT 1)
AND product_id LIKE '%beef%';
-- Should show: added_stock=10.0, closing_stock=57.5
```

### Result
- [ ] **PASS** - Stock added, expected closing recalculated
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCS-006 - Close Shift

### Precondition
- [ ] Shift active with transactions and stock additions
- [ ] Ready to close

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Scroll to bottom | See "CLOSING SHIFT" section | [ ] |
| 2 | For each product, enter actual count | Form shows all products | [ ] |
| 3 | Example: Beef Chuck 57.0kg | Input field accepts value | [ ] |
| 4 | Enter Cash Received: 2000 | Shows "2000" | [ ] |
| 5 | Enter M-Pesa Received: 1800 | Shows "1800" | [ ] |
| 6 | Click "CLOSE SHIFT" button | Button shows loading state | [ ] |
| 7 | Wait 2 seconds | Redirects to confirmation screen | [ ] |

### Expected Closing Form

```
┌────────────────────────────────────────┐
│ CLOSING SHIFT                          │
├────────────────────────────────────────┤
│ Beef Chuck (Expected: 57.5kg)          │
│ Actual: [57.0] kg                      │
│ Variance: -0.5kg ⚠️                    │
│                                        │
│ Goat Meat (Expected: 38.5kg)           │
│ Actual: [38.5] kg                      │
│ Variance: 0.0kg ✓                      │
│ ... more products ...                  │
│                                        │
│ PAYMENTS                               │
│ Cash Received:   [2000]  KES           │
│ M-Pesa Received: [1800]  KES           │
│ Total Expected:  3800 KES              │
│                                        │
│ [CLOSE SHIFT]                          │
└────────────────────────────────────────┘
```

### Verification

**After Closing - Confirmation Screen Should Show:**
```
┌──────────────────────────────────────┐
│ ✅ SHIFT CLOSED SUCCESSFULLY         │
├──────────────────────────────────────┤
│ Shift ID: shift-abc...                │
│ Duration: 4 hours 32 minutes          │
│ Total Transactions: 3                 │
│ Total Amount: 3600 KES                │
│ Stock Variance: -0.5kg (1 product)    │
└──────────────────────────────────────┘
```

**In Database:**
```sql
SELECT id, status, closed_at, closing_cash, closing_mpesa
FROM shifts
WHERE cashier_name = 'Bob Cashier'
ORDER BY opened_at DESC
LIMIT 1;
-- Should show: status='CLOSED', closing_cash=2000, closing_mpesa=1800
```

### Result
- [ ] **PASS** - Shift closed successfully with reconciliation
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCA-001 - Admin View Live Shifts

### Precondition
- [ ] At least one active shift exists (from cashier side)
- [ ] Log in as Admin (admin@test.com / password123)

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Navigate to Admin Dashboard | Shows "Live Shifts" section | [ ] |
| 2 | Look for shifts list | Shows live shifts with green pulse | [ ] |
| 3 | Find "Bob Cashier" shift | Shows: "🟢 LIVE Bob Cashier" | [ ] |
| 4 | Check "Since" time | Shows reasonable time (< 1 hour ago) | [ ] |
| 5 | Click "VIEW DETAILS" | Loads shift details page | [ ] |

### Expected Dashboard View

```
LIVE SHIFTS
┌────────────────────────────────────┐
│ 🟢 LIVE Bob Cashier                │
│    Branch1 · Opened 4h ago         │
│    [VIEW DETAILS]                  │
├────────────────────────────────────┤
│ 🟢 LIVE Carol Cashier              │
│    Branch1 · Opened 2h ago         │
│    [VIEW DETAILS]                  │
├────────────────────────────────────┤
│ ⚫ CLOSED Alice Cashier (16:30)     │
│    [VIEW DETAILS]                  │
└────────────────────────────────────┘
```

### Result
- [ ] **PASS** - Admin sees live shifts list
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCA-002 - Admin View Shift Details

### Precondition
- [ ] Admin logged in
- [ ] Viewing live shift details for Bob's shift

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Open shift details | Shows full reconciliation | [ ] |
| 2 | Check header | Shows cashier name & branch | [ ] |
| 3 | Scroll to Stock Reconciliation | Shows table with products | [ ] |
| 4 | Find Beef Chuck row | Shows: Opening 50 | Added 10 | Sold 2.5 | Expected 57.5 | Actual 57.0 | Variance -0.5 | [ ] |
| 5 | Check variance alerts | Shows "⚠️ Stock Discrepancy" for Beef Chuck | [ ] |
| 6 | Scroll to Payment Reconciliation | Shows Cash & M-Pesa summary | [ ] |
| 7 | Verify Cash matches | Expected 2000 = Reported 2000 ✓ | [ ] |
| 8 | Verify M-Pesa matches | Expected 1800 = Reported 1800 ✓ | [ ] |

### Expected Details Page

```
┌──────────────────────────────────────────────────────┐
│ SHIFT DETAILS - Bob Cashier                          │
│ Branch: Branch1 · Status: OPEN                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 STOCK RECONCILIATION                             │
│ ┌────────────────────────────────────────────────┐  │
│ │ Product    │ Open │ Add │ Sold│ Exp │ Act │Var│  │
│ ├────────────────────────────────────────────────┤  │
│ │ Beef Chuck │  50  │ 10  │ 2.5 │57.5│ 57.0│-0.5│  │
│ │ Goat Meat  │  40  │  0  │ 1.5 │38.5│ 38.5│ 0  │  │
│ │ Chicken    │  80  │  0  │ 3.0 │ 77 │  77 │ 0  │  │
│ │ ...        │ ... │ ... │ ...│ ...│ ...│ ...│  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ ⚠️ VARIANCE ALERTS                                   │
│ • Beef Chuck: -0.5kg (Actual < Expected)            │
│                                                      │
│ 💰 PAYMENT RECONCILIATION                           │
│ ┌────────────────────────────────────────────────┐  │
│ │ Method    │ Expected │ Reported │ Variance   │  │
│ ├────────────────────────────────────────────────┤  │
│ │ Cash      │ 2000 KES │ 2000 KES │ 0 KES ✓   │  │
│ │ M-Pesa    │ 1800 KES │ 1800 KES │ 0 KES ✓   │  │
│ │ TOTAL     │ 3800 KES │ 3800 KES │ 0 KES ✓   │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ Last Updated: 14:35:47 · Auto-refreshes every 5s   │
└──────────────────────────────────────────────────────┘
```

### Verification

**Check calculations:**
- Expected = Opening + Added - Sold ✓
- Variance = Actual - Expected ✓
- Payment Match = Reported - Expected ✓

**In Database:**
```sql
-- Find shift details
SELECT status, opened_at, closed_at, closing_cash, closing_mpesa
FROM shifts WHERE id = 'shift-id-here';

-- Check stock reconciliation
SELECT product_id, opening_stock, added_stock, sold_stock, closing_stock, variance
FROM shift_stock_entries
WHERE shift_id = 'shift-id-here';

-- Check transactions by payment method
SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
FROM transactions
WHERE shift_id = 'shift-id-here'
GROUP BY payment_method;
```

### Result
- [ ] **PASS** - All reconciliation data correct and calculations accurate
- [ ] **FAIL** - Issue: ____

---

## 🎯 Test Case: TCA-003 - Real-Time Updates

### Precondition
- [ ] Admin viewing open shift details
- [ ] Cashier still has active shift
- [ ] Another terminal/browser open with cashier account

### Steps

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Have cashier add a sale (2kg chicken) | No page refresh | [ ] |
| 2 | Watch admin screen | Chicken stock updates within 5 seconds | [ ] |
| 3 | Check sold_stock increase | Updates to show new quantity | [ ] |
| 4 | Have cashier add stock (5kg beef) | No page refresh | [ ] |
| 5 | Watch admin screen | Beef added_stock & expected recalculates | [ ] |
| 6 | Admin clicks "Refresh" (if available) | Immediately shows latest | [ ] |

### Expected Behavior

```
Timeline:
14:30:00 - Admin viewing shift details
14:30:15 - Cashier adds 2kg Chicken sale
14:30:18 - Admin screen updates automatically
          Chicken sold_stock: 3.0kg → 5.0kg
          Expected: 77kg → 75kg

14:30:45 - Cashier adds 5kg Beef stock
14:30:48 - Admin screen updates automatically
          Beef added_stock: 10kg → 15kg
          Expected: 57.5kg → 62.5kg
```

### Result
- [ ] **PASS** - Real-time updates work, no manual refresh needed
- [ ] **PARTIAL** - Updates work but require refresh
- [ ] **FAIL** - Updates don't work

---

## Summary Test Checklist

### Cashier Workflow
- [ ] TCS-001: Start Shift
- [ ] TCS-002: Add Single Sale
- [ ] TCS-003: Confirm Sale
- [ ] TCS-004: Add Multiple Sales
- [ ] TCS-005: Add Mid-Shift Stock
- [ ] TCS-006: Close Shift

### Admin Workflow
- [ ] TCA-001: View Live Shifts
- [ ] TCA-002: View Shift Details
- [ ] TCA-003: Real-Time Updates

### All Passed?
✅ **System is READY FOR PRODUCTION**

### Any Failed?
❌ Refer to troubleshooting guide and check error logs

---

**Remember:** Test in order! Each test builds on the previous one.
