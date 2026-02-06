# ✅ SYSTEM VERIFICATION CHECKLIST

Use this checklist to verify your Eden Drop 001 POS system is ready to use.

---

## Phase 1: Backend Setup

- [ ] **Backend is running**
  - Open terminal in `server/` folder
  - Run: `npm run dev`
  - Should see: "Eden Drop 001 backend listening on port 4000"
  - Should see: "Successfully connected to Supabase database"

- [ ] **Backend is accessible**
  - Open PowerShell and run:
    ```powershell
    Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing
    ```
  - Should see status code: 200
  - Should see response: `{"status":"ok","service":"eden-top-backend","database":"supabase"}`

---

## Phase 2: Database Setup

- [ ] **SETUP_DATABASE.sql executed**
  - Go to: https://app.supabase.com
  - Select project: eden-top
  - Click: SQL Editor → + New Query
  - Copy content from SETUP_DATABASE.sql
  - Run the SQL
  - Wait for success message

- [ ] **Users were created**
  - In Supabase SQL Editor, run:
    ```sql
    SELECT COUNT(*) FROM public.users;
    ```
  - Should return: 5

- [ ] **Products were created**
  - In Supabase SQL Editor, run:
    ```sql
    SELECT COUNT(*) FROM public.products;
    ```
  - Should return: 4

- [ ] **Verify user data**
  - In Supabase SQL Editor, run:
    ```sql
    SELECT id, name, role FROM public.users ORDER BY id;
    ```
  - Should show:
    ```
    a1 | Admin Eden    | admin
    m1 | Manager John  | manager
    c1 | Cashier David | cashier
    c2 | Cashier Mary  | cashier
    c3 | Cashier Peter | cashier
    ```

---

## Phase 3: Frontend Setup

- [ ] **Frontend is running**
  - Open terminal in root folder
  - Run: `npm run dev`
  - Should see: `Local: http://localhost:5175` or `http://localhost:5176`

- [ ] **Frontend is accessible**
  - Open browser: http://localhost:5175 (or 5176)
  - Should see: Login Page with:
    - Role selector (Admin, Manager, Cashier)
    - User ID input
    - Password input
    - Submit button

- [ ] **Frontend is styled**
  - Login page should have burgundy color scheme
  - Should be responsive and modern-looking
  - Should have no console errors (F12 to check)

---

## Phase 4: Login Testing

- [ ] **Admin login works**
  - Go to: http://localhost:5175
  - Fill in:
    - Role: Admin
    - User ID: a1
    - Password: @AdminEdenDrop001
  - Click "Sign In"
  - Expected: Redirect to Admin Dashboard
  - Expected: URL changes to http://localhost:5175/admin

- [ ] **Manager login works**
  - Go to: http://localhost:5175
  - Fill in:
    - Role: Manager
    - User ID: m1
    - Password: @AdminEdenDrop001
  - Click "Sign In"
  - Expected: Redirect to Manager Dashboard
  - Expected: URL changes to http://localhost:5175/manager

- [ ] **Cashier login works**
  - Go to: http://localhost:5175
  - Fill in:
    - Role: Cashier
    - User ID: c1
    - Password: @AdminEdenDrop001
    - Branch: Branch 1 (required for cashiers)
  - Click "Sign In"
  - Expected: Redirect to Cashier Dashboard (POS Terminal)
  - Expected: URL changes to http://localhost:5175/cashier

- [ ] **Invalid password fails**
  - Try to login with password: "wrongpassword"
  - Expected: Error message shows
  - Expected: Not redirected
  - Password field should clear

- [ ] **Non-existent user fails**
  - Try to login with User ID: "invalid_user"
  - Expected: Error message "User not found"
  - Expected: Not redirected

---

## Phase 5: Dashboard Features

### Admin Dashboard
- [ ] **Overview tab visible**
  - Should show key metrics (Revenue, Branches, Users, Products)
  
- [ ] **Users tab visible**
  - Should show user list
  - Should be able to add/edit/delete users
  - Should show role badges
  
- [ ] **Branches tab visible**
  - Should show branch cards with colors
  - Should show branch statistics
  
- [ ] **Products tab visible**
  - Should show product list
  - Should have ability to manage products
  
- [ ] **Tab switching works**
  - Click each tab and verify content changes
  - Navigation smooth with animations

### Cashier Dashboard
- [ ] **POS Terminal loads**
  - Should show product categories
  - Should show color-coded buttons (Beef Red, Goat Green, etc.)
  - Should show product list
  
- [ ] **Cart system works**
  - Can click products to add to cart
  - Cart shows on right side
  - Can update quantities
  - Can remove items
  
- [ ] **Payment methods visible**
  - Should have Cash, M-Pesa, Card options
  
- [ ] **Number pad works**
  - Should allow weight input
  - Should calculate prices correctly

### Manager Dashboard
- [ ] **Manager features visible**
  - Should show manager-specific options
  - Appropriate access controls

