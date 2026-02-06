# CEOPOS SYSTEM COMPONENTS & CONNECTIONS MAP

**Status**: ✅ All Connected and Working  
**Date**: February 3, 2026  
**Testing**: Ready

---

## 📋 DOCUMENT INDEX

| Document | Purpose |
|----------|---------|
| [SYSTEM_ARCHITECTURE_LIVE.md](SYSTEM_ARCHITECTURE_LIVE.md) | 📊 How data flows through the system + debugging guide |
| [LIVE_SYSTEM_VERIFICATION_TEST.md](LIVE_SYSTEM_VERIFICATION_TEST.md) | 🧪 Step-by-step test to verify everything works |
| [COMPONENTS_MAP.md](COMPONENTS_MAP.md) | 📍 This document - what each component does |

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

```
┌────────────────────────────────────────────────────────────────────┐
│                          CEOPOS SYSTEM                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐        ┌──────────────┐      ┌──────────────┐  │
│  │   CASHIER    │        │    BACKEND   │      │  SUPABASE    │  │
│  │   (Frontend) │───────▶│   (Express)  │─────▶│  (Database)  │  │
│  │              │        │              │      │              │  │
│  │ React 18     │        │ Node.js 18   │      │ PostgreSQL   │  │
│  │ Zustand      │        │ 26+ Routes   │      │ Real-time    │  │
│  │ Vite         │        │ JWT Auth     │      │ Auth         │  │
│  └──────┬───────┘        └──────┬───────┘      └──────┬───────┘  │
│         │                       │                     │            │
│         └───────────────────────┴─────────────────────┘            │
│                   API Calls (REST)                                │
│                  + Real-time Subscriptions                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 COMPONENT BREAKDOWN

### Frontend (React 18 + Vite + TypeScript)

**Port**: 5174  
**Location**: `src/`

#### 🧑‍💼 Cashier Module
- **File**: `src/pages/cashier/ModernCashierDashboard.tsx`
- **Features**:
  - Search products
  - Add to cart with weight
  - Apply discounts
  - Select payment method (cash/mpesa)
  - Complete sale
- **State Management**: Zustand (appStore)
- **API Calls**:
  - `POST /products` → Get product list
  - `POST /transactions` → Save sale

**Shift Management**:
- **File**: `src/pages/cashier/ShiftStock.tsx`
- **Features**:
  - Open shift (stores shift_id in activeShift)
  - Close shift with closing counts
  - Add stock (pending approval)
  - Track daily stock entries
- **Polling**: Every 5 seconds to check shift status
- **Persistence**: activeShift saved to localStorage

#### 👨‍💼 Admin Module
- **File**: `src/pages/admin/AdminDashboard.tsx`
- **Features**:
  - View real-time transactions
  - Manage users
  - View product stock
  - Access wholesale/market section

**Wholesale Market (Real-time Dashboard)**:
- **File**: `src/components/wholesale/WholesaleDesk.tsx`
- **Features**:
  - Real-time branch summaries (cash + mpesa)
  - Manual entry for manual cash/mpesa
  - Text report generation
  - Automatic aggregation from cashier sales
- **Real-time**: 
  - Supabase subscriptions (transactions + wholesale_summaries)
  - Polling every 10 seconds
  - Instant updates within 2-3 seconds if real-time enabled
- **Display**: `src/components/wholesale/WholesaleSummaryDisplay.tsx`

#### 🏪 Store (State Management)
- **File**: `src/store/appStore.ts`
- **State**:
  - `currentUser` - Logged-in cashier/admin/manager
  - `currentBranch` - Selected branch (1, 2, 3)
  - `activeShift` - Current shift (OPEN/CLOSED)
  - `cashierCart` - Items being sold
  - `products` - All products
  - `transactions` - All sales
  - `recentShifts` - Recent shift history
- **Methods**:
  - `login()` - Authenticate user
  - `openShift()` - Start cashier shift
  - `completeSale()` - Post transaction to backend
  - `fetchShifts()` - Get shifts from backend (polling)
  - More...
- **Persistence**: LocalStorage (survives page reload)

#### 🌐 API Utility
- **File**: `src/utils/api.ts`
- **Features**:
  - Adds JWT token to all requests
  - Handles 401/403 auth errors
  - Base URL: `http://localhost:4000`
  - Methods: `get()`, `post()`, `patch()`, `delete()`

---

### Backend (Express + TypeScript + Node.js)

