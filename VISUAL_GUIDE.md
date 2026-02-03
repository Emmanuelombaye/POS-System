# 🎬 STEP-BY-STEP VISUAL GUIDE

## PART 1: Prepare Database (Do This First!)

### Step 1: Go to Supabase
```
1. Open your browser
2. Go to: https://app.supabase.com
3. Login if needed
4. You should see your project: "eden-top"
```

### Step 2: Click SQL Editor
```
Left sidebar:
├─ Home
├─ Editor
├─ SQL Editor ← CLICK HERE
├─ Webhooks
└─ ...

Or search for "SQL Editor" in the search box
```

### Step 3: Create New Query
```
Look for:
  [+ New Query] button in top right
  
Click it.
```

### Step 4: Open Setup File
```
You should have this file in your folder:
  SETUP_DATABASE.sql

Open it with a text editor (Notepad, VS Code, etc)
```

### Step 5: Copy Everything
```
In SETUP_DATABASE.sql:
1. Press: Ctrl+A (select all)
2. Press: Ctrl+C (copy)
```

### Step 6: Paste into Supabase
```
In Supabase SQL Editor (the blank text area):
1. Click in the text area
2. Press: Ctrl+V (paste)
3. You should see lots of SQL code appear
```

### Step 7: Run the SQL
```
Look for:
  [Run] button (blue, in top right corner)
  
Click it.

Wait for: ✅ Success message at bottom
           (usually takes 5-10 seconds)
```

### Step 8: Verify Users Created
```
In a new SQL query, run:
SELECT id, name, role FROM public.users;

You should see:
  a1  | Admin Eden    | admin
  m1  | Manager John  | manager
  c1  | Cashier David | cashier
  c2  | Cashier Mary  | cashier
  c3  | Cashier Peter | cashier
```

✅ **Database is Ready!**

---

## PART 2: Login to System (Do This Second!)

### Step 1: Open Browser Tab
```
Open a new browser tab
Go to: http://localhost:5175

You should see a LOGIN PAGE
(with a burgundy color scheme)
```

### Step 2: Select Role
```
You'll see three buttons at the top:
  [Admin] [Manager] [Cashier]

Click: [Admin]
(The button should highlight in burgundy)
```

### Step 3: Select User
```
You'll see a dropdown with users:
  ├─ a1 - Admin Eden
  ├─ m1 - Manager John
  ├─ c1 - Cashier David
  ├─ c2 - Cashier Mary
  └─ c3 - Cashier Peter

Click on: a1 - Admin Eden
(Since we selected Admin role above)
```

### Step 4: Enter Password
```
You'll see a password field:
  [•••••••••••]

Type: @AdminEdenTop
(Must be exactly this, including the @ symbol)
```

### Step 5: Click Sign In
```
You'll see a button:
  [Sign In]

Click it.

Wait for the page to load...
```

### Step 6: You're In! 🎉
```
You should see:

  ADMIN DASHBOARD

With tabs:
  Overview | Users | Branches | Products | Sales | Analytics | Settings | Audit

If you see this, you've successfully logged in!
```

---

## PART 3: Test Different Roles (Optional)

### Try Manager Login
```
1. Go to: http://localhost:5175
2. Select: Manager role
3. Select: m1 - Manager John
4. Password: @AdminEdenTop
5. Click: Sign In
6. You should see: Manager Dashboard
```

### Try Cashier Login
```
1. Go to: http://localhost:5175
2. Select: Cashier role
3. Select: c1 - Cashier David
4. Password: @AdminEdenTop
5. Select Branch: Branch 1 (or any branch)
6. Click: Sign In
7. You should see: POS Terminal with product categories
```

---

## 🆘 If Something Goes Wrong

### Error: "User not found"
```
Solution:
1. Go back to PART 1
2. Make sure SETUP_DATABASE.sql was run successfully
3. Try again
```

### Error: "Invalid password"
```
Check:
- You typed: @AdminEdenTop
- With the @ symbol
- Exact spelling (case-sensitive)
```

