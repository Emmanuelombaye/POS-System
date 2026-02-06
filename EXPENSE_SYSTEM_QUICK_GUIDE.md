# 🎯 EXPENSE SYSTEM - QUICK REFERENCE & USAGE GUIDE

**Last Updated**: February 6, 2026  
**Status**: ✅ Live & Ready

---

## 🚀 QUICK START

### For Cashiers

#### Add Expense (During Shift)
```
1. Look for 💰 "Expense" button on top right
2. Click it → Modal opens
3. Fill in:
   - Amount: e.g., 500
   - Category: Choose from dropdown (Transport, Packaging, Repairs, Food, Supplies, Other)
   - Payment: 💰 Cash or 📱 M-Pesa
   - Description: Optional notes
4. Click "Add Expense"
5. ✅ Done! Balance automatically reduced
```

#### Close Shift with Expenses
```
1. Click "Close Shift" button
2. In modal, scroll to 💳 "Add Expenses" section
3. Add expenses:
   - Choose category
   - Enter amount
   - Select payment method
   - Click "+ Add Expense"
4. View expense list (delete if needed)
5. See "After expenses: KES X,XXX" for cash & mpesa
6. Confirm cash/mpesa actual totals
7. Click "Confirm & Close"
8. ✅ Done! All expenses saved automatically
```

---

### For Admin

#### View Expense Analytics
```
1. Go to Dashboard → Click "EXPENSES" tab
2. See 4 KPI cards:
   - Total Expenses: All money spent
   - Cash Expenses: Cash payments with %
   - Approved: Ready for records
   - Pending: Awaiting approval
3. Analyze charts:
   - Pie: Breakdown by category
   - Line: Daily trend
4. Review table: Last 20 expenses
5. Use date filter: Today / 7 Days / 30 Days
```

#### Filter & Analyze
```
- Date range picker (select custom dates)
- See which cashier spends most
- Identify high expenses (>1000 KES)
- Track payment method distribution
- Monitor category trends
```

---

## 💼 BUSINESS RULES

### What You Can Do
✅ Add expense during open shift  
✅ Add multiple expenses in closing modal  
✅ View your own expenses (cashier)  
✅ See all expenses (admin)  
✅ Delete expense before shift closes  
✅ Edit expense details  
✅ Approve/reject (admin only)  

### What You Cannot Do
❌ Add expense to closed shift  
❌ Delete approved expense  
❌ Enter negative amount  
❌ Add expense for someone else (unless admin)  

---

## 🔢 REAL WORLD EXAMPLE

### Scenario: Alice's Tuesday Shift

**Morning**: Opens shift
- Expected sales cash: 10,000 KES
- Expected sales MPESA: 8,000 KES

**During Shift**:
- 10:30 AM: Adds Transport expense, 500 KES cash
- 02:00 PM: Adds Packaging expense, 200 KES MPESA
- 04:00 PM: Adds Repairs expense, 300 KES cash

**Closing Shift**:
```
📦 STOCK IMPACT
- Sold 10kg meat @ 2,000/kg = 20,000 KES in sales
- Stock cost = 12,000 KES

💳 EXPENSES ADDED TO CLOSING MODAL
- Transport: 500 KES (cash) ✓
- Packaging: 200 KES (mpesa) ✓
- Repairs: 300 KES (cash) ✓

💰 CASH SECTION
- Sales: 10,000 KES
- Expenses: 500 + 300 = 800 KES
- After expenses: 9,200 KES
- Alice enters actual: 9,200 KES ✓ (No variance!)

📱 M-PESA SECTION
- Sales: 8,000 KES
- Expenses: 200 KES
- After expenses: 7,800 KES
- Alice enters actual: 7,800 KES ✓ (Perfect match!)

📊 FINAL CALCULATION
- Total Sales: 18,000 KES (10K cash + 8K mpesa)
- Total Expenses: 1,000 KES (800 cash + 200 mpesa)
- Stock Cost: 12,000 KES
- NET PROFIT: 18,000 - 1,000 - 12,000 = 5,000 KES ✅
```

**Next Day**: Admin reviews
```
EXPENSES TAB shows:
- Alice: 1,000 KES in expenses
- Breakdown: Transport 500, Packaging 200, Repairs 300
- All marked as pending
- Admin approves all 3 expenses ✅
```

---

## 📊 ANALYTICS INSIGHT

### KPI Cards Explained

| Card | Meaning | Usage |
|------|---------|-------|
| **Total Expenses** | All money spent in period | Budget tracking |
| **Cash Expenses** | How much was paid from cash | Cash flow analysis |
| **Approved** | Verified expenses | Official records |
| **Pending** | Awaiting approval | Workflow status |

### Charts Explained

**Pie Chart - Category Breakdown**
```
If you see: Transport 40%, Repairs 28%, Packaging 20%, Food 12%
Means: Most spending is on transport (delivery costs)
Action: Consider optimizing logistics
```

**Line Chart - Daily Trend**
```
If you see: Spikes on Fridays
Means: More expenses on busy days
Action: Prepare more cash for end-of-week expenses
```

### Table Insights

**High Expenses (Red Alerts)**
```
If 1,500 KES repair expense appears
Review: Is it legitimate? One-time or recurring?
Action: Approve if legitimate, investigate if suspicious
```

**Top Spenders**
```
If Alice has 2,000 KES in expenses, Bob has 500 KES
Question: Is Alice less efficient? Or managing higher volume?
Action: Review if needed, may be contextual
```

