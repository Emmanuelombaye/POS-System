# SYSTEM ARCHITECTURE & DATA FLOW GUIDE

**Status**: Live Production System  
**Date**: February 3, 2026

---

## 🔴 CRITICAL ISSUES IDENTIFIED

This document identifies why "Shift Not Started" appears and admin doesn't see cashier sales in real-time.

### Issue 1: Shift Opening Not Refreshing
**Problem**: When cashier opens shift, `activeShift` is set in Zustand, but page doesn't show it unless refreshed  
**Root Cause**: `fetchShifts()` is called, but response mapping may fail or activeShift isn't persisted properly  
**Fix**: Add polling + subscription to ensure activeShift updates

### Issue 2: Admin Not Seeing Cashier Actions
**Problem**: Admin Wholesale/Market shows only manual entries, not actual cashier sales  
**Root Cause**: Transactions aren't being recorded to database, or real-time aggregation isn't triggered  
**Fix**: Verify transaction save → database insert → real-time subscriptions

### Issue 3: No Link Between Cashier and Admin
**Problem**: Changes on cashier side don't trigger updates on admin  
**Root Cause**: Missing real-time subscriptions or polling not running  
**Fix**: Ensure Supabase subscriptions are active and fetches run every 10 seconds

---

## 📊 Complete Data Flow Architecture

```
CASHIER SIDE                      BACKEND                           DATABASE              ADMIN SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] SHIFT OPENING
┌─────────────────┐
│ Click "Open     │
│ New Shift"      │
└────────┬────────┘
         │
         ├─→ appStore.openShift(cashierId, branchId)
         │    │
         │    ├─→ api.post("/shifts/open", {cashier_id, branch_id})
         │    │    │
         │    │    └─→ [BACKEND] POST /shifts/open
         │    │         │
         │    │         ├─→ Check if cashier has open shift
         │    │         ├─→ CREATE shift record
         │    │         ├─→ INSERT opening snapshot to inventory_ledger
         │    │         ├─→ INSERT shift_stock_snapshots
         │    │         ├─→ INSERT shift_stock_entries
         │    │         └─→ RETURN shift {id, cashier_id, opened_at, status: 'OPEN'}
         │    │
         │    ├─→ set({ activeShift: {id, cashierId, openedAt, status} })
         │    └─→ fetchShifts() [re-fetch to sync]
         │
         └─→ [RESULT] Page shows "Shift Started" + cart UI


[2] ADDING TO CART & COMPLETING SALE
┌────────────────────┐
│ Select product     │
│ Set weight/qty     │
│ Select payment ✓   │
│ Click "Complete    │
│  Sale"             │
└────────┬───────────┘
         │
         ├─→ appStore.completeSale()
         │    │
         │    ├─→ Calculate subtotal = Σ(pricePerKg × weightKg)
         │    ├─→ Apply discount if any
         │    ├─→ Create Transaction object
         │    │
         │    ├─→ api.post("/transactions", {
         │    │     id, cashier_id, shift_id, branch_id,
         │    │     created_at, items, subtotal, total,
         │    │     payment_method: "cash" | "mpesa"
         │    │   })
         │    │
         │    │    └─→ [BACKEND] POST /transactions
         │    │         │
         │    │         ├─→ INSERT transaction to DB
         │    │         ├─→ Log each item to inventory_ledger (event_type: 'SALE')
         │    │         ├─→ Update shift_stock_entries (increase sold_stock)
         │    │         ├─→ Update products (decrease stock_kg)
         │    │         └─→ RETURN created transaction
         │    │
         │    ├─→ Update local products (reduce stock immediately)
         │    ├─→ Clear cart
         │    └─→ Show success message
         │
         └─→ [RESULT] Transaction saved to database ✅


[3] REAL-TIME AGGREGATION → ADMIN SEES IT
┌──────────────────────────────────────┐
│ Supabase Realtime Trigger Fires      │
│ (new row in transactions table)       │
└────────┬─────────────────────────────┘
         │
         ├─→ [ADMIN DASHBOARD]
         │    │
         │    ├─→ useEffect subscribes to:
         │    │    - "wholesale_summaries" changes
         │    │    - "transactions" INSERT events
         │    │
         │    ├─→ On trigger: fetchSummaries()
         │    │
         │    ├─→ api.get("/api/wholesale-summaries/realtime?date=2026-02-04")
         │    │    │
         │    │    └─→ [BACKEND] GET /wholesale-summaries/realtime
         │    │         │
         │    │         ├─→ Query transactions for today
         │    │         ├─→ Aggregate by branch_id → branch name:
         │    │         │   - branch 1 → "Branch 1"
         │    │         │   - branch 2 → "Branch 2"  
         │    │         │   - branch 3 → "Branch 3"
         │    │         │
         │    │         ├─→ Group by payment_method:
         │    │         │   ├─ cash: SUM total (payment_method='cash')
         │    │         │   └─ mpesa: SUM total (payment_method='mpesa')
         │    │         │
         │    │         ├─→ Also fetch manual wholesale_summaries entries
         │    │         ├─→ Merge: manual + transaction totals
         │    │         │
         │    │         └─→ RETURN [{
         │    │               id, date, branch,
         │    │               cash_received, mpesa_received,
         │    │               manual_cash, manual_mpesa,
         │    │               transaction_cash, transaction_mpesa
         │    │             }]
         │    │
         │    └─→ setSummaries(mappedData)
         │         (triggers re-render)
         │
         └─→ [RESULT] Admin sees:
              ✅ Branch 1: Cash 5,000 (from sales) | M-Pesa 0
              ✅ Branch 2: Cash 0 | M-Pesa 3,000 (from sales)
              etc.
```

