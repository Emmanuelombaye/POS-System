## Real-Time Shift System Test Flow

### Prerequisites
✓ Backend running on port 4000
✓ Frontend running on port 5174
✓ shift_stock_entries table created in Supabase
✓ Two browsers/tabs open (one for cashier, one for admin)

---

### Step 1: Cashier Opens Shift
**Browser 1 (Cashier - http://localhost:5174)**
1. Login as cashier (any cashier account)
2. You should see "Shift Not Started" modal
3. Click **"Open New Shift"**
4. **Watch backend logs** - should see:
   ```
   [SHIFT_OPEN] Inserting X stock entries for shift [UUID]
   [SHIFT_OPEN] ✓ Successfully inserted stock entries
   ```

---

### Step 2: Admin Sees Opening Stock
**Browser 2 (Admin - http://localhost:5174)**
1. Login as admin (role: admin)
2. Go to **Admin Dashboard** → **Sales & Transactions** tab
3. Select **"Closed Shifts"** view
4. The page should show **"No closed shifts"** (correct - shift is OPEN, not closed)
5. **Change view to "Stock Management"** and select **"By Cashier"**
6. You should see the cashier card with:
   - Opening stock for all products (yesterday's closing)
   - Status badge showing shift is OPEN

---

### Step 3: Cashier Makes Sales (Optional)
**Browser 1 (Cashier)**
1. From main POS, make a sale of any product
2. Watch logs for transaction processing
3. The sale should deduct from `shift_stock_entries.sold_stock`

---

### Step 4: Cashier Closes Shift
**Browser 1 (Cashier)**
1. Go back to ShiftStock page
2. Click **"Close Shift"** button (bottom right)
3. Enter actual closing stock counts for each product
4. Click **"Confirm & Close"**
5. **Watch backend logs** - should see:
   ```
   [SHIFT_CLOSE] Closing shift [UUID] with actual_counts: {...}
   [SHIFT_CLOSE] Shift status updated: {...}
   [SHIFT_CLOSE] Updated shift_stock_entries for product [ID]: closing=X, variance=Y
   ```

---

### Step 5: Admin Sees Closed Shift (CRITICAL TEST)
**Browser 2 (Admin)**
1. **Within 10 seconds**, the admin dashboard auto-refreshes
2. Go to **"Sales & Transactions"** → **"Closed Shifts"** view
3. You should now see the cashier's closed shift card with:
   - ✓ Opening stock
   - ✓ Added stock  
   - ✓ Sold stock
   - ✓ Closing stock
   - ✓ Variance (with color: green = perfect, red = deficit, blue = surplus)
   - ✓ Status badge "PENDING_REVIEW"

---

### Expected Backend Logs Sequence

```
1. Login
   [LOGIN] ✅ Token generated, login successful for [USER_ID]

2. Cashier opens shift
   [SHIFT_OPEN] Inserting 5 stock entries for shift [UUID]
   [SHIFT_OPEN] ✓ Successfully inserted stock entries

3. Admin views closed shifts (before close)
   [CLOSED_SHIFTS] Fetching with branch_id=branch1, date=2026-02-04
   [CLOSED_SHIFTS] Raw query returned 0 entries
   [CLOSED_SHIFTS] After filtering for closed shifts: 0 entries
   [CLOSED_SHIFTS] Returning 0 closed shifts

4. Cashier closes shift
   [SHIFT_CLOSE] Closing shift [UUID] with actual_counts: {beef: 45.5, goat: 30.0, ...}
   [SHIFT_CLOSE] Shift status updated: {...}
   [SHIFT_CLOSE] Updated shift_stock_entries for product beef: closing=45.5, variance=2.1
   [SHIFT_CLOSE] Updated shift_stock_entries for product goat: closing=30.0, variance=-0.5
   ...

5. Admin views closed shifts (after close)
   [CLOSED_SHIFTS] Fetching with branch_id=branch1, date=2026-02-04
   [CLOSED_SHIFTS] Raw query returned 5 entries
   [CLOSED_SHIFTS] After filtering for closed shifts: 5 entries
   [CLOSED_SHIFTS] Returning 1 closed shifts
```

---

### Debugging Checklist

If admin doesn't see the closed shift:

- [ ] Check backend logs for "[SHIFT_CLOSE]" messages - confirm shift status changed
- [ ] Check backend logs for "[CLOSED_SHIFTS] Raw query returned X entries"
  - If 0: No shift_stock_entries were found → shift wasn't opened properly
  - If > 0: Data exists → check filtering logic
- [ ] Verify date in admin matches shift_date in logs
- [ ] Try refreshing admin page manually (don't rely on auto-refresh)
- [ ] Check Supabase dashboard → shift_stock_entries table → should have rows with matching shift_id

---

### What This Proves (If All Working)

✅ **Real-Time System Confirmed** when you see:
1. Cashier opens → Instantly creates shift_stock_entries
2. Cashier closes → Instantly updates shift status & closing_stock
3. Admin refreshes → Instantly sees the new closed shift with variance
4. All data flows from cashier → database → admin without manual intervention

This = **TRUE REAL-TIME POS SYSTEM**, not mock data!