---

## 🔐 SECURITY & COMPLIANCE

### Data Protection
- ✅ Only you can see your expenses (cashier)
- ✅ Only admins can see all expenses
- ✅ All data encrypted in transit
- ✅ Timestamps prove when expense occurred

### Audit Trail
- Every expense has:
  - Date & time (immutable)
  - Cashier name (who added it)
  - Shift ID (which shift)
  - Amount & category (what)
  - Payment method (how paid)
  - Approval status (by whom approved)

### Financial Integrity
- Amounts validated > 0 KES
- Cannot add to closed shifts
- Cannot delete approved expenses
- Categories standardized
- Real-time reconciliation

---

## 🆘 TROUBLESHOOTING

### Problem: Cannot see "Expense" button
**Solution**: 
- Shift must be open (click "Open Shift" first)
- On mobile? Icon still visible (may be small)
- If still not visible, refresh page

### Problem: Amount won't save
**Solution**:
- Amount must be > 0
- No negative numbers allowed
- Check for decimal point issues (use 500.00)
- Try again with valid amount

### Problem: Cannot add expense during close
**Solution**:
- Shift must still be open (not fully closed yet)
- Fill in all required fields
- Category must be selected
- Amount must be valid

### Problem: Expense disappeared after deletion
**Solution**:
- Confirmed! Deletion is permanent
- Only delete by mistake, cannot undo
- Use PATCH endpoint to change instead of delete

### Problem: Expected cash doesn't match actual
**Solution**:
- Check expense calculations (after expenses: X)
- Verify you entered all expenses in modal
- Look for small transactions missed
- Create variance note in system

---

## 📈 PERFORMANCE TIPS

### For Accurate Expense Tracking
1. **Add expenses immediately** - Don't wait until end of shift
2. **Use correct category** - Transport ≠ Packaging
3. **Include description** - Notes help admin understand
4. **Verify after adding** - Check expense appears in list
5. **Review before closing** - Don't miss any expenses

### For Admin Analysis
1. **Check regularly** - Don't let pending pile up
2. **Review high expenses** - Question > 1000 KES
3. **Track patterns** - Weekly/daily trends
4. **Monitor by cashier** - Fair comparison
5. **Approve promptly** - Keep workflow moving

---

## 💡 BEST PRACTICES

### Do ✅
- ✅ Log expenses same day
- ✅ Use consistent categories
- ✅ Review variance reports
- ✅ Approve legitimate expenses
- ✅ Track high-value items
- ✅ Back up expense descriptions
- ✅ Reconcile daily

### Don't ❌
- ❌ Add fictitious expenses
- ❌ Use wrong category
- ❌ Forget to close shift with expenses
- ❌ Delete approved expenses
- ❌ Add expense to wrong shift
- ❌ Leave pending expenses forever
- ❌ Ignore variances

---

## 📱 MOBILE EXPERIENCE

### Cashier App on Phone
- 💰 "Expense" button: Always visible (icon)
- Text hidden on very small screens (icon only)
- Expense modal: Full-screen, easy to tap
- List view: Scroll to see all expenses
- Responsive: Works on any phone size

### Admin App on Phone
- "EXPENSES" tab: Accessible from menu
- KPI cards: Stack vertically
- Charts: Responsive sizing
- Table: Horizontal scroll for columns
- Filters: Easily accessible

---

## 🎯 MONTHLY CHECKLIST

**Week 1**:
- [ ] Review all pending expenses
- [ ] Approve legitimate expenses
- [ ] Investigate high expenses

**Week 2**:
- [ ] Analyze category breakdown
- [ ] Check for patterns
- [ ] Compare to previous months

**Week 3**:
- [ ] Review top spenders
- [ ] Verify accuracy with receipts
- [ ] Prepare for closing

**Week 4**:
- [ ] Monthly summary
- [ ] Profit analysis
- [ ] Budget vs actual
- [ ] Plan next month

---

## 📞 SUPPORT CONTACTS

**System**: Eden Drop 001 POS  
**Feature**: Expense Tracking v1.0  
**Status**: Production Ready  

**For Issues**:
1. Check this guide first
2. Verify servers running (4000 & 5173)
3. Clear browser cache
4. Try again or escalate

---

## 🎓 EXAMPLE SCENARIOS

### Scenario 1: Delivery Expense
```
Alice goes to supplier, spends 2,000 KES cash on meat delivery
- Amount: 2000
- Category: Transport
- Payment: Cash
- Description: Meat delivery from supplier
✅ Immediate balance reduction
```

### Scenario 2: Equipment Repair
```
Machine breaks, costs 3,500 KES to repair
- Amount: 3500
- Category: Repairs
- Payment: MPESA (paid vendor)
- Description: Freezer compressor repair
✅ MPESA balance adjusted
```

### Scenario 3: Food & Supplies
```
Cashier buys lunch for team, 500 KES
- Amount: 500
- Category: Food
- Payment: Cash
- Description: Lunch for team
✅ Recorded in system
```

### Scenario 4: Unexpected Cost
```
Packaging materials needed, 1,200 KES
- Amount: 1200
- Category: Packaging
- Payment: Cash
- Description: Urgent packaging stock (50 boxes)
✅ Deducted from daily expected cash
```

---

## 🔗 QUICK LINKS

- **Backend API**: http://localhost:4000
- **Frontend App**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Cashier Panel**: http://localhost:5173/cashier

---

**Remember**: Accurate expense tracking = Accurate profit = Better business decisions! 📊

