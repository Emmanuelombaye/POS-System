# Persistent Shift Testing Guide

## Quick Test Commands

### Terminal 1: Start Backend
```bash
cd c:\Users\Antidote\Desktop\ceopos\server
npm run dev
```

### Terminal 2: Start Frontend
```bash
cd c:\Users\Antidote\Desktop\ceopos
npm run dev
```

## Test Scenario 1: Fresh Shift Start

**Objective:** Verify normal shift start flow still works

**Steps:**
1. Open browser to `http://localhost:5173`
2. Login as **alice@test.com** / **password123**
3. Should see "Start Your Shift" screen
4. Click "Start Shift"
5. Should enter active shift workflow with products list

**Expected Result:** ✅ "Start Shift" → Active workflow

---

## Test Scenario 2: Shift Restoration After Logout

**Objective:** Verify shift persists and restores after logout

**Steps:**
1. Open browser to `http://localhost:5173`
2. Login as **bob@test.com** / **password123**
3. Click "Start Shift" 
4. Wait for shift to load (see products)
5. **LOGOUT** (click logout button)
6. See login screen
7. **LOGIN again** with **bob@test.com** / **password123**
8. Watch the "Checking Shift Status..." screen
9. Should automatically enter the same shift WITHOUT showing "Start Shift" button

**Expected Result:** ✅ Shift automatically restored after login

**What Changed:**
- First login: "Start Shift" screen → Click button → Enter shift
- Second login: "Checking Shift Status..." → Automatically enters shift

---

## Test Scenario 3: Add Sales and Restore

**Objective:** Verify transaction data persists across logout

**Steps:**
1. Login as **carol@test.com** / **password123**
2. Start a new shift
3. Add some sales (e.g., 2kg Beef Chuck)
4. Check that sale appears in cart
5. **LOGOUT**
6. **LOGIN** with same credentials
7. Shift should restore with the same transaction showing

**Expected Result:** ✅ Sales persisted in shift after logout

---

## Test Scenario 4: Close Shift Properly

**Objective:** Verify closed shifts don't auto-restore

**Steps:**
1. Login with **alice@test.com** / **password123**
2. If shift already open, close it first
3. Start a new shift
4. Add at least one sale
5. Click "Close Shift"
6. Enter closing amounts (cash/M-Pesa)
7. Click "Confirm Close"
8. See "Shift Closed" confirmation screen
9. **LOGOUT**
10. **LOGIN** again
11. Should show "Start Your Shift" screen (NOT restore the closed shift)

**Expected Result:** ✅ Closed shifts don't restore, can start new shift

---

## Test Scenario 5: Prevent Duplicate Open Shifts

**Objective:** Verify user can't accidentally create multiple open shifts

**Steps:**
1. User Alice opens a shift
2. Logout
3. Logout doesn't close her shift (it stays open in DB)
4. Login with Alice again
5. Shift should auto-restore
6. "Start Shift" button should NOT be visible
7. Alice is forced to continue with existing shift or close it
8. Only after closing can she start a new shift

**Expected Result:** ✅ Can't open multiple shifts simultaneously

---

## Test Scenario 6: Admin Dashboard Sees Active Shifts

**Objective:** Verify admin sees restored shifts in dashboard

**Steps:**
1. Login as **alice@test.com**, start a shift
2. Add some sales
3. Logout
4. Login as **admin@test.com** / **password123**
5. Go to Admin Dashboard
6. Should see Alice's shift listed under "Active Shifts"
7. Dashboard refreshes every 5 seconds - numbers should update

**Expected Result:** ✅ Admin sees all active shifts (including restored ones)

---

## Test Scenario 7: Browser Refresh During Shift

**Objective:** Verify shift survives page refresh

**Steps:**
1. Login and start a shift
2. Add several sales
3. Press **F5** or **Ctrl+R** to refresh page
4. Watch "Checking Shift Status..." screen
5. Should restore to same shift with same sales

