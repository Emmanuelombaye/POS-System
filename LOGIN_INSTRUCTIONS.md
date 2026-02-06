# LOGIN FIX GUIDE - Step by Step

## Current Status
✅ Backend authentication system is implemented with security features
✅ Frontend login page with role and branch selection is ready  
✅ Database schema is created
❌ Users table is empty (needs to be populated)

---

## CRITICAL STEP 1: Populate Database with Users

### Option A: Using Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com
2. Click your project: **glskbegsmdrylrhczpyy**
3. Go to **SQL Editor** tab on the left
4. Click **+ New Query**
5. Open `SETUP_DATABASE.sql` from this project root folder
6. Copy ALL the content
7. Paste into the Supabase SQL Editor
8. Click **Run** (blue button)
9. Wait for confirmation message

### Option B: Using Terminal (Alternative)
```bash
# Run the setup SQL via supabase CLI
supabase db push --db-url="postgresql://postgres:YOUR_PASSWORD@glskbegsmdrylrhczpyy.supabase.co:5432/postgres"
```

---

## CRITICAL STEP 2: Verify Users Were Created

In Supabase SQL Editor, run:
```sql
SELECT id, name, role FROM public.users ORDER BY id;
```

You should see 5 users:
- **a1** | Admin Eden | admin
- **m1** | Manager John | manager  
- **c1** | Cashier David | cashier
- **c2** | Cashier Mary | cashier
- **c3** | Cashier Peter | cashier

---

## STEP 3: Start Backend Server

Open a terminal in the `server/` folder:
```bash
npm run dev
```

Expected output:
```
Eden Drop 001 backend listening on port 4000
```

---

## STEP 4: Start Frontend Server

Open another terminal in the root folder:
```bash
npm run dev
```

Expected output:
```
VITE v... ready in 123 ms
➜  Local:   http://localhost:5174
```

---

## STEP 5: Test Login in Browser

1. Go to http://localhost:5174
2. You should see the Login Page
3. Fill in:
   - **Role**: Admin, Manager, or Cashier
   - **User ID**: a1 (admin), m1 (manager), or c1/c2/c3 (cashier)
   - **Password**: @AdminEdenDrop001
   - **Branch** (Cashiers only): Select any branch (branch1, branch2, branch3)
4. Click **Sign In**

---

## Expected Results

### If login succeeds:
- ✅ Token stored in localStorage
- ✅ Redirected to appropriate dashboard:
  - **Admin** → Admin Dashboard with 8 tabs
  - **Manager** → Manager Dashboard
  - **Cashier** → Modern POS Terminal

### If login fails:
1. Check browser console (F12 → Console tab) for errors
2. Check backend console for error messages
3. Verify users exist in Supabase (Step 2)
4. Try different user ID
5. Verify password is exactly: `@AdminEdenDrop001`

---

## Troubleshooting

### Issue: "User not found" error
**Solution**: Users table is empty. Complete STEP 1 (populate database)

### Issue: "Invalid password" error  
**Solution**: Password must be EXACTLY `@AdminEdenDrop001` (case-sensitive)

### Issue: Cannot reach backend (network error)
**Solution**: 
1. Verify backend is running (should see "listening on port 4000")
2. Check .env file has `VITE_API_URL=http://localhost:4000`
3. Ensure no firewall blocking port 4000

### Issue: "Too many login attempts" error
**Solution**: Wait 5-10 minutes or restart backend server

### Issue: Blank page or 404 after login
**Solution**: 
1. Frontend might not have compiled. Try `npm run dev` again
2. Check browser console for JavaScript errors
3. Hard refresh (Ctrl+Shift+R)

---

## Security Features Implemented

✅ Rate limiting: Max 5 failed attempts per user  
✅ Password validation: Exact character match  
✅ JWT tokens: 24-hour expiration  
✅ Audit logging: All logins recorded  
✅ Input validation: Type checking on userId and password  
✅ CORS: Only localhost:5175 accepted  

---

## Test Credentials

| User ID | Name | Role | Branch | Password |
|---------|------|------|--------|----------|
| a1 | Admin Eden | Admin | N/A | @AdminEdenDrop001 |
| m1 | Manager John | Manager | N/A | @AdminEdenDrop001 |
| c1 | Cashier David | Cashier | Any | @AdminEdenDrop001 |
| c2 | Cashier Mary | Cashier | Any | @AdminEdenDrop001 |
| c3 | Cashier Peter | Cashier | Any | @AdminEdenDrop001 |

---

## Debug Commands

Check backend health:
```bash
curl http://localhost:4000/health
```

Test login manually:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"a1","password":"@AdminEdenDrop001"}'
```

Check users in database:
```bash
# In Supabase SQL Editor
SELECT COUNT(*) FROM public.users;
```

---

## Next Steps After Login Works

1. ✅ Test each user role (Admin, Manager, Cashier)
2. ✅ Test branch selection for cashiers
3. ✅ Verify dashboards load without errors
4. ✅ Test POS transactions (if you reach cashier dashboard)
5. ✅ Check audit logs in admin panel

---

## Questions?

Review the technical implementation in:
- Frontend login: `src/pages/auth/LoginPage.tsx`
- Backend auth: `server/src/index.ts` (lines 45-120)
- State management: `src/store/appStore.ts` (login function around line 253)
- API client: `src/utils/api.ts`
