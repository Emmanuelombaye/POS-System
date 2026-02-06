# Shift Stock Monitoring System - Live Testing Guide

## System Architecture

```
CASHIER SIDE                    BACKEND                      ADMIN DASHBOARD
============                    =======                      ===============

[Open Shift]  ──────────> POST /api/shifts/open ──────> Shift created
  ↓                                                         ↓
  │                                                    Stock logged
  │
[Sales Entry] ──────────> POST /api/transactions ──> Sales deducted
  ↓                                                  automatically
  │
[Close Shift] ──────────> POST /api/shifts/:id/close ──> Closing stock
  └─ Enter closing                      │                recorded
     stock counts                       └─> Calculate variance
                                           
ADMIN sees in real-time:
- All active shifts
- Opening stock (loaded automatically from yesterday's closing)
- Live sales reducing stock
- Closing stock when entered
- Expected vs Actual comparison
- Variance alerts (red = missing, green = extra)
```

## Testing Workflow

### Step 1: Cashier Opens Shift
1. Login as cashier (e.g., cashier1)
2. Go to Shift Stock page
3. Click "Open Shift"
4. System records opening stock from yesterday's closing

**Backend logs should show:** `[SHIFT_OPEN] Cashier ... opened shift ...`

### Step 2: Admin Views Live Shift
1. Login as admin
2. Go to Admin Dashboard
3. See the new shift appear in "Shift Stock Monitor"
4. View opening stock for each product

**Dashboard shows:**
- Active shifts count
- Shift duration (in minutes)
- Opening stock by product
- Status: 🟢 LIVE

### Step 3: Cashier Makes Sales
1. Go to POS / Transactions
2. Enter sales (e.g., 5kg Beef, 3kg Goat)
3. Complete transactions

**Backend logs should show:** `[TRANSACTION] Sale created with items deducted`

### Step 4: Admin Sees Live Updates
1. Refresh or wait 5 seconds
2. Admin dashboard auto-updates
3. "Sold" column increases for products
4. "Expected" stock decreases (Opening + Added - Sold)

### Step 5: Cashier Closes Shift
1. Go to Shift Stock page
2. Click "Close Shift"
3. Modal appears with input fields for 9 products (beef, goat, offal)
4. Enter actual closing counts (e.g., 8kg Beef, 7kg Goat)
5. Click "Close"

**Backend logs should show:** `[SHIFT_CLOSE] Closing shift ...`

### Step 6: Admin Sees Variance
1. Admin dashboard updates within 5 seconds
2. Shift shows:
   - Opening: e.g., 10kg Beef
   - Added: 0kg
   - Sold: 2kg
   - Expected: 8kg
   - Actual: 8kg
   - Variance: 0kg ✓ (reconciled)

3. If actual != expected:
   - Red alert box appears
   - Shows "⚠ Missing Stock" or "+ Extra Stock"
   - Displays variance amount

## Data Points Admin Can See

For each shift:

| Metric | Source | Color |
|--------|--------|-------|
| Opening | Yesterday's closing | Blue box |
| Added | Manual stock additions | Green box |
| Sold | Transactions (auto-deducted) | Orange box |
| Expected | Opening + Added - Sold | Purple box |
| Actual | Cashier entry at close | Indigo box |
| Variance | Expected - Actual | Red (missing), Green (extra) |

## Key Features Verified

✅ Auto-load yesterday's closing stock
✅ Real-time sales deduction
✅ Prevent closing without entering counts
✅ Admin sees live updates every 5 seconds
✅ Variance alerts for discrepancies
✅ Product grouping by category
✅ Shift duration tracking
✅ Status indicators (LIVE vs PENDING)

## Database Tables Used

- `shifts` - Shift records (open, pending, approved)
- `shift_stock_entries` - Per-product stock tracking
- `transactions` - Sales records (auto-deduct stock)
- `products` - Product catalog (beef, goat, offal)
- `inventory_ledger` - Audit trail of all movements

## Real-time Data Flow

1. Cashier closes shift → POST /api/shifts/:id/close
2. Backend updates shift_stock_entries.closing_stock
3. Backend calculates variance
4. Admin polls GET /api/shift-stock (every 5 seconds)
5. Dashboard receives updated data
6. UI updates with variance alerts

## Troubleshooting

| Issue | Check |
|-------|-------|
| Shift won't open | Verify token is valid, backend is running |
| No products in modal | Check MEAT_CATEGORIES filter (beef, goat, offal) |
| Closing stock not saved | Check POST request body has actual_counts |
| Admin sees no shifts | Verify shift status is OPEN or PENDING_REVIEW |
| Variance always 0 | Check database has shift_stock_entries table |