### Error: "Can't reach http://localhost:5175"
```
Make sure:
1. You're in the project root folder
2. You ran: npm run dev
3. You see: "Local: http://localhost:5175"
4. Try a different port if 5175 is busy (5176, 5177)
```

### Error: "Backend not responding"
```
Make sure:
1. Backend server is running
2. In server/ folder, run: npm run dev
3. You see: "listening on port 4000"
```

### Blank Page After Login
```
Solution:
1. Press: Ctrl+Shift+R (hard refresh)
2. Or close and reopen the browser tab
3. Or clear browser cache
```

---

## 📋 Summary of Clicks

### To Setup Database:
```
1. https://app.supabase.com
2. Click: SQL Editor
3. Click: + New Query
4. Paste: SETUP_DATABASE.sql content
5. Click: Run
6. ✅ Done!
```

### To Login:
```
1. http://localhost:5175
2. Click: [Admin] button
3. Click: a1 dropdown
4. Type: @AdminEdenTop
5. Click: [Sign In]
6. ✅ You're in!
```

### That's it! 🎉

---

## 📸 Screenshots Guide

### Login Page Should Look Like:
```
┌─────────────────────────────────────┐
│       EDEN TOP - LOGIN               │
│                                      │
│  Select Your Role:                  │
│  [Admin]  [Manager]  [Cashier]     │
│                                      │
│  Select User:                       │
│  [Dropdown: a1 - Admin Eden]        │
│                                      │
│  Password:                          │
│  [••••••••••••]                     │
│                                      │
│  [Sign In]  [Clear]                 │
│                                      │
│  (Burgundy color scheme)             │
└─────────────────────────────────────┘
```

### Admin Dashboard Should Look Like:
```
┌─────────────────────────────────────┐
│  EDEN TOP - ADMIN DASHBOARD          │
│                                      │
│  [Overview][Users][Branches]...      │
│  ────────────────────────────        │
│                                      │
│  Overview Tab:                       │
│  ┌────────────────────────────────┐ │
│  │ Revenue    Branches   Users     │ │
│  │ 450,000    3          8         │ │
│  │                                  │ │
│  │ Products   Today      This Month │ │
│  │ 48         15,200     450,000    │ │
│  └────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### Cashier POS Should Look Like:
```
┌──────────────────────────────────────┐
│  CASHIER TERMINAL                     │
│  Branch: Branch 1      Cashier: David │
│                                       │
│  [Beef] [Goat] [Offal] [Processed]   │
│                                       │
│  Products:           │  Cart:        │
│  ┌─────────────────┐ │ ┌──────────┐  │
│  │ Beef Cuts  1250 │ │ │ Total:   │  │
│  │ Goat Mix    950 │ │ │ 8,500    │  │
│  │ Beef Liver  450 │ │ │          │  │
│  │ Minced Beef 750 │ │ │ Items: 3 │  │
│  │               … │ │ │          │  │
│  └─────────────────┘ │ │ Payment: │  │
│                      │ │ [Cash]   │  │
│  [Calculate] [Charge]│ │[Complete]│  │
│                      │ └──────────┘  │
└──────────────────────────────────────┘
```

---

## ⏱️ Expected Times

| Step | Estimated Time | What You're Waiting For |
|------|---|---|
| SETUP_DATABASE.sql | 1-2 minutes | Supabase to process SQL |
| Login page load | 1-2 seconds | Browser to render |
| Login process | 1-2 seconds | Backend authentication |
| Dashboard load | 2-3 seconds | Frontend to render tabs |
| **TOTAL** | **~5 minutes** | **You're in!** |

---

## ✅ Final Verification

After you see the Admin Dashboard:

- [ ] Page title shows "EDEN TOP"
- [ ] You can see the dashboard tabs
- [ ] Tabs are clickable
- [ ] Each tab shows content
- [ ] No error messages
- [ ] Browser shows "localhost:5175"

If all checked: **Congratulations! System is working!** 🎉

---

## 🎯 Ready?

**Start with:**
1. Open SETUP_DATABASE.sql
2. Go to https://app.supabase.com
3. Follow the steps above
4. Then login at http://localhost:5175

**Good luck!** 🚀
