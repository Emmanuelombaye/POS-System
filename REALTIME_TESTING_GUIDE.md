# Real-Time Transaction Aggregation - Testing Guide

## ✅ What Was Implemented

Your system now has **automatic real-time aggregation** of cashier transactions in the Wholesale/Market section:

### Key Features:
1. **Automatic Aggregation**: All cashier sales are automatically summed by branch and payment method
2. **Real-Time Updates**: Admin dashboard updates every 10 seconds + instant updates via Supabase subscriptions
3. **Cash vs M-Pesa Separation**: Clearly shows totals for each payment method
4. **Source Breakdown**: Shows which amounts came from actual sales vs manual entries

---

## 🚀 Step 1: Setup Database

**Run this SQL script in Supabase SQL Editor:**

```bash
# Navigate to Supabase Dashboard → SQL Editor
# Copy and paste the contents of SCRIPT_05_WHOLESALE_SUMMARIES.sql
# Click "Run"
```

The script will:
- Create `wholesale_summaries` table with UUID support
- Set up Row Level Security (RLS) policies
- Add sample data for testing
- Create necessary indexes

---

## 🧪 Step 2: Test Real-Time Aggregation

### Test Scenario A: Branch 1 Cash Sales

1. **Login as Cashier** (branch_id = 1)
   - Username: `cashier1` or `cashier1@example.com`
   - Password: `password123`

2. **Complete a Cash Sale**:
   - Go to Cashier Dashboard
   - Add items to cart
   - Select payment method: **Cash**
   - Complete the transaction
   - **Note the amount** (e.g., KES 500)

3. **Check Admin Dashboard**:
   - Login as Admin: `admin@example.com` / `admin123`
   - Go to Wholesale/Market section
   - Look for **Branch 1** card
   - **Expected Result**: You should see:
     - Total Cash: **includes your KES 500**
     - Breakdown showing: "From Sales (Cash): 500"

---

### Test Scenario B: Branch 1 M-Pesa Sales

1. **Still logged in as Cashier** (branch_id = 1)

2. **Complete an M-Pesa Sale**:
   - Add items to cart
   - Select payment method: **M-Pesa**
   - Complete the transaction
   - **Note the amount** (e.g., KES 750)

3. **Check Admin Dashboard**:
   - Refresh or wait 10 seconds for auto-update
   - Look for **Branch 1** card
   - **Expected Result**: You should see:
     - Total Cash: **KES 500** (from previous sale)
     - Total M-Pesa: **KES 750** (from this sale)
     - Breakdown showing:
       - "From Sales (Cash): 500"
       - "From Sales (M-Pesa): 750"

---

### Test Scenario C: Multiple Branches

1. **Login as Branch 2 Cashier**:
   - Username: `cashier2` or another cashier with branch_id = 2
   - Complete a sale (Cash: KES 300)

2. **Login as Branch 3 Cashier**:
   - Username: `cashier3` or another cashier with branch_id = 3
   - Complete a sale (M-Pesa: KES 900)

3. **Check Admin Dashboard**:
   - **Expected Result**: You should see THREE separate cards:
     - **Branch 1**: Cash 500 + M-Pesa 750
     - **Branch 2**: Cash 300
     - **Branch 3**: M-Pesa 900

---

### Test Scenario D: Real-Time Updates

1. **Open Admin Dashboard in Browser 1**
   - Login as admin
   - Navigate to Wholesale/Market
   - Keep this tab open

2. **Open Cashier Dashboard in Browser 2**
   - Login as cashier
   - Complete a sale

3. **Watch Browser 1 (Admin)**:
   - **Expected Result**: Within 10 seconds, the totals should update automatically
   - You might see the update instantly if Supabase real-time fires quickly

---

## 📊 What You Should See in Admin Dashboard

### Before Any Sales Today:
```
📍 Branch 1
Total M-Pesa: KES 0
Total Cash: KES 0
(No breakdown shown since no sales)
```