**Port**: 4000  
**Location**: `server/src/index.ts`

#### 🔐 Authentication Endpoints
- `POST /api/auth/login`
  - Input: `{userId, password}`
  - Output: `{token, user}`
  - JWT Secret: Hardcoded (change in production!)
  - Token Expiry: 24 hours

#### 🎯 Transaction Endpoints
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Save new sale
  - Input: `{id, cashier_id, branch_id, created_at, items, total, payment_method}`
  - Updates: 
    - transactions table (insert)
    - inventory_ledger table (log sale)
    - shift_stock_entries table (update sold_stock)
    - products table (decrease stock_kg)
  - Output: Saved transaction

#### 👥 User Endpoints
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### 📦 Product Endpoints
- `GET /products` - List all products
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

#### 🏢 Shift Endpoints
- `GET /shifts` - List shifts (filters: status, cashier_id)
- `POST /shifts/open` - Open new shift
  - Input: `{cashier_id, branch_id}`
  - Creates shift, logs opening snapshot
  - Output: Shift object with status='OPEN'
- `POST /shifts/:id/close` - Close shift
  - Input: `{actual_counts}` (closing inventory)
  - Updates shift status, reconciles inventory
  - Output: Closed shift

#### 📊 Wholesale Endpoints (Real-time)
- `GET /api/wholesale-summaries/realtime?date=2026-02-04`
  - Aggregates ALL transactions for date
  - Groups by: branch_id → branch name (1→"Branch 1", etc.)
  - Sums by: payment_method (cash vs mpesa)
  - Merges with: manual wholesale_summaries entries
  - Output: 
    ```json
    [{
      "branch": "Branch 1",
      "cash_received": 5000,
      "mpesa_received": 3000,
      "transaction_cash": 5000,
      "transaction_mpesa": 3000,
      "manual_cash": 0,
      "manual_mpesa": 0
    }]
    ```

#### 🔧 Debug Endpoints
- `GET /health` - Backend health check
- `GET /debug/users` - List users from database (for testing)

#### ⚙️ Middleware
- **JWT Auth**: Validates token on protected routes
- **Role Authorization**: Checks user role (admin/manager/cashier)
- **Error Handling**: Returns proper status codes + messages
- **CORS**: Allows localhost requests

---

### Database (Supabase PostgreSQL)

**Provider**: Supabase  
**Region**: Auto-selected  
**Real-time**: Enabled on transactions, wholesale_summaries, shifts

#### 📊 Tables

**users**
```sql
id (TEXT) | name | role (admin/manager/cashier) | password_hash | created_at
```

**products**
```sql
id | name | code | category (beef/goat/offal/processed) 
| price_per_kg | stock_kg | low_stock_threshold_kg | is_active
```

**transactions**
```sql
id | cashier_id | shift_id | branch_id | created_at | items (JSON)
| subtotal | total | payment_method (cash/mpesa) | discount (JSON)
```

**shifts**
```sql
id | cashier_id | opened_at | closed_at | status (OPEN/PENDING_REVIEW/APPROVED) | created_at
```

**wholesale_summaries** (Manual Entries)
```sql
id | date | branch (Branch 1/2/3) | cash_received | mpesa_received | created_at
```

**shift_stock_entries** (Fallback for branch mapping)
```sql
id | shift_id | branch_id | product_id | opening_stock | added_stock 
| sold_stock | closing_stock | variance
```

**inventory_ledger** (Append-only audit)
```sql
id | item_id | event_type (SALE/STOCK_ADDED/OPENING_SNAPSHOT/etc)
| quantity_kg | shift_id | user_id | created_at
```

---

## 🔄 DATA FLOW EXAMPLES

### Example 1: Cashier Opens Shift

```
Cashier clicks "Open New Shift"
         ↓
appStore.openShift(cashierId="c1", branchId="1")
         ↓
api.post("/shifts/open", {cashier_id: "c1", branch_id: "1"})
         ↓
[BACKEND] Creates shift in database:
  - INSERT shifts {id, cashier_id, opened_at, status: 'OPEN'}
  - INSERT inventory_ledger (opening snapshot for each product)
  - INSERT shift_stock_entries (stock template for day)
         ↓
Returns: {id: "uuid", cashier_id: "c1", status: "OPEN", ...}
         ↓
Frontend: set({activeShift: {id, cashierId, openedAt, status}})
         ↓
Cashier sees: "POS Terminal" (cart interface appears)
```

