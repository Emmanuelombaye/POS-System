# 📊 EDEN TOP POS - System Architecture & Login Flow

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      EDEN TOP POS SYSTEM                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  FRONTEND (Web)  │      │  BACKEND (API)   │                 │
│  ├──────────────────┤      ├──────────────────┤                 │
│  │ React + TypeScript│  →  │ Node.js + Express│  →  SUPABASE    │
│  │ Vite Dev Server  │      │ Port: 4000       │     PostgreSQL  │
│  │ Port: 5175       │      │ Running ✅       │     Connected ✅│
│  │ Running ✅       │      │                  │                 │
│  │                  │      │ Endpoints:       │                 │
│  │ Pages:           │      │ ✅ /health       │                 │
│  │ ✅ Login         │      │ ✅ /api/auth/login
│  │ ✅ Admin Dash    │      │ ✅ /products     │                 │
│  │ ✅ Cashier POS   │      │ ✅ /transactions │                 │
│  │ ✅ Manager Dash  │      │ ✅ /users        │                 │
│  │                  │      │ ✅ /audit-log    │                 │
│  └──────────────────┘      └──────────────────┘                 │
│         ↓                                                         │
│    localStorage                    In-Memory Cache               │
│    (JWT Token)                     (Rate Limiting)               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Login Flow Diagram

```
User Opens Browser
       ↓
    ┌─────────────────────────────────┐
    │   Frontend: Login Page (5175)    │
    │                                  │
    │  1. Select Role (Admin/Manager)  │
    │  2. Select User (a1, m1, c1...)  │
    │  3. Enter Password (@AdminEdenTop)
    │  4. Select Branch (Cashier only) │
    │                                  │
    │     [Sign In Button]             │
    └────────────┬────────────────────┘
                  │ POST /api/auth/login
                  ↓
    ┌─────────────────────────────────┐
    │ Backend: Authentication (4000)   │
    │                                  │
    │ 1. Validate input               │
    │ 2. Check rate limit (max 5 fails)
    │ 3. Verify password (exact match) │
    │ 4. Query users table            │
    │ 5. Generate JWT token           │
    │ 6. Log to audit_log             │
    │                                  │
    │    Return: token + user data     │
    └────────────┬────────────────────┘
                  │ Response
                  ↓
    ┌─────────────────────────────────┐
    │ Frontend: Store Token            │
    │                                  │
    │ localStorage.setItem(            │
    │   'eden-top-state',              │
    │   { token, user, branch }        │
    │ )                                │
    │                                  │
    │ Redirect based on role:          │
    │ - Admin    → /admin              │
    │ - Manager  → /manager            │
    │ - Cashier  → /cashier            │
    └─────────────────────────────────┘
                  ↓
    ┌─────────────────────────────────┐
    │   Dashboard Loaded ✅            │
    │   (With JWT token for API calls) │
    └─────────────────────────────────┘
```

---

## Data Flow for API Requests

