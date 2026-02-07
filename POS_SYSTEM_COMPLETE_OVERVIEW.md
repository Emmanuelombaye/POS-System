# CEOPOS - Complete POS System Overview

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Roles & Workflows](#user-roles--workflows)
4. [Core Features](#core-features)
5. [Technical Stack](#technical-stack)
6. [Database Schema](#database-schema)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Key Implementation Details](#key-implementation-details)

---

## System Overview

**CEOPOS** is a comprehensive Point of Sale (POS) system designed for a **butchery business** with multiple branches. It manages:
- Real-time sales tracking
- Inventory/stock management
- Shift-based operations
- Expense tracking
- Multi-branch administration
- Analytics and reporting
- Offline-first capabilities

**Business Model**: Multiple cashiers per branch → Sales tracked by shift → Admin reviews and validates → Analytics dashboard shows trends

**Current Status**: ✅ Production-ready, deployed on Vercel (frontend) + Supabase (backend)

---

## Architecture

### High-Level Flow
```
Cashier → Sales → Shift Close → Stock Reconciliation → Admin Review → Analytics
```

### Tech Stack

**Frontend**:
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **State Management**: Zustand
- **UI Components**: Custom + shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **PWA**: Service Worker (offline support)
- **Deployment**: Vercel (auto-deploy on git push)

**Backend**:
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: None (raw SQL queries)
- **API**: RESTful with JWT authentication
- **Deployment**: Supabase Edge Functions / Self-hosted

**Database**:
- **Provider**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT tokens
- **Realtime**: Web polling (5-second intervals)

---

## User Roles & Workflows

### 1. **ADMIN** (Administrator)

**Access**: `/admin/*`

**Dashboard Tabs**:

#### a) **Dashboard (Shift Overview)**
- View all active shifts across branches
- Quick metrics: Total sales, total expenses, active cashiers
- Real-time updates every 5 seconds
- See which cashiers are currently working

#### b) **Sales & Transactions (Real-Time Monitor)**
- Live transaction feed from all branches
- See each sale as it happens
- Filter by: Date, Branch, Cashier, Product, Payment method
- Aggregated metrics: Total sales today, by branch, by product
- Export capability (planned)

#### c) **Pro Analytics (Growth Timeline Dashboard)**
- Sales trends over time with graphing
- Daily/Weekly/Monthly aggregation
- Compare periods to see growth
- Line charts showing sales progression
- Metrics: Total KES, Item count, Avg transaction value
- Error handling: Falls back to transaction aggregation if summary tables missing

#### d) **Expenses (Expense Management)**
- View all expense entries from cashier shifts
- Filter by: Date, Branch, Category, Payment method
- Categories: Transport, Utilities, Staff, Supplies, Other
- Track cash vs M-Pesa payments
- See which shifts had expenses

**Key Actions**:
- Monitor business metrics in real-time
- Track employee activity and sales patterns
- Identify inventory issues (variance > 2kg flagged)
- Review shift closings before final approval

---

### 2. **CASHIER** (Cashier/Shop Attendant)

**Access**: `/cashier/shift`

**Workflow**:

#### STEP 1: START SHIFT
- Click "Start Shift" at beginning of work
- System fetches:
  - Opening stock for each product
  - Yesterday's closing stock as baseline
  - All available products
- Creates shift record in database
- Displays: Product list with opening quantities

#### STEP 2: ADD SALES TO CART
- Select product from dropdown
- Enter quantity (in kg)
- Click "Add to Cart"
- Cart shows: Item, quantity, unit price, subtotal
- Add multiple items before confirming
- Can remove items from cart before confirmation

#### STEP 3: CONFIRM SALE
- Once cart ready, click "Confirm Sale"
- Choose payment method: **Cash** or **M-Pesa**
- System records sale with:
  - Product details
  - Quantity sold
  - Payment method
  - Timestamp
  - Cashier ID
- Cart clears, ready for next sale
- Sold quantity updates in real-time

#### STEP 4: ADD STOCK MID-SHIFT
- During shift, when new stock arrives:
  - Select meat category (Beef/Chicken)
  - Select specific product
  - Enter quantity added
  - Click "Add Stock"
- System records stock addition
- Opening stock + Added stock = Available for sale

#### STEP 5: ADD MID-SHIFT EXPENSES
- Optional: Record business expenses during shift
- Choose category (Transport, Utilities, Staff, etc.)
- Enter amount
- Choose payment method (Cash/M-Pesa)
- Click "Record Expense"
- Expense is immediately saved to database

#### STEP 6: CLOSE SHIFT
- At end of shift, click "Close Shift"
- **Closing Stock**: Auto-calculated from formula:
  ```
  Closing Stock = Opening Stock + Added Stock - Sold Stock
  ```
  - No manual entry needed
  - Calculated from actual cart sales & stock additions
- **Cash & M-Pesa Received**: Enter total cash/M-Pesa collected
- **System calculates Variance**:
  ```
  Variance = (Opening + Added - Sold) - (Actual Closing)
  Variance > 2kg = Flag for admin review
  ```
- Click "Close Shift" to submit
- Shift marked as CLOSED, admin can now review

**Features**:
- ✅ Offline support: Can login and view stock even without network
- ✅ Auto-closing stock calculation
- ✅ Real-time stock updates (from other cashiers)
- ✅ Expense tracking mid-shift
- ✅ Mobile-responsive (tabs scroll horizontally)

---

## Core Features

### 1. **Real-Time Sales Tracking**

**What happens when cashier sells**:
1. Item added to cart with quantity & payment method
2. Sale confirmed → Sent to `/api/shifts/{shiftId}/add-sale`
3. Backend updates:
   - `sales_transactions` table with sale record
   - `stock_entries` with updated `sold_stock`
4. Admin dashboard updates in real-time (polled every 5s)
5. Analytics recalculated with new transaction

**Data Structure**:
```
sales_transactions {
  id, shift_id, product_id, quantity_kg, unit_price, 
  amount, payment_method, timestamp, cashier_id, branch_id
}
```

---

### 2. **Stock Reconciliation & Inventory**

**Stock Calculation**:
```
Opening Stock (from yesterday's closing)
  ↓
+ Added Stock (during shift)
  ↓
- Sold Stock (from cart sales)
  ↓
= Expected Closing Stock
  ↓
Compare with Actual Closing Stock entered by cashier
  ↓
= Variance (difference = wastage/theft/counting error)
```

**What happens when shift closes**:
1. Closing stock auto-calculated from formula above
2. Sent to `/api/shifts/{shiftId}/close`
3. Backend stores:
   - Variance for each product
   - Flag if variance > 2kg
   - Closing stock becomes next shift's opening stock

**Data Structure**:
```
stock_entries {
  id, shift_id, product_id, opening_stock, added_stock, 
  sold_stock, closing_stock, expected_closing, variance
}
```

---

### 3. **Expense Tracking**

**Two types of expenses**:

1. **Mid-Shift Expenses** (recorded during shift)
   - Added via "Add Expense" button
   - Immediately saved
   - Visible in shift summary

2. **Closing Expenses** (optional, at shift end)
   - Added before closing shift
   - Deducted from cash/M-Pesa received

**Categories**: Transport, Utilities, Staff, Supplies, Other

**Payment Methods**: Cash, M-Pesa (tracked separately for reconciliation)

**Data Structure**:
```
expenses {
  id, shift_id, cashier_id, branch_id, 
  category, amount, payment_method, description, timestamp
}
```

---

### 4. **Multi-Branch Management**

**Architecture**:
- Each cashier assigned to a branch
- Admin sees all branches in dashboard
- Real-time aggregation by branch
- Each branch has separate shift records
- Roles define branch access

**Branches in System**:
- eden-drop-tamasha (default)
- eden-drop-eastleigh
- eden-drop-junction
- eden-drop-hub

---

### 5. **Analytics & Reporting**

**Admin Analytics Dashboard** (`/admin/analytics`):

**Growth Timeline Graph**:
- Line chart showing sales trends
- X-axis: Dates (daily/weekly/monthly)
- Y-axis: Sales amount in KES
- Shows growth patterns and business performance

**Metrics Displayed**:
- Total Sales (KES)
- Items Sold (count)
- Average Transaction Value
- Daily average
- Period comparison

**Data Sources**:
1. **Preferred**: `sales_daily`, `sales_weekly`, `sales_monthly` aggregation tables
   - Much faster queries
   - Pre-aggregated data
   - Better performance for large datasets

2. **Fallback**: Direct calculation from `sales_transactions`
   - Used if aggregation tables missing
   - Slower but always works
   - Auto-implements if tables don't exist

**Error Handling**:
- If query fails → Fallback to transactions aggregation
- Always returns valid data
- No blank graphs or errors shown to admin

---

### 6. **Offline Support (PWA)**

**How it works**:

**When Online**:
- All features work normally
- Sales synced to backend immediately
- Service worker caches static assets

**When Offline**:
1. **Login** ✅
   - Can still login using local user list
   - No backend validation needed
   - Badge shows "Offline (local login)"

2. **View Shift Data** ✅
   - Can see opening stock and shift info
   - Data from last online sync cached

3. **Cannot Do** ❌
   - Add new sales (needs backend confirmation)
   - Add stock
   - Add expenses
   - Close shift

**Version-Based Cache Management**:
- Service worker URL includes: `/service-worker.js?v=2.0.2`
- When version bumped → New service worker loaded
- Old caches automatically cleared
- Ensures fresh data after deployments
- No stale data shown to offline users

**Offline Banner**:
- Shows for 2 seconds when connection lost (auto-dismisses)
- Persistent bottom-right badge while offline
- Shows login mode if logged in offline

---

### 7. **Authentication & Security**

**Login Methods**:

1. **Online**: POST to `/api/auth/login` with userId + password
   - Returns JWT token
   - Token stored in localStorage
   - Token used for all API requests

2. **Offline**: Local user validation
   - Checks against hardcoded user list
   - No backend needed
   - Limited session (logout clears data)

**User Credentials** (by role):
```
ADMIN: password = "admin123"
CASHIER: password = "cashier123"
MANAGER: password = "manager123"
```

**Security**:
- JWT tokens expire after timeout
- API checks token for protected routes
- Refresh token logic (planned)
- No sensitive data in localStorage (only userId)

---

### 8. **Mobile Responsiveness**

**Cashier Mobile UI**:
- ✅ Vertical layout optimized for phones
- ✅ Large buttons for thumb taps
- ✅ Responsive product selector
- ✅ Mobile-optimized cart display

**Admin Mobile UI**:
- ✅ Tabs scroll horizontally on narrow screens
- ✅ Responsive tab labels: "DASHBOARD" → "DASH" on mobile
- ✅ Charts responsive (Recharts adapts)
- ✅ Touch-friendly filters and controls
- ✅ Persistent bottom navigation badge

---

## Technical Stack

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.2.2",
  "vite": "^5.4.21",
  "tailwindcss": "^3.4.1",
  "framer-motion": "^10.x",
  "zustand": "^4.5.x",
  "recharts": "^2.12.x",
  "lucide-react": "^0.x"
}
```

### Backend Dependencies
```json
{
  "express": "^4.21.x",
  "@supabase/supabase-js": "^2.x",
  "cors": "^2.8.5",
  "jsonwebtoken": "^9.x",
  "dotenv": "^16.x"
}
```

### Database Tables
```
- users
- shifts
- sales_transactions
- stock_entries
- expenses
- products
- branches
- shift_reconciliation_details
- sales_daily (aggregation)
- sales_weekly (aggregation)
- sales_monthly (aggregation)
```

---

## Database Schema

### Core Tables

#### `users`
```sql
id (UUID), email, name, role (ADMIN/CASHIER/MANAGER), 
branch_id, password_hash, created_at, updated_at
```

#### `shifts`
```sql
id (UUID), cashier_id, branch_id, status (OPEN/CLOSED),
opened_at, closed_at, closing_cash, closing_mpesa,
total_products, total_sold_kg, total_added_kg
```

#### `sales_transactions`
```sql
id (UUID), shift_id, product_id, quantity_kg, unit_price,
amount, payment_method (cash/mpesa), timestamp, 
cashier_id, branch_id
```

#### `stock_entries`
```sql
id (UUID), shift_id, product_id, opening_stock, added_stock,
sold_stock, closing_stock, expected_closing, variance
```

#### `expenses`
```sql
id (UUID), shift_id, cashier_id, branch_id, category,
amount, payment_method, description, timestamp
```

#### `products`
```sql
id (UUID), name, category (Beef Ribs/Beef Mince/Chicken, etc.),
unit_price, created_at
```

---

## Deployment & Infrastructure

### Frontend Deployment

**Provider**: Vercel

**Process**:
1. Push code to GitHub (main branch)
2. Vercel auto-triggers build
3. Runs `npm run build` → generates `/dist` folder
4. Deploys to CDN
5. Live at: `https://ceopos.vercel.app` (or custom domain)

**Build Output**:
- Static HTML/CSS/JS files
- Service worker for offline support
- Versioned assets for caching

**Auto-Deploy**: ✅ Every git commit triggers deployment
**Build Time**: ~18-24 seconds
**Current Version**: 2.0.2

---

### Backend Deployment

**Provider**: Supabase (PostgreSQL + REST API)

**Setup**:
- PostgreSQL database in cloud
- Supabase auth for JWT
- REST API auto-generated from tables
- Edge Functions for custom logic (optional)

**Custom API**: 
- Node.js Express server (self-hosted or Vercel Functions)
- Connects to Supabase via `@supabase/supabase-js`
- Handles: Sales logic, Shifts, Expenses, Analytics

**Database Migrations**:
- Migration files in `/server/migrations/`
- Run manually in Supabase SQL Editor
- Current: `002_create_sales_summaries.sql` (optional, for performance)

---

## Key Implementation Details

### 1. **Real-Time Updates**

**How data refreshes**:
- Frontend polls every 5 seconds: `GET /api/shifts/active/{cashierId}`
- Admin dashboard refreshes sales data every 5 seconds
- Analytics charts rebuild on data change

**Why polling?**:
- Simpler than WebSocket
- Supabase doesn't include real WebSocket (Realtime is paid)
- 5s interval is acceptable for POS operations
- Easy to scale

---

### 2. **Closing Stock Auto-Calculation**

**Flow**:
```
1. Cashier adds sales to cart throughout shift
2. Cashier adds stock as new inventory arrives
3. System tracks:
   - opening_stock (from yesterday's closing)
   - added_stock (new inventory added today)
   - sold_stock (sum of all cart sales)

4. At shift close, closing_stock = opening_stock + added_stock - sold_stock
5. Display shows: "5kg (open) + 10kg (added) - 8kg (sold) = 7kg (closing)"
6. No manual input needed - automatically calculated
```

---

### 3. **Variance Flagging**

**What is variance?**:
Difference between calculated and actual closing stock
```
Variance = Expected Closing - Actual Closing
```

**Why it matters**:
- Flag for wastage, theft, or counting errors
- Variance > 2kg → Admin alert
- Helps identify inventory issues
- Tracks accountability

---

### 4. **Multi-Payment Method Tracking**

**Why separate Cash/M-Pesa?**
- Cash vs digital payment reconciliation
- Different cash flow patterns
- KRA compliance
- Better financial reporting

**System tracks**:
- Each sale's payment method
- Expenses by payment method
- Totals reconciled at shift close
- Cash vs M-Pesa received vs expenses

---

### 5. **Error Handling & Fallbacks**

**Analytics Tables Missing?**
- ✅ System still works
- Fallback to transaction aggregation
- API always returns data
- No blank graphs shown

**Network Error During Sale?**
- ✅ Offline mode saves locally (in future)
- Currently: Shows error, user retries
- No data loss if handled properly

**Invalid Stock Number?**
- ✅ Validated on frontend (no negatives)
- Backend re-validates
- User gets clear error message

---

### 6. **Service Worker & Caching**

**Cache Strategy**:
```
Static Assets (JS/CSS/Fonts)
├─ Cache: static-v2.0.2
├─ Duration: Long (versioned)
└─ Fallback: Serve from cache

API Responses
├─ Cache: api-v2.0.2
├─ Duration: 5 minutes
└─ Fallback: Serve cached or error

Dynamic Pages
├─ Cache: dynamic-v2.0.2
├─ Duration: Skip cache (always fetch)
└─ Fallback: Show offline page
```

**Version Bumping**:
- Change `APP_VERSION` in `/src/lib/updateManager.ts`
- Service worker URL: `/service-worker.js?v=2.0.2`
- Triggers new cache creation
- Old caches automatically deleted

---

## Business Metrics & KPIs

**Dashboard Shows**:

1. **Sales Metrics**
   - Total daily sales (KES)
   - Items sold today
   - Average transaction value
   - Sales by payment method

2. **Inventory Metrics**
   - Total stock added today
   - Total stock sold today
   - Variance by product
   - Stock levels per product

3. **Operational Metrics**
   - Active shifts
   - Cashiers online
   - Expenses recorded
   - Average shift duration

4. **Analytics Metrics**
   - 7-day sales trend
   - 30-day comparison
   - Best-selling products
   - Revenue growth %

---

## Current Status

### ✅ Completed Features
- Core POS functionality (sales, stock, expenses)
- Multi-branch support
- Admin dashboard with real-time monitoring
- Growth timeline analytics
- Offline login support
- Mobile responsiveness
- Service worker caching with version management
- Auto-calculated closing stock
- Expense tracking

### ⏳ Optional Enhancements
- Performance: Run `002_create_sales_summaries.sql` migration for aggregation tables
- Features: Receipt printing, inventory import/export
- Reporting: Advanced filters, custom date ranges
- Mobile: Native app wrapper

### 🔐 Security Recommendations
- Implement refresh tokens (currently: access token only)
- Add password reset flow
- Implement API rate limiting
- Add action logging/audit trail
- Use environment variables for credentials (currently in code)

---

## How to Use the System

### For Cashier
1. Login with cashier credentials
2. Click "Start Shift"
3. Add products to cart with quantities
4. Click "Confirm Sale", choose payment method
5. Add new stock when it arrives
6. Add expenses if any
7. At end of day, click "Close Shift"
8. System auto-calculates closing stock
9. Enter cash/M-Pesa received
10. Shift closed, admin reviews

### For Admin
1. Login with admin credentials
2. View **Dashboard**: See all active shifts
3. View **Sales & Transactions**: Monitor real-time sales
4. View **Pro Analytics**: Check sales trends
5. View **Expenses**: Track spending
6. Monitor variance flags for inventory issues
7. Review shift data before final approval

---

## Support & Troubleshooting

**Issue**: Graph shows blank
- **Solution**: Wait 30 seconds, check date range, verify sales exist

**Issue**: Offline banner stuck
- **Solution**: Auto-dismisses after 2 seconds, check internet connection

**Issue**: Closing stock incorrect
- **Solution**: Check if all sales were properly recorded in cart

**Issue**: Can't login
- **Solution**: Verify credentials, check if user exists in system

**Issue**: Sale not showing in admin dashboard
- **Solution**: Wait 5 seconds for polling refresh, check branch filter

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.2 | Feb 2026 | Auto-calculated closing stock, analytics consolidation |
| 2.0.1 | Jan 2026 | Offline login, versioned caching |
| 2.0.0 | Dec 2025 | Growth timeline analytics, admin dashboard |
| 1.0.0 | Oct 2025 | Initial POS core functionality |

---

## Contact & Support

**System Owner**: Eden Drop Business  
**Current Status**: Production ✅  
**Last Updated**: February 6, 2026  
**Deployed On**: Vercel (frontend) + Supabase (backend)

---

*This document provides a complete overview of the CEOPOS system. For technical details, refer to specific feature documentation or code comments in the repository.*
