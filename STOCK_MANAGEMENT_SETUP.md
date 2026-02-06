# Stock Management Feature - Setup Instructions

## ✅ Completed Components

### Backend
- ✅ 5 Stock Management API endpoints implemented in `server/src/index.ts`
  - `GET /stock/daily` - Fetch daily stock entries
  - `POST /stock/add` - Record stock additions
  - `PATCH /stock/closing/:id` - Update closing stock and calculate variance
  - `GET /stock/alerts` - Fetch low-stock/variance alerts
  - `GET /stock/summary` - Get daily summary with totals

### Frontend
- ✅ `StockManagement.tsx` - Main dashboard component with:
  - Summary cards (opening, added, sold, closing stock)
  - Daily stock movement table
  - Low-stock alert banner
  - Date picker for historical viewing
  - Color-coded categories and status indicators

- ✅ `StockAdditionForm.tsx` - Modal form for adding stock with:
  - Product selector with category badges
  - Quantity input (kg)
  - Notes field
  - Success confirmation

- ✅ `StockAlertsPanel.tsx` - Alert management panel with:
  - Unresolved alerts display
  - Alert type badges (low_stock, variance, critical)
  - Resolve button functionality
  - Auto-refresh capability

- ✅ Route added to `App.tsx` - `/stock` (admin-only access)

---

## 📋 NEXT STEP: Execute Database Migration

### Step 1: Open Supabase Dashboard
Go to: https://supabase.co/dashboard

### Step 2: Navigate to SQL Editor
1. Click on your **ceopos** project
2. Select **SQL Editor** from the left sidebar
3. Click **New Query**

### Step 3: Copy and Execute Migration Script
1. Open file: `SCRIPT_03_STOCK_MANAGEMENT.sql` (in workspace root)
2. Copy all content
3. Paste into Supabase SQL Editor
4. Click **RUN** button

**Expected Results:**
- ✅ 3 tables created:
  - `stock_entries` - Daily opening/added/sold/closing stock
  - `stock_adjustments` - Variance tracking (damage, theft, recount, etc.)
  - `stock_alerts` - Low-stock/variance/critical alerts
- ✅ 3 indexes created for performance

### Step 4: Verify Migration
Run this query in SQL Editor to confirm:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('stock_entries', 'stock_adjustments', 'stock_alerts');
```

Should return 3 rows.

---

## 🚀 Access Stock Management

### Via Admin Dashboard
1. Login as admin (a1 / @AdminEdenDrop001)
2. Go to Admin Dashboard
3. Look for **Stock Management** link in menu

### Via Direct URL
Navigate to: `http://localhost:5174/stock`

---

## 📊 Features Overview

### Dashboard Components

#### Summary Cards
- **Opening Stock**: Inherited from previous day's closing
- **Added Stock**: New stock recorded today (green)
- **Sold Stock**: Deducted from transactions (red)
- **Closing Stock**: Calculated automatically (copper highlight)

#### Daily Stock Movement Table
Shows per-product breakdown:
- Opening amount
- Added quantity
- Sold/Used quantity
- Closing balance
- Variance (deviation from expected)
- Status (⚠️ Low or ✓ OK)

#### Low-Stock Alerts
- Yellow banner appears when products below threshold
- StockAlertsPanel shows unresolved alerts
- Resolve button marks as handled
- Alert types: low_stock, variance, critical

#### Date Navigation
- Date picker to view historical stock for any day
- Automatically fetches data for selected date
- Timezone-aware calculations

---

## 🔧 Backend Endpoints Reference

### GET /stock/daily
Fetch stock entries for a specific branch and date.

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:4000/stock/daily?branch_id=branch1&date=2024-01-15"
```

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "product_id": "prod1",
      "opening_stock_kg": 10.5,
      "added_stock_kg": 20.0,
      "sold_stock_kg": 5.0,
      "closing_stock_kg": 25.5,
      "variance_kg": 0.0,
      "is_low_stock": false
    }
  ]
}
```

### POST /stock/add
Record new stock additions for a product.