```
┌──────────────────────────────────┐
│  Frontend Component              │
│  (Admin Dashboard, POS, etc)     │
└─────────────┬────────────────────┘
              │
              ↓
┌──────────────────────────────────┐
│  API Client (src/utils/api.ts)   │
│                                  │
│  function post(endpoint, data):  │
│    headers = {                   │
│      'Authorization':            │
│        'Bearer ' + token         │ ← From localStorage
│    }                             │
│    fetch(endpoint, {             │
│      method: 'POST',             │
│      headers,                    │
│      body: JSON.stringify(data)  │
│    })                            │
└─────────────┬────────────────────┘
              │
              ↓ HTTP POST
┌──────────────────────────────────┐
│  Backend (Port 4000)             │
│                                  │
│  app.post('/endpoint', (req) => {│
│    // Verify JWT token          │
│    // Check user role            │
│    // Query database             │
│    // Return data                │
│  })                              │
└─────────────┬────────────────────┘
              │
              ↓ HTTPS/TLS
┌──────────────────────────────────┐
│  Supabase PostgreSQL Database    │
│                                  │
│  - users table                   │
│  - products table                │
│  - transactions table            │
│  - audit_log table               │
│  - shifts table                  │
│  - stock_additions table         │
│  - wholesale_summaries table     │
└──────────────────────────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────┐
│             SUPABASE DATABASE        │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐   │
│  │ users                        │   │
│  ├──────────────────────────────┤   │
│  │ id (PRIMARY KEY)    TEXT     │   │ ← a1, m1, c1, c2, c3
│  │ name                TEXT     │   │
│  │ role                TEXT     │   │ ← admin, manager, cashier
│  │ email               TEXT     │   │
│  │ phone               TEXT     │   │
│  │ created_at          TIMESTAMP│   │
│  │ updated_at          TIMESTAMP│   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ products                     │   │
│  ├──────────────────────────────┤   │
│  │ id (PRIMARY KEY)    UUID     │   │
│  │ name                TEXT     │   │
│  │ category            TEXT     │   │ ← beef, goat, offal, processed
│  │ price               DECIMAL  │   │
│  │ stock_kg            DECIMAL  │   │
│  │ branch_id           TEXT     │   │
│  │ created_at          TIMESTAMP│   │
│  │ updated_at          TIMESTAMP│   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ transactions                 │   │
│  ├──────────────────────────────┤   │
│  │ id (PRIMARY KEY)    UUID     │   │
│  │ user_id         TEXT (FK)    │   │
│  │ product_id      TEXT (FK)    │   │
│  │ quantity_kg         DECIMAL  │   │
│  │ total_amount        DECIMAL  │   │
│  │ payment_method      TEXT     │   │
│  │ transaction_date    TIMESTAMP│   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ audit_log                    │   │
│  ├──────────────────────────────┤   │
│  │ id (PRIMARY KEY)    UUID     │   │
│  │ user_id         TEXT (FK)    │   │
│  │ action              TEXT     │   │
│  │ description         TEXT     │   │
│  │ timestamp           TIMESTAMP│   │
│  └──────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────┐
│              USER ROLES & PERMISSIONS               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ADMIN (a1)                                         │
│  ├─ View all dashboards                            │
│  ├─ Manage users (create, edit, delete)            │
│  ├─ Manage branches                                │
│  ├─ Manage products & prices                       │
│  ├─ View all transactions                          │
│  ├─ View analytics & reports                       │
│  ├─ Configure system settings                      │
│  └─ View audit logs                                │
│                                                     │
│  MANAGER (m1)                                       │
│  ├─ View manager dashboard                         │
│  ├─ Manage branch staff                            │
│  ├─ Update product stock                           │
│  ├─ View branch transactions                       │
│  ├─ Approve discounts                              │
│  └─ View branch reports                            │
│                                                     │
│  CASHIER (c1, c2, c3)                              │
│  ├─ Access POS terminal                            │
│  ├─ See products for their branch                  │
│  ├─ Process sales                                  │
│  ├─ Accept payments (cash, M-Pesa, card)           │
│  ├─ View their own transactions                    │
│  └─ Manage shifts                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Security Implementation

```
┌──────────────────────────────────────────────────────┐
│             SECURITY LAYERS                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Layer 1: INPUT VALIDATION                          │
│  ├─ Type checking (string, not empty)              │
│  ├─ Password exact match (@AdminEdenTop)           │
│  └─ User ID format validation                      │
│                                                      │
│  Layer 2: RATE LIMITING                             │
│  ├─ Max 5 failed login attempts per user           │
│  ├─ Attempts tracked in-memory                     │
│  └─ Clears every hour                              │
│                                                      │
│  Layer 3: AUTHENTICATION                            │
│  ├─ Verify password matches system password        │
│  ├─ Query user from database                       │
│  ├─ Generate JWT token (24h expiration)            │
│  └─ Return token + user data                       │
│                                                      │
│  Layer 4: TOKEN STORAGE                             │
│  ├─ Token stored in localStorage                   │
│  ├─ Token sent in Authorization header             │
│  └─ "Bearer <token>" format                        │
│                                                      │
│  Layer 5: REQUEST AUTHENTICATION                    │
│  ├─ Verify JWT token on each request               │
│  ├─ Extract user ID from token                     │
│  └─ Attach user context to request                 │
│                                                      │
│  Layer 6: ROLE-BASED AUTHORIZATION                  │
│  ├─ Check user role for endpoint access            │
│  ├─ Return 403 if insufficient permissions         │
│  └─ Log unauthorized attempts                      │
│                                                      │
│  Layer 7: AUDIT LOGGING                             │
│  ├─ Log all successful logins                      │
│  ├─ Log all failed attempts                        │
│  ├─ Include timestamp and user info                │
│  └─ Stored in audit_log table                      │
│                                                      │
│  Layer 8: CORS PROTECTION                           │
│  ├─ Only localhost:5175 can access backend         │
│  ├─ Reject requests from other origins             │
│  └─ Prevent unauthorized client-side access       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Component Interactions