**Expected Result:** ✅ Shift survives browser refresh

---

## Test Scenario 8: Network Error Handling

**Objective:** Verify graceful fallback if API is down

**Steps:**
1. Stop the backend server (Ctrl+C in backend terminal)
2. Login to frontend
3. Watch the "Checking Shift Status..." screen
4. Should timeout and show "Start Your Shift" (safe fallback)

**Expected Result:** ✅ Graceful error handling, doesn't crash

---

## Test Scenario 9: Multiple Users Simultaneous Sessions

**Objective:** Verify each user's shift is independent

**Steps:**
1. Open two browser windows (or incognito windows)
2. In Window 1: Login as **alice@test.com**, start shift, add sales
3. In Window 2: Login as **bob@test.com**, start shift, add different sales
4. Window 1 should show Alice's shift + sales
5. Window 2 should show Bob's shift + different sales
6. Logout/login both windows
7. Each should restore their own correct shift

**Expected Result:** ✅ Each user has independent persistent shift

---

## Test Scenario 10: Loading State UI

**Objective:** Verify initialization screen shows correctly

**Steps:**
1. Have an open shift in the database
2. Open DevTools (F12)
3. Go to Network tab
4. Throttle to "Slow 3G" (simulates slow connection)
5. Login with cashier that has open shift
6. Watch for "Checking Shift Status..." screen with spinner
7. Should show for ~2-3 seconds while loading
8. Then transitions to active shift

**Expected Result:** ✅ Loading screen visible, then smooth transition

---

## Debugging Checklist

### If shift doesn't restore:

**Check 1: Backend Running?**
```bash
curl http://localhost:4000/api/shifts -H "Authorization: Bearer test"
```
Should not give "ECONNREFUSED"

**Check 2: Shift in Database?**
```sql
SELECT * FROM shifts WHERE status = 'open';
```
Should show the shift

**Check 3: Correct Endpoint Called?**
```
Browser DevTools → Network tab
Look for: GET /api/shifts/active/{cashier_id}
Status should be 200 (not 404 or 500)
```

**Check 4: Token Valid?**
```
localStorage.getItem('token')
```
Should return a JWT token

**Check 5: Console Errors?**
```
Browser DevTools → Console
Look for: [Shift Restored] or [Error checking for active shift]
```

---

## Performance Testing

### Initialization Speed
- Note the time from login to seeing active shift
- Should be < 500ms total
- "Checking Shift Status" screen typically shows for 300-400ms

### Polling Updates
- After shift is active, updates should happen every 5 seconds
- Open DevTools Network tab
- Look for GET requests to `/api/shifts/active/{cashier_id}`
- Should see one every 5 seconds

### Database Load
- Multiple shifts open simultaneously should not cause slowdown
- Dashboard should update in <1 second even with 5+ open shifts

---

## Rollback Plan (If Issues Found)

If you need to revert the changes:

1. **Restore Original File:**
   ```bash
   git checkout src/pages/cashier/CashierShiftWorkflow.tsx
   ```

2. **Clear Browser Cache:**
   - Ctrl+Shift+Delete
   - Clear all data

3. **Restart Services:**
   - Kill backend: Ctrl+C
   - Kill frontend: Ctrl+C
   - Run `npm run dev` again

---

## Success Criteria

All scenarios should result in:

✅ Shift persists in database across logout/login
✅ No "Start Shift" button when shift is already open
✅ Seamless restoration with all data intact
✅ Admin can see all active shifts
✅ Only one open shift per cashier at a time
✅ Closed shifts don't auto-restore
✅ Works with browser refresh
✅ Graceful error handling if backend down
✅ Each user has independent shift state
✅ Performance < 500ms initialization

---

## Notes

- Test data from `SCRIPT_01_SEED_USERS_PRODUCTS.sql` is used
- Passwords are all "password123"
- Make sure backend and frontend are both running
- Check browser console for detailed logs (messages start with `[Shift Restored]` or `[Error checking for active shift]`)
