# 🚨 FIX: API Proxy 404 Error - SOLUTION

## The Problem

You're seeing `404 Not Found` errors on API calls like:
```
GET http://localhost:5173/api/shifts/active/user-cashier-002
```

This means the Vite proxy is NOT working, and requests are hitting the frontend server instead of being forwarded to the backend.

---

## Root Cause

The **backend server is not running**. The Vite proxy can only work if:

1. ✅ Frontend is running on port 5173
2. ❌ Backend is running on port 4000 (THIS IS MISSING!)

---

## THE FIX (2 Steps)

### Step 1: Start Backend (Do This First!)

Open a **NEW terminal** and run:

```bash
cd c:\Users\Antidote\Desktop\ceopos\server
npm run dev
```

You should see:
```
[nodemon] watching extensions: ts,json
Server is running on port 4000
```

### Step 2: Start Frontend

In another terminal, run:

```bash
cd c:\Users\Antidote\Desktop\ceopos
npm run dev
```

You should see:
```
VITE v... ready in XXX ms
→ Local:   http://localhost:5173/
```

### Step 3: Test It

1. Open http://localhost:5173
2. Login as alice@test.com / password123
3. Click "Start Shift"
4. Check browser console - should NOT see 404 errors anymore

---

## How the Proxy Works

```
┌──────────────────────────────────────┐
│  Browser                             │
│  http://localhost:5173               │
│                                      │
│  fetch('/api/shifts/start')          │
└────────────────┬─────────────────────┘
                 │
                 ▼ (Vite Proxy Intercepts)
                 
┌──────────────────────────────────────┐
│  Vite Dev Server (Port 5173)         │
│  config: proxy /api to localhost:4000│
└────────────────┬─────────────────────┘
                 │
    ┌────────────▼──────────────┐
    │  Forwards to              │
    │ http://localhost:4000     │
    └────────────┬──────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│  Express Backend (Port 4000)         │
│  Handles: /api/shifts/start          │
│  Returns: Shift data + 200 OK        │
└────────────────┬─────────────────────┘
                 │
                 ▼ (Response goes back through proxy)
                 
┌──────────────────────────────────────┐
│  Browser receives data ✅            │
│  No 404 error                        │
└──────────────────────────────────────┘
```

---

## What Each Error Means

| Error | Cause | Fix |
|-------|-------|-----|
| `GET localhost:5173/api/...` 404 | Backend not running | Start backend on port 4000 |
| `POST localhost:5173/api/...` 404 | Backend not running | Start backend on port 4000 |
| Connection refused | Backend crashed | Check terminal, restart |
| Network timeout | Slow/no internet | Check connection |
| 400 Bad Request | Validation error | Check request body, fix data |

---

## Terminal Setup (Recommended)

Use **2 terminal windows**:

### Terminal 1: Backend
```bash
cd c:\Users\Antidote\Desktop\ceopos\server
npm run dev
```
Leave this running.

### Terminal 2: Frontend
```bash
cd c:\Users\Antidote\Desktop\ceopos
npm run dev
```
Leave this running.

Both must be running simultaneously!

---

## Verification Checklist

- [ ] Terminal 1: Backend running on port 4000?
  - Should say: "Server is running on port 4000"
  
- [ ] Terminal 2: Frontend running on port 5173?
  - Should say: "Local: http://localhost:5173/"
  
- [ ] Browser opens http://localhost:5173?
  - Should load login page
  
- [ ] Login works?
  - Should enter cashier dashboard
  
- [ ] No 404 errors in console?
  - Should see "[Shift Restored]" or "Shift data loaded"

---

## Still Getting 404 After Starting Backend?

### Check 1: Is Backend Really Running?
```bash
# In a new terminal, test the API directly:
curl http://localhost:4000/api/shifts -H "Authorization: Bearer test"
```

Should NOT return "ECONNREFUSED". If it does, backend isn't running.

### Check 2: Did You Restart Frontend?
After starting backend:
1. Stop frontend: Ctrl+C
2. Restart frontend: `npm run dev`
3. Reload browser: F5

The proxy is configured at startup!

### Check 3: Is Vite Config Correct?
Check `vite.config.ts`:
```typescript
server: {
  proxy: {
    "/api": {
      target: "http://localhost:4000",
      changeOrigin: true,
      secure: false,
    },
  },
},
```

Should match exactly.

### Check 4: Any Firewall Issues?
- Windows Firewall might block port 4000
- Check: Settings → Firewall → Allow app through firewall
- Node.js should be allowed

---

## Backend Startup Issues?

If `npm run dev` in server folder doesn't work:

### Check Dependencies
```bash
cd c:\Users\Antidote\Desktop\ceopos\server
npm install
npm run dev
```

### Check .env File
Create `.env` in server folder if missing:
```
PORT=4000
DATABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_secret
```

### Check Port 4000
```bash
# See what's using port 4000:
netstat -ano | findstr :4000
```

If something else is using port 4000, kill it or change the port.

---

## The Close Shift 400 Error

Once you fix the 404 (by running backend), if you still get 400 on close shift:

```
POST /api/shifts/{id}/close 400 Bad Request
```

This usually means:
- Closing stock data is missing
- Cash/M-Pesa values are missing
- Shift is already closed

**Solution:** 
1. Enter closing stock for ALL products (required!)
2. Enter cash received amount
3. Enter M-Pesa received amount
4. Then click "Close Shift"

---

## Real-Time Updates

Once both servers are running:

✅ **Polling works:** Every 5 seconds, shift data updates
✅ **Admin dashboard:** Shows all active shifts in real-time
✅ **No errors:** Console should be clean

---

## Quick Checklist - Do This Now!

- [ ] Open 2 terminals
- [ ] Terminal 1: `cd server` then `npm run dev`
  - Wait for: "Server is running on port 4000"
- [ ] Terminal 2: `npm run dev`
  - Wait for: "Local: http://localhost:5173/"
- [ ] Open browser, login, start shift
- [ ] Should work without 404 errors
- [ ] ✅ DONE!

---

## Summary

**404 Error = Backend not running**

Just run these two commands in separate terminals:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

Then reload browser. Everything should work!

---

If you've done all this and still have errors, the 400 on close shift is likely:
1. You forgot to enter closing stock values for all products
2. Or forgot to enter cash/M-Pesa amounts

Check the form - all fields must be filled!