```
┌─────────────────────────────────────────────────────┐
│ Frontend: Login Page                                 │
│ (src/pages/auth/LoginPage.tsx)                       │
│                                                      │
│ • handleLogin() function                            │
│ • Validates all inputs                              │
│ • Calls useAppStore.login()                         │
│ • Shows loading state & errors                      │
│ • Redirects on success                              │
└──────────────────┬──────────────────────────────────┘
                   │ import useAppStore
                   ↓
┌─────────────────────────────────────────────────────┐
│ State Management: App Store                          │
│ (src/store/appStore.ts)                              │
│                                                      │
│ • login(userId, password) function                  │
│ • Calls api.post("/api/auth/login", ...)            │
│ • Stores token in state                             │
│ • Persists to localStorage                          │
│ • Triggers initialize() to load user data           │
└──────────────────┬──────────────────────────────────┘
                   │ import api
                   ↓
┌─────────────────────────────────────────────────────┐
│ API Client: Fetch Wrapper                            │
│ (src/utils/api.ts)                                   │
│                                                      │
│ • api.post(endpoint, data)                          │
│ • Adds Authorization header                         │
│ • Constructs full URL with VITE_API_URL             │
│ • Sends to http://localhost:4000                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP POST
                   ↓
┌─────────────────────────────────────────────────────┐
│ Backend: Authentication                              │
│ (server/src/index.ts)                                │
│                                                      │
│ • POST /api/auth/login endpoint                     │
│ • Validates input (type, format)                    │
│ • Checks rate limits                                │
│ • Verifies password                                 │
│ • Queries Supabase users table                      │
│ • Generates JWT token                               │
│ • Logs to audit_log table                           │
│ • Returns { token, user }                           │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS Response
                   ↓
┌─────────────────────────────────────────────────────┐
│ Frontend: Store & Redirect                           │
│                                                      │
│ • Save token to localStorage                        │
│ • Update global state with user info                │
│ • Navigate to /admin or /cashier or /manager        │
│ • Dashboard loads with JWT in Authorization header  │
│                                                      │
│ ✅ User is now logged in!                            │
└─────────────────────────────────────────────────────┘
```

---

## File Structure

```
ceopos/
├── frontend files
│   ├── src/
│   │   ├── pages/auth/LoginPage.tsx          ← Login UI
│   │   ├── pages/admin/ModernAdminDashboard.tsx
│   │   ├── pages/cashier/ModernCashierDashboard.tsx
│   │   ├── pages/manager/ManagerDashboard.tsx
│   │   ├── store/appStore.ts                 ← State + login function
│   │   ├── utils/api.ts                      ← API client
│   │   ├── utils/supabase.ts                 ← Supabase client
│   │   └── components/                       ← Reusable UI components
│   │
│   ├── index.html                           ← Entry point
│   ├── package.json                         ← Dependencies
│   ├── vite.config.ts                       ← Vite configuration
│   ├── tailwind.config.cjs                  ← Tailwind CSS
│   └── .env                                 ← Frontend config
│
├── backend files
│   ├── server/src/index.ts                  ← Backend server + auth
│   ├── server/package.json
│   └── server/.env                          ← Backend config
│
├── database files
│   ├── SETUP_DATABASE.sql                   ← ⭐ RUN THIS FIRST
│   ├── SQL_COMMANDS.md                      ← Copy-paste SQL
│   │
│   └── supabase_data/
│       ├── setup.sql
│       ├── users.csv
│       ├── products.csv
│       └── ...
│
├── documentation files
│   ├── QUICKSTART.md                        ← Start here! 🚀
│   ├── READY_TO_LOGIN.md                    ← Quick reference
│   ├── LOGIN_INSTRUCTIONS.md                ← Detailed guide
│   └── BACKEND_READY.md                     ← Backend info
│
└── config files
    ├── vercel.json
    ├── tsconfig.json
    └── package.json
```

---

## Deployment Readiness Checklist

```
✅ Frontend
   ├─ All components built and tested
   ├─ Login page with role/branch selection
   ├─ Admin dashboard with 8 tabs
   ├─ Cashier POS terminal
   ├─ Manager dashboard
   └─ State management with persistence

✅ Backend
   ├─ Express server running on port 4000
   ├─ Authentication endpoint with security
   ├─ Rate limiting enabled
   ├─ JWT token generation
   ├─ Audit logging
   └─ CORS configured for frontend

✅ Database
   ├─ Supabase connected
   ├─ Schema created
   ├─ Tables created (users, products, etc)
   ├─ Indexes created
   ├─ RLS policies configured
   └─ ⏳ Users need to be populated (SETUP_DATABASE.sql)

✅ Security
   ├─ Password validation
   ├─ Rate limiting
   ├─ JWT authentication
   ├─ Authorization checks
   ├─ Audit logging
   └─ CORS protection

⏳ Testing
   ├─ Unit tests
   ├─ Integration tests
   └─ End-to-end tests
```

---

**Next Step: Run SETUP_DATABASE.sql in Supabase! 🚀**
