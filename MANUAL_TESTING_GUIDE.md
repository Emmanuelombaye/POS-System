# 🧪 Manual MVP Testing Guide

**Step-by-step walkthrough to verify Eden Drop 001 POS is working correctly** before deployment

---

## 📋 Prerequisites

1. Backend running: `npm --prefix server run dev` (port 4000)
2. Frontend running: `npm run dev` (port 5173)
3. Both connected to same Supabase database
4. Users exist in database (c1 cashier, a1 admin)

---

## 🚀 Test Suite 1: Authentication & Access Control

### Test 1.1: Cashier Login
**What it tests:** Cashier can authenticate  
**Expected:** Login successful, redirects to cashier dashboard

```
1. Navigate to http://localhost:5173
2. Enter User ID: c1
3. Enter Password: @AdminEdenDrop001
4. Click Login

✅ Should see: Cashier dashboard with product categories
✅ Should NOT see: Admin panel
```

### Test 1.2: Admin Login
**What it tests:** Admin can authenticate and see all features  
**Expected:** Login successful, redirects to admin dashboard

```
1. Navigate to http://localhost:5173
2. Enter User ID: a1
3. Enter Password: @AdminEdenDrop001
4. Click Login

✅ Should see: Admin dashboard with tabs (Overview, Users, Branches, Products, Sales, Analytics, Settings, Audit)
✅ Should see: AI Assistant panel
✅ System Online badge should be green
```

### Test 1.3: Wrong Password
**What it tests:** Invalid credentials rejected  
**Expected:** Login fails

```
1. Navigate to http://localhost:5173
2. Enter User ID: c1
3. Enter Password: wrongpassword
4. Click Login

✅ Should see: Error message "Invalid credentials"
✅ Should stay on login page
```

### Test 1.4: Non-existent User
**What it tests:** Only valid users can login  
**Expected:** Login fails

```
1. Navigate to http://localhost:5173
2. Enter User ID: invalid-user
3. Enter Password: @AdminEdenDrop001
4. Click Login

✅ Should see: Error message "User not found"
✅ Should stay on login page
```

---

## 💰 Test Suite 2: Cashier Sales & Shift Management

### Test 2.1: Open Shift
**What it tests:** Cashier can start a shift  
**Expected:** Shift opens and displays stock for today

```
1. Login as Cashier (c1)
2. Look for "Open Shift" button or panel
3. Click to open shift

✅ Should see: Shift opened message
✅ Should see: Current shift status
✅ Should see: Product list with available stock
```

### Test 2.2: Add Products to Cart
**What it tests:** Cashier can ring up products  
**Expected:** Products added with weight and price calculated

```
1. With open shift, click on a product (e.g., "Beef - Prime Cuts")
2. Enter weight: 2.5 (kg)
3. Click "Add to Cart"

✅ Should see: Product appears in cart
✅ Should show: 2.5 kg × KES 780 = KES 1,950
✅ Cart total updated
```

### Test 2.3: Remove Product from Cart
**What it tests:** Cashier can correct mistakes  
**Expected:** Product removed from cart, total recalculated

```
1. With product in cart, click trash icon on item
2. Confirm removal

✅ Should see: Product removed from cart
✅ Should see: Total recalculated
```

### Test 2.4: Apply Discount (Amount)
**What it tests:** Cashier can apply fixed discounts  
**Expected:** Discount shown, total reduced

```
1. With items in cart, enter discount: 500 (KES)
2. Select "Amount" discount type

✅ Should see: Discount applied
✅ Should see: Total reduced by 500
✅ Shows: Subtotal - Discount = Total
```

### Test 2.5: Apply Discount (Percent)
**What it tests:** Cashier can apply percentage discounts  
**Expected:** Discount calculated, total reduced

```
1. Clear cart and add new item
2. Enter discount: 10 (percent)
3. Select "Percent" discount type

✅ Should see: Discount applied
✅ Should see: Total reduced by 10%
```

### Test 2.6: Complete Sale (Cash)
**What it tests:** Cashier can finish transaction  
**Expected:** Transaction saved, cart cleared, stock updated