---

## 📁 KEY CODE LOCATIONS

### Frontend Data Flow

**Cashier Opens Shift**:
- File: [src/pages/cashier/ShiftStock.tsx](src/pages/cashier/ShiftStock.tsx#L70-L80)
- Action: `openShift(currentUser.id, currentBranch)`
- Store: [src/store/appStore.ts](src/store/appStore.ts#L569-L590)

**Cashier Completes Sale**:
- File: [src/pages/cashier/ModernCashierDashboard.tsx](src/pages/cashier/ModernCashierDashboard.tsx#L100-L120)
- Action: `completeSale()`
- Store: [src/store/appStore.ts](src/store/appStore.ts#L322-L385)
- API Call: `api.post("/transactions", {cashier_id, branch_id, total, payment_method, ...})`

**Admin Sees Summaries**:
- File: [src/components/wholesale/WholesaleDesk.tsx](src/components/wholesale/WholesaleDesk.tsx#L18-L52)
- Subscriptions: `supabase.channel("wholesale-changes")` + `supabase.channel("transactions-changes")`
- Polling: Every 10 seconds via `setInterval(fetchSummaries, 10000)`
- API Call: `api.get("/api/wholesale-summaries/realtime?date=TODAY")`
- Display: [src/components/wholesale/WholesaleSummaryDisplay.tsx](src/components/wholesale/WholesaleSummaryDisplay.tsx)

### Backend Endpoints

**POST /api/shifts/open** — [server/src/index.ts](server/src/index.ts#L390-L445)
- Creates shift record
- Logs opening snapshot
- Returns: `{id, cashier_id, status: 'OPEN', opened_at}`

**POST /api/transactions** — [server/src/index.ts](server/src/index.ts#L309-L378)
- Inserts transaction
- Logs to inventory_ledger
- Updates shift_stock_entries
- Updates product stock
- Returns: created transaction

**GET /api/wholesale-summaries/realtime** — [server/src/index.ts](server/src/index.ts#L745-L820)
- Queries transactions for date
- Aggregates by branch + payment_method
- Merges with manual entries
- Returns: `[{id, date, branch, cash_received, mpesa_received, manual_*, transaction_*}]`

### Database Tables

**transactions**:
- Columns: `id`, `cashier_id`, `shift_id`, `branch_id`, `created_at`, `items` (JSON), `subtotal`, `total`, `payment_method`
- Real-time enabled: ✅ YES (must run SCRIPT_06_REALTIME_ENABLE.sql)

**shifts**:
- Columns: `id`, `cashier_id`, `opened_at`, `closed_at`, `status`
- Row Level Security: Enabled

**wholesale_summaries**:
- Columns: `id`, `date`, `branch`, `cash_received`, `mpesa_received`, `created_at`
- Real-time enabled: ✅ YES

**shift_stock_entries**:
- Tracks opening, added, sold stock per product per shift per branch
- Used as fallback when transaction lacks branch_id

---

## ✅ VERIFICATION CHECKLIST

Run these checks to ensure system is live:

### 1️⃣ Backend is Running
```bash
# Check health
curl http://localhost:4000/health

# Expected output:
# {"status":"ok","service":"eden-top-backend","database":"supabase"}
```

### 2️⃣ Database Users Exist
```bash
# Check users table
curl http://localhost:4000/debug/users

# Expected output:
# {
#   "totalUsers": 5,
#   "users": [
#     {"id":"a1", "name":"Admin Eden", "role":"admin"},
#     {"id":"c1", "name":"Cashier David", "role":"cashier"},
#     ...
#   ]
# }
```

### 3️⃣ Login Works
```bash
# Admin login
POST /api/auth/login
{
  "userId": "a1",
  "password": "@AdminEdenDrop001"
}

# Expected: Token + user object
```

### 4️⃣ Shift Opening Works
```bash
# Open shift for cashier c1, branch 1
POST /api/shifts/open
Header: Authorization: Bearer {token}
{
  "cashier_id": "c1",
  "branch_id": "1"
}

# Expected: Shift object with status: 'OPEN'
```

### 5️⃣ Transaction Posting Works
```bash
# Create transaction
POST /api/transactions
Header: Authorization: Bearer {token}
{
  "id": "tx-001",
  "cashier_id": "c1",
  "shift_id": "{shift_id_from_step_4}",
  "branch_id": "1",
  "created_at": "2026-02-04T07:50:00Z",
  "items": [{
    "productId": "p1",
    "productName": "Beef",
    "weightKg": 5,
    "pricePerKg": 1000
  }],
  "subtotal": 5000,
  "total": 5000,
  "payment_method": "cash"
}

# Expected: Transaction saved to database
# Check: SELECT * FROM transactions WHERE id = 'tx-001';
```

### 6️⃣ Real-Time Aggregation Works
```bash
# Check wholesale summaries
GET /api/wholesale-summaries/realtime?date=2026-02-04
Header: Authorization: Bearer {token}

# Expected: Branch totals including your transaction
# {
#   "branch": "Branch 1",
#   "cash_received": 5000,
#   "transaction_cash": 5000,
#   ...
# }
```

### 7️⃣ Frontend Connects to Backend
- Open http://localhost:5174
- Check browser console: No "Failed to fetch" errors
- Login succeeds: Token stored in localStorage

### 8️⃣ Admin Dashboard Updates in Real-Time
- Login as admin
- Go to Wholesale/Market
- In another window, login as cashier → complete sale
- Within 10 seconds (or instantly), admin dashboard should show new totals

---

## 🔧 WHAT TO FIX (IF ISSUES REMAIN)

### If "Shift Not Started" Still Shows
1. Check that `fetchShifts()` is being called ✅ (happens in ShiftStock.tsx useEffect)
2. Verify response maps correctly to `Shift` interface ✅ (status, cashierId match)
3. Add polling to ensure activeShift is always current:
   ```typescript
   useEffect(() => {
     const interval = setInterval(fetchShifts, 5000); // Every 5 seconds
     return () => clearInterval(interval);
   }, []);
   ```

### If Admin Doesn't See Cashier Sales
1. Verify transaction posts with `branch_id` ✅ (added in appStore.ts)
2. Verify real-time subscriptions are active:
   ```typescript
   supabase.channel("wholesale-changes")
     .on("postgres_changes", {event:"*", schema:"public", table:"wholesale_summaries"}, () => fetchSummaries())
     .subscribe();
   ```
3. Run SCRIPT_06_REALTIME_ENABLE.sql in Supabase to enable realtime
4. Check that transactions table has `created_at` column (not transaction_date)

### If Wholesale Totals Don't Update
1. Verify aggregation endpoint filters by date correctly ✅
2. Check that transaction `payment_method` is exactly "cash" or "mpesa" (lowercase) ✅
3. Clear old mock data: Run SCRIPT_07_CLEAR_WHOLESALE_MOCK_DATA.sql
4. Restart backend to pick up new data

---

## 🔍 DEBUGGING STEPS

**Q: Shift opens but disappears on refresh?**  
A: `activeShift` is in memory. Add to persist middleware in appStore.ts:
```typescript
partialize: (state) => ({
  ...existing,
  activeShift: state.activeShift  // Add this line
})
```

**Q: Transaction created but not in admin view?**  
A: 
1. Check database: `SELECT * FROM transactions WHERE cashier_id = 'c1'`
2. Check branch_id field exists and has correct value (1, 2, or 3, not "branch1")
3. Verify aggregation logic maps branches correctly

**Q: Admin sees manual entries but not transaction totals?**  
A: Aggregation endpoint isn't summing transactions. Check:
- Is transaction `created_at` or `transaction_date`? Backend tries both.
- Is `payment_method` exactly "cash" or "mpesa"?
- Are you within the date range being queried?

---

## 📋 SYSTEM STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Server | 🟢 Running | Port 4000 |
| Frontend Dev | 🟢 Running | Port 5174 (5173 in use) |
| Supabase DB | 🟢 Connected | Auth + Real-time enabled |
| User Table | 🟢 Data Present | 5 test users |
| Shifts Table | 🟢 Working | Can open shifts |
| Transactions Table | 🟡 Needs verification | Check `created_at` column exists |
| Real-time Subscriptions | 🟡 Needs verification | Run SCRIPT_06_REALTIME_ENABLE.sql |
| Wholesale Summaries | 🟡 Partially Working | Shows manual entries, needs transaction sync |

---

## 🚀 NEXT STEPS

1. ✅ **Verify everything works**:
   - Run verification checklist above
   - Check browser console for errors
   - Check backend logs for failures

2. **If issues found**:
   - Apply fixes from "WHAT TO FIX" section
   - Run SQL scripts (06 and 07)
   - Restart servers

3. **Live test**:
   - Cashier opens shift
   - Cashier completes sale (cash + mpesa)
   - Admin sees totals within 10 seconds
   - Repeat for Branch 2 & 3

4. **Go live**:
   - Confirm all features working
   - Set up continuous monitoring
   - Document any customizations

---

**Generated**: February 3, 2026  
**System**: CEOPOS (Multi-Branch Retail POS)  
**Tier**: Production
