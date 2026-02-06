# 🔄 Full System Reset - Start Fresh

## What This Does
Deletes ALL active/open shifts and clears the system for fresh start.

- ✅ Removes all open shifts
- ✅ Removes all transactions from open shifts
- ✅ Removes all stock entries from open shifts
- ✅ Keeps closed shifts for historical reference
- ✅ Allows all cashiers to start completely fresh

## How to Do It

### Step 1: Run SQL Script in Supabase
1. Go to: https://supabase.com/dashboard
2. Click your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Copy entire content of `SCRIPT_FULL_RESET_ACTIVE_SHIFTS.sql`
6. Paste into the editor
7. Click "Run" button
8. Wait for completion

You should see: `open_shifts_remaining: 0` ✅

### Step 2: Clear Browser Cache
1. Open browser DevTools: `F12`
2. Go to "Application" tab
3. Click "Local Storage" → "http://localhost:5173"
4. Right-click, select "Clear All"
5. OR in Console tab, type: `localStorage.clear()`

### Step 3: Refresh Page
1. Press `Ctrl+Shift+R` (hard refresh, not just F5)
2. You'll see fresh login page

### Step 4: Login Fresh
1. Go to http://localhost:5173
2. Login as Alice (alice@test.com / password123)
3. Should see: **"Start Your Shift"** button (no active shift)
4. Click button
5. Should create fresh shift and go to POS

## Result

| Before | After |
|--------|-------|
| Error: "You already have an active shift" | Fresh start, "Start Shift" button |
| Can't start new shift | Can start shift immediately |
| Confused state | Clean slate |

## Verification

### After Running Script
```sql
-- In Supabase, run this to verify:
SELECT COUNT(*) as open_shifts FROM shifts WHERE status = 'open';
-- Should return: 0
```

### In Browser
```
1. All users see "Start Your Shift" button
2. No errors about active shifts
3. All cashiers can create new shifts
4. Dashboard shows no "LIVE" shifts (all clean)
```

## If You Want to Keep Closed Shifts
This script ONLY deletes open shifts. All historical closed shifts are preserved for:
- Revenue reports
- Auditing
- Historical analysis

To also delete closed shifts:
```sql
DELETE FROM shifts WHERE status = 'closed';
```

(But usually you want to keep these for records!)

## Rollback/Undo
Unfortunately, deletion is permanent. If you need to restore:
1. Ask database administrator for backup restore
2. Or manually recreate test shifts via API

So be sure before running!

## Summary
✅ **Quick reset of all active shifts**
✅ **System ready for fresh testing**
✅ **All users can start new shifts**
✅ **Historical closed shifts preserved**

Go ahead and run the script! 🚀