```bash
curl -X POST \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod1",
    "branch_id": "branch1",
    "added_stock_kg": 25.5,
    "notes": "Batch from supplier ABC"
  }' \
  http://localhost:4000/stock/add
```

### PATCH /stock/closing/:id
Update closing stock for a day and calculate variance.

```bash
curl -X PATCH \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sold_stock_kg": 5.0,
    "closing_stock_kg": 25.5
  }' \
  http://localhost:4000/stock/closing/{entry_id}
```

### GET /stock/alerts
Fetch unresolved alerts for a branch.

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:4000/stock/alerts?branch_id=branch1&resolved=false"
```

### GET /stock/summary
Get daily summary with all entries and totals.

```bash
curl -H "Authorization: Bearer {TOKEN}" \
  "http://localhost:4000/stock/summary?branch_id=branch1&date=2024-01-15"
```

**Response:**
```json
{
  "total_opening": 50.0,
  "total_added": 100.0,
  "total_sold": 45.0,
  "total_closing": 105.0,
  "low_stock_count": 2,
  "entries": [...]
}
```

---

## 🎯 Testing Checklist

After running the migration, test these scenarios:

- [ ] Navigate to /stock page
- [ ] Verify summary cards display correctly
- [ ] Click "Add Stock" and test stock addition form
- [ ] Verify stock appears in daily movement table
- [ ] Check date picker changes displayed data
- [ ] View and resolve alerts
- [ ] Verify color-coding for product categories
- [ ] Test on mobile (responsive design)
- [ ] Logout and verify admin-only access

---

## 📝 Database Schema

### stock_entries Table
```sql
id (uuid, primary key)
product_id (uuid, foreign key → products)
branch_id (text)
entry_date (date)
opening_stock_kg (numeric)
added_stock_kg (numeric)
sold_stock_kg (numeric)
closing_stock_kg (numeric)
variance_kg (numeric) -- Auto-calculated
is_low_stock (boolean)
low_stock_threshold_kg (numeric)
recorded_by (uuid, foreign key → users)
created_at (timestamp)
updated_at (timestamp)

Index: (product_id, branch_id, entry_date) UNIQUE
```

### stock_adjustments Table
```sql
id (uuid, primary key)
stock_entry_id (uuid, foreign key → stock_entries)
adjustment_type (enum: damage, theft, recount, supplier_return, other)
quantity_kg (numeric)
reason (text)
adjusted_by (uuid, foreign key → users)
created_at (timestamp)

Index: (stock_entry_id)
```

### stock_alerts Table
```sql
id (uuid, primary key)
product_id (uuid, foreign key → products)
branch_id (text)
alert_type (enum: low_stock, variance, critical)
message (text)
is_resolved (boolean)
resolved_by (uuid, foreign key → users)
created_at (timestamp)
updated_at (timestamp)

Index: (branch_id, is_resolved)
```

---

## 🔐 Security Notes

- Stock management is **admin-only** (`/stock` route requires admin role)
- All API endpoints require valid JWT token
- User audit trail maintained (recorded_by, adjusted_by, resolved_by)
- Variance calculations are automatic and immutable after daily close
- Database constraints prevent duplicate entries per product/branch/date

---

## 📞 Troubleshooting

**Issue: "No stock entries for this date"**
- Ensure SCRIPT_03_STOCK_MANAGEMENT.sql has been executed
- Check that stock has been added for the selected date
- Verify you're logged in as admin

**Issue: API returns 401 Unauthorized**
- Ensure JWT token is valid and not expired
- Check that token is being sent in Authorization header
- Re-login to get fresh token

**Issue: Low-stock alerts not showing**
- Verify stock_alerts table was created in migration
- Check that product stock_threshold is set correctly
- Ensure is_resolved flag is false

---

## 🎓 Next Steps (Future Enhancements)

- [ ] Integration with sales transactions (auto-deduct sold stock)
- [ ] Stock reconciliation at shift close
- [ ] Variance analysis and reporting
- [ ] Stock forecasting based on historical data
- [ ] Multi-branch stock transfer feature
- [ ] Email notifications for critical alerts
- [ ] Barcode scanning for quick stock additions
- [ ] Stock aging (FIFO/LIFO) tracking