```
1. With items in cart:
   - 0.5 kg Beef @ KES 780/kg = KES 390
   - No discount
2. Select payment method: "Cash"
3. Click "Complete Sale" or "Checkout"

✅ Should see: Success message
✅ Should see: Transaction ID
✅ Should see: Cart cleared
✅ Should see: Stock reduced (Beef: 85kg → 84.5kg)
```

### Test 2.7: Complete Sale (M-Pesa)
**What it tests:** M-Pesa payment option works  
**Expected:** Transaction recorded with M-Pesa method

```
1. With items in cart
2. Select payment method: "M-Pesa"
3. Click "Complete Sale"

✅ Should see: Success message
✅ Should see: Transaction marked as M-Pesa in database
```

### Test 2.8: Multiple Items in One Sale
**What it tests:** Cashier can sell multiple products  
**Expected:** All items included in transaction

```
1. Add multiple items to cart:
   - Beef: 1.5 kg
   - Goat: 1.0 kg
   - Offal: 0.5 kg
2. Complete sale

✅ Should see: All items in transaction
✅ Should see: Total includes all items
✅ Stock reduced for all products
```

### Test 2.9: Add Stock to Shift
**What it tests:** Cashier can record stock additions  
**Expected:** Stock addition logged for shift

```
1. During open shift, find "Add Stock" option
2. Select product: Beef
3. Enter quantity: 10 kg
4. Enter supplier: "Local Farm"
5. Enter batch: "B-001"
6. Click Save

✅ Should see: Stock addition recorded
✅ Should see: Opening stock updated with addition
```

---

## 📊 Test Suite 3: Admin Dashboard Features

### Test 3.1: View Dashboard Overview
**What it tests:** Admin sees system status at a glance  
**Expected:** All quick stats displayed

```
1. Login as Admin (a1)
2. Click "Overview" tab

✅ Should see: Total Revenue (MTD)
✅ Should see: Active Branches (3)
✅ Should see: System Users count
✅ Should see: Products count
✅ Should see: System Online status (green)
```

### Test 3.2: View All Transactions
**What it tests:** Admin can see all cashier sales  
**Expected:** List of all transactions with details

```
1. Click "Sales" tab
2. Look for transaction list or Stock Management component

✅ Should see: Recent transactions
✅ Should see: Transaction ID, amount, payment method
✅ Should see: Real-time updates
```

### Test 3.3: View Stock Summary
**What it tests:** Admin monitors real-time stock levels  
**Expected:** Shows opening, added, sold, closing stock

```
1. In "Sales" tab, locate stock summary
2. Select date (default: today)
3. Review data

✅ Should see: Opening Stock (kg)
✅ Should see: Added Stock (kg)
✅ Should see: Sold Stock (kg)
✅ Should see: Closing Stock (kg)
✅ Should see: Individual products with their movements
✅ Updates every 10 seconds
```

### Test 3.4: View All Shifts
**What it tests:** Admin oversees shift management  
**Expected:** List of all shifts with status

```
1. Look for Shift section in Admin dashboard
2. Click or navigate to shifts

✅ Should see: All shifts listed
✅ Should see: Cashier name
✅ Should see: Shift status (OPEN, PENDING_REVIEW, APPROVED)
✅ Should see: Start time
✅ Should see: End time (if closed)
```

### Test 3.5: Approve Shift Closure
**What it tests:** Manager/Admin can review cashier counts  
**Expected:** Shift marked as APPROVED

```
1. Find a shift with status PENDING_REVIEW
2. Click to expand/view details
3. Review variance (expected vs actual)
4. Click "Approve" button

✅ Should see: Shift status changes to APPROVED
✅ Should see: Timestamp of approval
```

### Test 3.6: User Management
**What it tests:** Admin can manage staff  
**Expected:** Can create, update, delete users