### Example 2: Cashier Completes Sale

```
Cashier adds 5kg beef @ 1000/kg = 5000 KES
Selects: CASH payment
Clicks: "Complete Sale"
         ↓
appStore.completeSale()
         ↓
Calculates: subtotal = 5000, total = 5000 (no discount)
Creates Transaction object
         ↓
api.post("/api/transactions", {
  id: "tx-001",
  cashier_id: "c1",
  shift_id: "shift-uuid",
  branch_id: "1",
  created_at: "2026-02-04T...",
  items: [{productId: "p1", weightKg: 5, pricePerKg: 1000}],
  subtotal: 5000,
  total: 5000,
  payment_method: "cash"
})
         ↓
[BACKEND] Processes transaction:
  - INSERT transactions (new row)
  - INSERT inventory_ledger {event: 'SALE', quantity: -5}
  - UPDATE shift_stock_entries {sold_stock: 5}
  - UPDATE products {stock_kg: existing - 5}
  - TRIGGER: Supabase realtime fires
         ↓
Frontend response: "✅ Sale completed! Total: 5000 KES"
         ↓
Cart clears, UI ready for next sale
```

### Example 3: Admin Sees Real-Time Update

```
Supabase realtime fires: transaction.INSERT event
         ↓
Admin dashboard subscribed to "transactions-changes"
         ↓
Triggers: fetchSummaries()
         ↓
api.get("/api/wholesale-summaries/realtime?date=2026-02-04")
         ↓
[BACKEND] Aggregation:
  1. SELECT * FROM transactions WHERE DATE(created_at) = '2026-02-04'
  2. GROUP BY branch_id, payment_method
  3. SUM total amounts:
     - Branch 1 Cash: 5000
     - Branch 1 Mpesa: 0
  4. Merge with wholesale_summaries manual entries
  5. Return formatted result
         ↓
Frontend displays:
  📍 Branch 1
  Total Cash: KES 5,000
  └─ From Sales (Cash): 5,000
         ↓
Admin sees update [INSTANTLY via realtime OR within 10 seconds via polling]
```

---

## ✅ INTEGRATION CHECKLIST

- [x] Frontend connects to backend (JWT auth works)
- [x] Backend connects to Supabase (queries work)
- [x] Cashier can login
- [x] Cashier can open shift (activeShift persists)
- [x] Cashier can complete sales (transactions save)
- [x] Admin can login
- [x] Admin sees real-time totals (polling every 10s)
- [x] Real-time subscriptions configured
- [x] Branch mapping works (1→"Branch 1", etc)
- [x] All endpoints return proper data types

---

## 🚀 HOW TO DEPLOY

### Local Testing (Current Setup)
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev

# Open http://localhost:5174
```

### Production Deployment
1. Set environment variables:
   - `SUPABASE_URL` - Your project URL
   - `SUPABASE_ANON_KEY` - Public key
   - `JWT_SECRET` - Random 32-character string
   - `NODE_ENV` - "production"

2. Build frontend:
   ```bash
   npm run build
   # Output: dist/
   ```

3. Deploy backend:
   - Use Vercel, Heroku, or Docker
   - Ensure port 4000 accessible
   - Set environment variables

4. Update frontend API URL:
   - `src/utils/api.ts`: Change `http://localhost:4000` to production URL

5. Run Supabase setup scripts:
   - SCRIPT_05_WHOLESALE_SUMMARIES.sql (create table)
   - SCRIPT_06_REALTIME_ENABLE.sql (enable realtime)

---

## 📞 SUPPORT

**Issue**: Component X not connecting  
**Solution**: Check [SYSTEM_ARCHITECTURE_LIVE.md](SYSTEM_ARCHITECTURE_LIVE.md#-debugging-steps)

**Issue**: Not sure if system works  
**Solution**: Follow [LIVE_SYSTEM_VERIFICATION_TEST.md](LIVE_SYSTEM_VERIFICATION_TEST.md)

**Issue**: Need to modify something  
**Solution**: Read relevant section above, then check code at file paths provided

---

**System Status**: ✅ LIVE AND CONNECTED  
**All Components**: ✅ WORKING  
**Ready for Testing**: ✅ YES  
**Ready for Production**: ⏳ After passing verification tests

---

*Document Generated: February 3, 2026*  
*System: CEOPOS (Multi-Branch POS)*  
*Tier: Production*
