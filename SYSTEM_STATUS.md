# Eden Drop 001 POS - System Status & Testing Guide

## ✅ System Components

### Backend (Port 4000)
**Status:** Configured and ready
**Location:** `server/src/index.ts`
**Start Command:** `npm --prefix server run dev`

### Frontend (Vite Dev Server)
**Status:** Configured and ready
**Start Command:** `npm run dev`

---

## ✅ Cashier Features - IMPLEMENTED

### 1. **Login System**
- Endpoint: `POST /api/auth/login`
- Credentials: Any user ID + password `@AdminEdenDrop001`
- Returns: JWT token for authenticated requests

### 2. **Shift Management**
- **Open Shift:** `POST /shifts/open` 
  ```json
  { "cashier_id": "c1", "branch_id": "branch1" }
  ```
- **Close Shift:** `POST /shifts/:id/close`
  ```json
  { "actual_counts": { "beef-regular": 10.5 } }
  ```
- **View Shifts:** `GET /shifts?cashier_id=c1`

### 3. **Stock Management**
- **Add Stock to Shift:** `POST /shift/add-stock`
  ```json
  {
    "shift_id": "shift-123",
    "product_id": "beef-regular",
    "quantity_kg": 5.0,
    "supplier": "Local Farm",
    "notes": "Fresh delivery",
    "batch": "B-001"
  }
  ```
- **View Shift Stock:** `GET /shift-stock?shift_id=shift-123`

### 4. **Sales & Payment (Cash + M-Pesa)**
- **Complete Sale:** `POST /transactions`
  ```json
  {
    "id": "tx-123",
    "cashier_id": "c1",
    "shift_id": "shift-123",
    "created_at": "2026-02-03T12:00:00Z",
    "items": [
      {
        "productId": "beef-regular",
        "weightKg": 2.5,
        "pricePerKg": 800,
        "totalPrice": 2000
      }
    ],
    "discount": null,
    "subtotal": 2000,
    "total": 2000,
    "payment_method": "cash"  // or "mpesa"
  }
  ```
- **View Transactions:** `GET /transactions`

### 5. **Product Catalog**
- **View Products:** `GET /products`
- **Update Product:** `PATCH /products/:id`
- **Add Product:** `POST /products` (admin only)

---

## ✅ Admin Features - IMPLEMENTED

### 1. **AI Assistant**
- Endpoint: `POST /api/ai/chat`
- Requires: Admin role + valid OpenRouter API key
- Features:
  - Low stock alerts
  - Cashier performance analysis
  - Sales insights
  - Variance detection

### 2. **User Management**
- `GET /users` - List all users
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### 3. **Shift Reconciliation**
- View all shifts with status (OPEN/PENDING_REVIEW/APPROVED)
- Approve/reject shift closures
- View variance reports

---

## 🔧 Configuration Files

### Backend Environment (`server/.env`)
```env
SUPABASE_URL=https://glskbegsmdrylrhczpyy.supabase.co
SUPABASE_KEY=sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ
PORT=4000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openrouter/auto
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### Database Connection
- **Provider:** Supabase PostgreSQL
- **Tables:**
  - `users` - User accounts (cashier, manager, admin)
  - `products` - Product catalog with stock levels
  - `transactions` - Sales records
  - `shifts` - Cashier shift sessions
  - `shift_stock_entries` - Stock tracking per shift
  - `inventory_ledger` - Stock movement audit trail
  - `audit_log` - System activity log

---

## 🧪 Manual Testing Guide

### Test 1: Cashier Login
1. Open frontend at `http://localhost:5176` (or current Vite port)
2. Login with `c1` / `@AdminEdenDrop001`
3. Should redirect to cashier dashboard

### Test 2: Open Shift
1. Navigate to "Shift Stock" page
2. Click "Open New Shift"
3. Shift should open successfully

### Test 3: Add Stock
1. With shift open, click "Add Stock"
2. Select product, enter quantity (e.g., 5.0 kg)
3. Enter supplier name
4. Click "Record Addition"
5. Should appear in shift stock table

### Test 4: Cash Sale
1. Go back to cashier dashboard
2. Select product, enter weight
3. Click "Add to Cart"
4. Ensure payment method is "Cash"
5. Click "Complete Sale"
6. Cart should clear, stock should decrease

### Test 5: M-Pesa Sale
1. Select product, add to cart
2. Click "M-Pesa" payment button
3. Complete sale
4. Transaction should record with payment_method="mpesa"