```
1. Click "Users" tab
2. Click "Create New User"
3. Enter:
   - ID: test-cashier-001
   - Name: Test Cashier
   - Role: Cashier
4. Click Create

✅ Should see: User created
✅ Should see: User in list
✅ User can login with new ID

// Update user
5. Click on created user
6. Change role to Manager
7. Click Save

✅ Should see: Role updated

// Delete user
8. Click Delete button
9. Confirm deletion

✅ Should see: User removed from list
```

### Test 3.7: Product Management
**What it tests:** Admin controls product catalog  
**Expected:** Can add, edit, deactivate products

```
1. Click "Products" tab
2. Click "Add Product"
3. Enter:
   - ID: test-product
   - Name: Test Product
   - Code: TST-001
   - Category: Beef
   - Price: 500 KES/kg
   - Stock: 10 kg
4. Click Create

✅ Should see: Product created
✅ Should see: Available for cashiers

// Update price
5. Click on product
6. Change price to 550
7. Save

✅ Should see: Price updated

// Deactivate product
8. Toggle "Active" to OFF
9. Save

✅ Should see: Product marked inactive
✅ Should NOT appear in cashier's product list
```

### Test 3.8: Branch Management
**What it tests:** Admin manages multiple branches  
**Expected:** Can view and assign branches

```
1. Click "Branches" tab
2. Review list of branches

✅ Should see: Branch1, Branch2, Branch3
✅ Should see: Assigned staff

(If branch assignment available)
3. Click to assign cashier
4. Select cashier
5. Save

✅ Should see: Cashier assigned to branch
```

### Test 3.9: AI Assistant Chat (if enabled)
**What it tests:** AI can provide insights  
**Expected:** AI responds with analysis

```
1. Look for AI Assistant panel (bottom right)
2. Expand it
3. Type message: "What's our low stock alert"
4. Send message

✅ Should see: AI response
✅ Should see: Message history
✅ Should be able to close/minimize
```

### Test 3.10: Audit Logs
**What it tests:** System tracks all actions  
**Expected:** Log shows user activities

```
1. Click "Audit" tab
2. Review activity log

✅ Should see: All logins recorded
✅ Should see: Sales transactions logged
✅ Should see: User management actions
✅ Should see: Timestamps
✅ Should see: Who performed action
```

---

## 🔒 Test Suite 4: Security & Role-Based Access Control

### Test 4.1: Cashier Cannot Access Admin Features
**What it tests:** Role-based access control works  
**Expected:** Cashier can't see admin functions

```
1. Login as Cashier (c1)
2. Try to access admin URL directly: http://localhost:5173/admin

✅ Should see: Redirected to cashier dashboard
✅ Should NOT see: Admin tabs or controls
✅ Should NOT see: User management
✅ Should NOT see: Admin settings
```

### Test 4.2: Cashier Cannot Create Users
**What it tests:** API enforces role restrictions  
**Expected:** Request is denied

```
1. Login as Cashier
2. Open browser developer console
3. Try to call:
   fetch('http://localhost:4000/api/users', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({...})
   })

✅ Should see: 403 Forbidden error
✅ Should see: Error message about insufficient permissions
```

### Test 4.3: Admin Can Manage Users
**What it tests:** Admin has full access  
**Expected:** User operations succeed

```
1. Login as Admin (a1)
2. Click "Users" tab
3. Try to create/edit/delete users

✅ Should see: Operations succeed
✅ Should see: Changes reflected immediately
```

### Test 4.4: Token Validation
**What it tests:** Expired/invalid tokens rejected  
**Expected:** Unauthorized access denied

```
1. Login and get token
2. Open dev console
3. Edit localStorage to use invalid token
4. Refresh page
5. Try to access protected endpoint

✅ Should see: Error or logout
✅ Should be redirected to login
```

---

## 📈 Test Suite 5: Real-Time Data Synchronization

### Test 5.1: Cashier Sale Appears in Admin Dashboard
**What it tests:** Data flows from cashier to admin  
**Expected:** Admin sees sale in real-time or within 10 seconds

```
1. Open 2 browser windows
2. Left: Login as Cashier (c1)
3. Right: Login as Admin (a1)
4. In cashier window, complete a sale
5. In admin window, check Stock Management tab

✅ Should see: Stock updated
✅ Should see: Sold stock increased
✅ Should see: Closing stock decreased
✅ Updates within 10 seconds
```