### After KES 500 Cash Sale:
```
📍 Branch 1
Total M-Pesa: KES 0
Total Cash: KES 500
└─ From Sales (Cash): 500
```

### After Adding KES 750 M-Pesa Sale:
```
📍 Branch 1
Total M-Pesa: KES 750
Total Cash: KES 500
├─ From Sales (Cash): 500
└─ From Sales (M-Pesa): 750
```

### If You Also Add Manual Entry (KES 1000 Cash):
```
📍 Branch 1
Total M-Pesa: KES 750
Total Cash: KES 1,500
├─ From Sales (Cash): 500
├─ Manual Entry (Cash): 1,000
└─ From Sales (M-Pesa): 750
```

---

## 🔍 Troubleshooting

### Issue: "No summaries found"
**Solution**: This is normal if no transactions happened today. Complete at least one sale.

### Issue: Amounts not updating
**Check**:
1. Make sure cashier is logged in with correct branch_id
2. Verify transaction was saved (check Supabase → transactions table)
3. Wait 10 seconds for auto-refresh
4. Check browser console for errors

### Issue: "Failed to fetch summaries"
**Solution**: 
1. Make sure backend server is running on port 4000
2. Check you ran SCRIPT_05_WHOLESALE_SUMMARIES.sql
3. Verify JWT token is valid (not expired)

### Issue: Wrong branch showing
**Check**:
1. Cashier's `branch_id` in users table (1, 2, or 3)
2. Transaction's `branch_id` field matches cashier's branch
3. Backend aggregation logic maps: 1→"Branch 1", 2→"Branch 2", 3→"Branch 3"

---

## 🛠️ Technical Details

### How It Works:

1. **Cashier completes sale** → Saves to `transactions` table with:
   - `branch_id` (1, 2, or 3)
   - `payment_method` ("cash" or "mpesa")
   - `total_amount`

2. **Backend aggregates on-demand**:
   - When admin fetches `/api/wholesale-summaries/realtime?date=2024-01-15`
   - Backend queries all transactions for that date
   - Groups by branch_id and payment_method
   - Sums amounts: `cash_total` and `mpesa_total`
   - Merges with any manual `wholesale_summaries` entries

3. **Frontend displays results**:
   - Shows total cash and total M-Pesa per branch
   - Breakdown shows: amounts from transactions vs manual entries
   - Auto-refreshes every 10 seconds
   - Subscribes to real-time changes via Supabase

### Data Flow:
```
Cashier Sale → transactions table
                     ↓
                Supabase trigger
                     ↓
             Real-time subscription → Frontend refreshes
                     ↓
     Backend aggregates on next fetch
                     ↓
          Admin sees updated totals
```

---

## ✅ Success Criteria

Your real-time aggregation is working correctly when:

1. ✅ Cashier completes cash sale → Admin sees cash total increase
2. ✅ Cashier completes M-Pesa sale → Admin sees M-Pesa total increase
3. ✅ Updates happen within 10 seconds (or instantly)
4. ✅ Each branch shows separately (Branch 1, 2, 3)
5. ✅ Breakdown clearly shows "From Sales" amounts
6. ✅ Manual entries (if any) show separately from transaction amounts

---

## 📝 Next Steps After Testing

1. **If everything works**: You're ready to deploy! 🎉
2. **If issues found**: Check the Troubleshooting section above
3. **Before deployment**: Run through all test scenarios one more time

---

## 🚀 Quick Test Commands

```bash
# Start backend server
cd server
npm run dev

# In another terminal, start frontend
npm run dev

# Login credentials:
Admin: admin@example.com / admin123
Cashier1: cashier1@example.com / password123
Cashier2: cashier2@example.com / password123
```

---

**Remember**: The system aggregates transactions automatically. You don't need to manually enter totals anymore - just complete sales as a cashier, and admin will see the totals in real-time!