---

## Phase 6: Security Verification

- [ ] **Token is stored**
  - Open DevTools (F12)
  - Go to: Application → Local Storage → http://localhost:5175
  - Should see: "eden-top-state" with token and user data

- [ ] **JWT token is valid**
  - Copy the token (without "Bearer ")
  - Paste into: https://jwt.io
  - Should decode successfully
  - Should show: user ID, user name, user role
  - Should show: expiration in 24 hours

- [ ] **Requests have token**
  - Open DevTools (F12)
  - Go to: Network tab
  - Make a request (e.g., click to load products)
  - Click the request
  - Go to: Headers → Request Headers
  - Should see: `Authorization: Bearer <token>`

- [ ] **Logout clears token**
  - Click logout button (if available)
  - Check localStorage (should be cleared)
  - Try to access dashboard (should redirect to login)

---

## Phase 7: API Connectivity

- [ ] **Backend can read database**
  - In a browser tab, open: http://localhost:4000/debug/users
  - Should show JSON with user count and user list
  - Should show message: "✅ Users found in database"

- [ ] **Frontend can call backend**
  - Open DevTools Console (F12 → Console)
  - After login, check console for any errors
  - Should not see: CORS errors, network errors, 404s

- [ ] **Database writes work**
  - Create a new user (if in admin panel)
  - Check Supabase: should see new user in table
  - Delete the user: should be gone from database

---

## Phase 8: Error Handling

- [ ] **Network error handled**
  - Temporarily turn off internet
  - Try to login
  - Should show: "Cannot connect to server" (or similar)
  - Should not crash

- [ ] **Rate limiting works**
  - Try to login 6 times with wrong password
  - 6th attempt should show: "Too many attempts" error
  - Wait 5-10 minutes or restart backend to try again

- [ ] **Invalid input rejected**
  - Try to login with empty User ID
  - Should show: "Please select user"
  - Should not make API call

---

## Phase 9: Performance

- [ ] **Pages load quickly**
  - Login page: < 2 seconds
  - Dashboard: < 3 seconds
  - No visible lag when clicking buttons

- [ ] **No console errors**
  - Open DevTools (F12 → Console)
  - Should see no red error messages
  - May see yellow warnings (OK)

- [ ] **No memory leaks**
  - Keep dashboard open for 5 minutes
  - Tab should stay responsive
  - No lag when clicking buttons

---

## Phase 10: Mobile Responsiveness

- [ ] **Mobile view works**
  - Open DevTools (F12 → Toggle device toolbar)
  - Set to iPhone 12 size
  - Login page should be readable
  - Buttons should be clickable

- [ ] **Touch targets are large**
  - All buttons should be at least 44x44 pixels
  - Easy to tap on phone

---

## Overall System Status

```
Frontend:          [✅] Running ✅ Connected ✅ Working
Backend:           [✅] Running ✅ Connected ✅ Working
Database:          [✅] Connected ✅ Data Present ✅ Accessible
Security:          [✅] Enabled ✅ JWT Tokens ✅ Rate Limited
Authentication:    [✅] Working ✅ 5 Users ✅ Ready
Authorization:     [✅] Configured ✅ Role-based ✅ Working
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check if port 4000 is in use. Kill process: `Get-NetTCPConnection -LocalPort 4000 \| Kill` |
| Frontend won't start | Check if port 5175 is in use. Try port 5176 instead |
| Can't reach backend | Verify: 1) Backend is running 2) No firewall blocking 3) VITE_API_URL is http://localhost:4000 |
| Users not in database | Run SETUP_DATABASE.sql in Supabase SQL Editor |
| Login fails with "User not found" | Users table is empty. Run SETUP_DATABASE.sql |
| "Too many login attempts" | Wait 5-10 minutes or restart backend server |
| Token error on dashboard | Hard refresh page (Ctrl+Shift+R) to reload with valid token |
| CORS error | Check backend CORS config allows localhost:5175 |
| Products not showing | Check products table has data. Run SETUP_DATABASE.sql |

---

## Final Verification

When all checkboxes above are checked ✅, your Eden Drop 001 POS system is:

- ✅ **Fully functional**
- ✅ **Secure**
- ✅ **Connected** (Frontend ↔ Backend ↔ Database)
- ✅ **Ready for use**
- ✅ **Ready for deployment**

---

## Next Steps

1. **Test with real data**
   - Create actual users
   - Add actual products
   - Make test transactions

2. **Customize for your business**
   - Change product names/prices
   - Update branch information
   - Configure settings

3. **Train users**
   - Show admins how to manage system
   - Train cashiers on POS terminal
   - Show managers their features

4. **Deploy to production**
   - Choose hosting (Vercel for frontend, Railway/Fly for backend)
   - Update environment variables
   - Set up SSL/HTTPS
   - Monitor performance

---

**All checks passed? Your system is ready! 🎉**

Go to http://localhost:5175 and start using Eden Top POS!