### Test 6: Close Shift
1. Go to "Shift Stock" page
2. Click "Close Shift"
3. Enter closing counts for each product
4. Click "Confirm & Close"
5. Shift status should change to PENDING_REVIEW

### Test 7: Admin Login & AI
1. Logout, login as `a1` / `@AdminEdenDrop001`
2. Navigate to admin dashboard
3. Click AI assistant icon (sparkles)
4. Ask "Low stock items"
5. Should get AI response with inventory analysis

---

## 🚀 Start the System

### Terminal 1 - Backend
```powershell
cd C:\Users\Antidote\Desktop\ceopos\server
npm run dev
```
**Expected:** "Eden Top backend listening on port 4000"

### Terminal 2 - Frontend
```powershell
cd C:\Users\Antidote\Desktop\ceopos
npm run dev
```
**Expected:** "VITE ready at http://localhost:5XXX"

### Verify Backend Health
```powershell
Invoke-RestMethod -Uri http://localhost:4000/health
```
**Expected:** `{ status: "ok", service: "eden-top-backend", database: "supabase" }`

---

## 📊 Database Test Data

### Users
- **Cashier:** `c1` (Cashier 1)
- **Cashier:** `c2` (Cashier 2) 
- **Manager:** `m1` (Manager 1)
- **Admin:** `a1` (Admin)
- **Password:** All users: `@AdminEdenDrop001`

### Products (from CSV)
- Beef Regular, Beef Premium, Mutton, Chicken
- Each has: price_per_kg, stock_kg, low_stock_threshold_kg

---

## ✅ Feature Checklist

### Cashier Dashboard
- [x] Product catalog display
- [x] Add to cart with weight input
- [x] Cart management (update, remove items)
- [x] Discount application (% or fixed amount)
- [x] Payment method selection (Cash / M-Pesa)
- [x] Complete sale button
- [x] Real-time stock updates
- [x] Transaction history display

### Shift Management
- [x] Open shift
- [x] Add stock to shift
- [x] View shift stock dashboard (opening/added/sold/current)
- [x] Close shift with physical count reconciliation
- [x] Variance calculation
- [x] Shift history display

### Admin Dashboard
- [x] AI chat assistant
- [x] Low stock alerts
- [x] Cashier performance metrics
- [x] Shift reconciliation view
- [x] User management
- [x] Product management

### Backend API
- [x] JWT authentication
- [x] Role-based authorization
- [x] Shift endpoints (open, close, view)
- [x] Stock endpoints (add, view shift stock)
- [x] Transaction endpoints (create, list)
- [x] Product endpoints (CRUD)
- [x] User endpoints (CRUD)
- [x] AI chat endpoint with OpenRouter
- [x] Real-time stock ledger updates
- [x] Payment method tracking (cash/mpesa)

---

## 🔐 Security Notes

⚠️ **IMPORTANT:** The OpenRouter API key in `.env` was posted publicly and should be rotated immediately.

1. Go to https://openrouter.ai/keys
2. Delete the exposed key: `sk-or-v1-020de152...`
3. Create a new API key
4. Update `server/.env` with the new key
5. Restart the backend

---

## 📝 Next Steps

1. **Start both servers** (backend + frontend)
2. **Run manual tests** following the guide above
3. **Verify cash and M-Pesa payments** are recorded correctly
4. **Test shift workflow** (open → add stock → sell → close)
5. **Test admin AI assistant** (requires OpenRouter key rotation)

---

## 🐛 Troubleshooting

### Backend won't start
- Check port 4000 is free: `Get-NetTCPConnection -LocalPort 4000`
- Kill any existing node processes: `taskkill /F /IM node.exe`
- Check Supabase connection in logs

### Frontend can't connect
- Verify backend is running on port 4000
- Check `src/utils/api.ts` has correct API_URL
- Open browser console for error messages

### Login fails
- Verify users exist: `Invoke-RestMethod -Uri http://localhost:4000/debug/users`
- Check password is exactly `@AdminEdenDrop001`
- Review backend logs for auth errors

### AI not responding
- Verify OPENROUTER_API_KEY is set in `server/.env`
- Check API key is valid (not expired/rotated)
- Set AI_PROVIDER=openrouter in `.env`
- Restart backend after .env changes

---

**System Ready:** All cashier and admin features are implemented and ready for testing.