### Test 5.2: Stock Update Reflects Across Views
**What it tests:** Stock consistent everywhere  
**Expected:** All views show same stock level

```
1. Cashier completes sale of 1 kg beef
2. Check 3 different views:
   a) Product list on cashier dashboard
   b) Stock summary in admin dashboard
   c) Product details in admin products tab

✅ All should show reduced stock
✅ Stock reduction matches quantity sold
```

### Test 5.3: New User Appears After Creation
**What it tests:** Data created by admin visible everywhere  
**Expected:** New user can login immediately

```
1. Admin creates new user: "new-cashier-001"
2. Logout admin
3. Try to login as: new-cashier-001
4. Use password: @AdminEdenDrop001

✅ Should see: Login succeeds
✅ Should see: New user can access system
```

---

## ⚠️ Test Suite 6: Error Handling & Edge Cases

### Test 6.1: Close Shift With No Sales
**What it tests:** System handles edge cases  
**Expected:** Shift closes successfully

```
1. Cashier opens shift
2. Does not complete any sales
3. Close shift
4. Confirm actual counts match opening counts

✅ Should see: Shift closes without error
✅ Should show: Zero variance
```

### Test 6.2: Sell More Than Available Stock
**What it tests:** Overstock prevention  
**Expected:** Either blocked or flagged

```
1. Check available stock: 5 kg beef
2. Try to add to cart: 10 kg beef

✅ Should either:
   a) Prevent adding more than available
   b) Allow but flag as overstock
   c) Allow with warning
```

### Test 6.3: Negative Discount
**What it tests:** Invalid input rejection  
**Expected:** Error shown

```
1. Try to apply discount: -100
2. Click apply

✅ Should see: Error message
✅ Should NOT apply negative discount
```

### Test 6.4: Zero Weight Sale
**What it tests:** Validation works  
**Expected:** Cannot complete invalid sale

```
1. Add product with 0 kg weight
2. Try to complete sale

✅ Should see: Error message
✅ Should NOT save transaction
```

### Test 6.5: Logout and Login Again
**What it tests:** Session management  
**Expected:** Can logout and login without issues

```
1. Logout from cashier
2. Login as cashier again
3. Verify state preserved (if applicable)

✅ Should see: Clean login state
✅ Should see: No previous cart data (if cleared)
✅ Should see: Fresh start
```

---

## 📝 Test Results Recording

Use this table to track your testing:

| Test # | Test Name | Expected | Result | Pass/Fail | Notes |
|--------|-----------|----------|--------|-----------|-------|
| 1.1 | Cashier Login | Login success | | | |
| 1.2 | Admin Login | Login success | | | |
| 1.3 | Wrong Password | Login fails | | | |
| 2.1 | Open Shift | Shift opens | | | |
| 2.6 | Complete Sale | Sale recorded | | | |
| 3.1 | Admin Overview | Stats display | | | |
| 3.2 | View Transactions | List shows | | | |
| 4.1 | Access Control | Cashier blocked | | | |
| 5.1 | Real-time Sync | Admin sees update | | | |
| 6.1 | Edge Cases | Handled properly | | | |

---

## ✅ Final Verification Checklist

Before deployment, confirm:

- [ ] All authentication tests pass
- [ ] All cashier features work
- [ ] All admin features work
- [ ] Real-time data sync works
- [ ] Role-based access control enforced
- [ ] Error handling works
- [ ] Edge cases handled
- [ ] No console errors
- [ ] No database errors
- [ ] Performance acceptable

---

## 🚀 Deployment Go-Ahead

**System is READY FOR DEPLOYMENT if:**
- ✅ 100% of critical tests pass
- ✅ 95%+ of important tests pass
- ✅ No critical bugs found
- ✅ Performance acceptable
- ✅ Admin trained and comfortable

**Status:** Ready to deploy when above conditions met

---

**Test Completed By:** ________________  
**Date:** ________________  
**Sign-Off:** ________________
