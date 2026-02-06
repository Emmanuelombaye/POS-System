# 🔧 EXPENSE SYSTEM - TECHNICAL SPECIFICATION & API DOCS

**Version**: 1.0.0  
**Last Updated**: February 6, 2026  
**Status**: Production Ready  
**Maintainers**: Eden Drop 001 Development Team

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Specification](#api-specification)
4. [Error Codes](#error-codes)
5. [Authentication](#authentication)
6. [Data Validation](#data-validation)
7. [Performance Considerations](#performance-considerations)
8. [Deployment](#deployment)
9. [Monitoring & Logging](#monitoring--logging)
10. [Migration Guide](#migration-guide)

---

## ARCHITECTURE OVERVIEW

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                    │
│  - ShiftStock.tsx (Expense Input)                          │
│  - ExpenseAnalytics.tsx (Admin Dashboard)                  │
│  - AddExpenseModal.tsx (Quick Add)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                   HTTP REST API (Port 4000)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend (Express/Node.js)                   │
│  - server/src/expenses.ts (6 Endpoints)                     │
│  - server/src/shifts.ts (Shift Closing)                    │
│  - JWT Authentication Middleware                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    PostgreSQL (Supabase)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Database Layer                            │
│  - expenses table (Primary)                                 │
│  - shifts table (FK References)                            │
│  - users table (FK References)                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CASHIER ACTION:
  Add Expense → Frontend Modal → API POST /api/expenses
    ↓
  Backend validates → Database INSERT
    ↓
  Response with expense_id, amount, timestamp
    ↓
  Frontend updates balance display in real-time

SHIFT CLOSING:
  Click Close Shift → Calculate Stock Cost
    ↓
  Add Expenses in Modal → POST each to API
    ↓
  Frontend calls closeShift() → Backend processes
    ↓
  Fetch expenses for shift → Calculate expected totals
    ↓
  Expected = Sales - Expenses - Stock Cost
    ↓
  Compare with actual values → Variance detection
    ↓
  Return reconciliation response

ADMIN ANALYTICS:
  Filter → Date Range + Branch
    ↓
  GET /api/expenses/analytics → Backend query
    ↓
  Group by category, daily, cashier
    ↓
  Calculate: total, cash, mpesa, approved, pending
    ↓
  Return summary + charts data
    ↓
  Frontend renders KPIs, charts, tables
```

---

## DATABASE SCHEMA

### expenses Table

```sql
CREATE TABLE expenses (
  -- PRIMARY KEY
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FOREIGN KEYS
  shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  
  -- EXPENSE DATA
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (
    category IN ('Transport', 'Packaging', 'Repairs', 'Food', 'Supplies', 'Other')
  ),
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  
  -- STATUS & AUDIT
  approved BOOLEAN DEFAULT FALSE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- OPTIMIZATION
  created_at_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);
```

### Indexes

```sql
-- Lookup & Filtering
CREATE INDEX idx_expenses_shift_id ON expenses(shift_id);
CREATE INDEX idx_expenses_cashier_id ON expenses(cashier_id);
CREATE INDEX idx_expenses_branch_id ON expenses(branch_id);

-- Temporal Queries
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Status Filtering
CREATE INDEX idx_expenses_approved ON expenses(approved);

-- Payment Method Analysis
CREATE INDEX idx_expenses_payment_method ON expenses(payment_method);

-- Composite Indexes for Common Queries
CREATE INDEX idx_expenses_shift_approval ON expenses(shift_id, approved);
CREATE INDEX idx_expenses_cashier_date ON expenses(cashier_id, created_at DESC);
CREATE INDEX idx_expenses_category_date ON expenses(category, created_at DESC);
```

### Row-Level Security (RLS)

```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Cashiers can view only their own expenses
CREATE POLICY "cashiers_view_own" ON expenses
  FOR SELECT USING (cashier_id = auth.uid());

-- Admins can view all expenses
CREATE POLICY "admins_view_all" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Cashiers can insert their own expenses
CREATE POLICY "cashiers_insert_own" ON expenses
  FOR INSERT WITH CHECK (cashier_id = auth.uid());

-- Admins can update expenses (for approval)
CREATE POLICY "admins_update" ON expenses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Data Types & Constraints

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY | Auto-generated, immutable |
| shift_id | TEXT | NOT NULL, FK | Links to shifts(id) |
| cashier_id | TEXT | NOT NULL, FK | Links to users(id) |
| branch_id | TEXT | NOT NULL | Branch identifier |
| amount | DECIMAL(10,2) | NOT NULL, > 0 | Two decimal places |
| category | TEXT | NOT NULL, IN (...) | 6 predefined categories |
| description | TEXT | Optional | For context/notes |
| payment_method | TEXT | NOT NULL, IN (...) | 'cash' or 'mpesa' |
| approved | BOOLEAN | DEFAULT false | Admin approval status |
| receipt_url | TEXT | Optional | Future: receipt image |
| created_at | TIMESTAMP TZ | NOT NULL | ISO 8601, immutable |
| updated_at | TIMESTAMP TZ | NOT NULL | Auto-updated |

---

## API SPECIFICATION

### Base URL
```
http://localhost:4000
```

### Authentication
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

### 1. CREATE EXPENSE

**POST** `/api/expenses`

**Purpose**: Record a new expense during an open shift

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "shift_id": "12345678-1234-1234-1234-123456789012",
  "cashier_id": "87654321-4321-4321-4321-210987654321",
  "branch_id": "Tamasha",
  "amount": 500.00,
  "category": "Transport",
  "description": "Delivery to warehouse",
  "payment_method": "cash"
}
```

**Field Validation**:
```
shift_id:       UUID string, required, must be open shift
cashier_id:     UUID string, required
branch_id:      String, required, 1-100 chars
amount:         Decimal, required, must be > 0, precision 2 decimals
category:       String, required, one of [Transport, Packaging, Repairs, Food, Supplies, Other]
description:    String, optional, 0-500 chars
payment_method: String, required, one of [cash, mpesa]
```

**Response (200 - Success)**:
```json
{
  "success": true,
  "expense": {
    "id": "abcd1234-5678-90ab-cdef-1234567890ab",
    "shift_id": "12345678-1234-1234-1234-123456789012",
    "cashier_id": "87654321-4321-4321-4321-210987654321",
    "branch_id": "Tamasha",
    "amount": 500.00,
    "category": "Transport",
    "description": "Delivery to warehouse",
    "payment_method": "cash",
    "approved": false,
    "created_at": "2026-02-06T10:30:00Z",
    "updated_at": "2026-02-06T10:30:00Z"
  },
  "message": "Expense recorded successfully"
}
```

**Response (400 - Invalid Input)**:
```json
{
  "error": "Amount must be greater than 0"
}
```

**Response (400 - Shift Closed)**:
```json
{
  "error": "Cannot add expense to closed shift"
}
```

**Response (401 - Unauthorized)**:
```json
{
  "error": "Access denied. No token provided."
}
```

**Response (403 - Invalid Token)**:
```json
{
  "error": "Invalid or expired token."
}
```

**Response (500 - Server Error)**:
```json
{
  "error": "Internal server error"
}
```

**Logging**:
```
[EXPENSE_ADD] Expense created: abcd1234-5678-90ab-cdef-1234567890ab for shift 12345678-1234-1234-1234-123456789012
```

---

### 2. GET EXPENSES (with Filters)

**GET** `/api/expenses?shift_id=X&cashier_id=Y&branch_id=Z&date=YYYY-MM-DD&approved=true`

**Purpose**: Retrieve expenses with flexible filtering and sorting

**Query Parameters**:
```
shift_id:   Optional, UUID string - filter by specific shift
cashier_id: Optional, UUID string - filter by specific cashier
branch_id:  Optional, string - filter by branch
date:       Optional, YYYY-MM-DD - filter by specific date
approved:   Optional, 'true' or 'false' - filter by approval status
```

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 - Success)**:
```json
{
  "expenses": [
    {
      "id": "expense-uuid-1",
      "shift_id": "shift-uuid-1",
      "cashier_id": "cashier-uuid-1",
      "branch_id": "Tamasha",
      "amount": 500.00,
      "category": "Transport",
      "description": "Delivery",
      "payment_method": "cash",
      "approved": false,
      "created_at": "2026-02-06T10:30:00Z",
      "updated_at": "2026-02-06T10:30:00Z"
    },
    {
      "id": "expense-uuid-2",
      "shift_id": "shift-uuid-1",
      "cashier_id": "cashier-uuid-1",
      "branch_id": "Tamasha",
      "amount": 200.00,
      "category": "Food",
      "description": "Lunch",
      "payment_method": "cash",
      "approved": true,
      "created_at": "2026-02-06T11:00:00Z",
      "updated_at": "2026-02-06T11:30:00Z"
    }
  ],
  "total": 700.00
}
```

**Response (Empty Result)**:
```json
{
  "expenses": [],
  "total": 0
}
```

**Logging**:
```
[EXPENSE_GET] Fetched 2 expenses
```

---

### 3. UPDATE EXPENSE

**PATCH** `/api/expenses/:id`

**Purpose**: Modify expense details or approve (admin only)

**URL Parameters**:
```
id: UUID - expense identifier
```

**Request Body** (all fields optional):
```json
{
  "amount": 550.00,
  "category": "Packaging",
  "description": "Updated delivery notes",
  "payment_method": "mpesa",
  "approved": true
}
```

**Response (200 - Success)**:
```json
{
  "success": true,
  "expense": {
    "id": "expense-uuid",
    "amount": 550.00,
    "category": "Packaging",
    "description": "Updated delivery notes",
    "payment_method": "mpesa",
    "approved": true,
    "updated_at": "2026-02-06T10:45:00Z"
  }
}
```

**Response (400 - Cannot Edit)**:
```json
{
  "error": "Cannot edit approved expense"
}
```

**Response (404 - Not Found)**:
```json
{
  "error": "Expense not found"
}
```

**Logging**:
```
[EXPENSE_UPDATE] Expense expense-uuid updated
```

---

### 4. DELETE EXPENSE

**DELETE** `/api/expenses/:id`

**Purpose**: Remove expense record (only before shift closes)

**URL Parameters**:
```
id: UUID - expense identifier
```

**Response (200 - Success)**:
```json
{
  "success": true,
  "message": "Expense deleted"
}
```

**Response (400 - Cannot Delete)**:
```json
{
  "error": "Cannot delete approved expense"
}
```

**Response (400 - Shift Closed)**:
```json
{
  "error": "Cannot delete expense for closed shift"
}
```

**Response (404 - Not Found)**:
```json
{
  "error": "Expense not found"
}
```

**Logging**:
```
[EXPENSE_DELETE] Expense expense-uuid deleted
```

---

### 5. GET SHIFT EXPENSES SUMMARY

**GET** `/api/expenses/shift/:shiftId/summary`

**Purpose**: Get total expenses for a specific shift (used in shift closing)

**URL Parameters**:
```
shiftId: UUID - shift identifier
```

**Response (200 - Success)**:
```json
{
  "total_expenses": 1200.00,
  "approved_expenses": 800.00,
  "pending_expenses": 400.00,
  "count": 4,
  "expenses": [
    {
      "id": "expense-uuid-1",
      "amount": 500.00,
      "category": "Transport",
      "payment_method": "cash",
      "approved": true
    },
    {
      "id": "expense-uuid-2",
      "amount": 300.00,
      "category": "Repairs",
      "payment_method": "mpesa",
      "approved": true
    },
    {
      "id": "expense-uuid-3",
      "amount": 200.00,
      "category": "Food",
      "payment_method": "cash",
      "approved": false
    },
    {
      "id": "expense-uuid-4",
      "amount": 200.00,
      "category": "Packaging",
      "payment_method": "mpesa",
      "approved": false
    }
  ]
}
```

**Logging**:
```
[EXPENSE_SUMMARY] Shift shift-uuid has 4 expenses totaling 1200.00
```

---

### 6. GET EXPENSE ANALYTICS

**GET** `/api/expenses/analytics?branch_id=X&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Purpose**: Comprehensive analytics for admin dashboard

**Query Parameters**:
```
branch_id:  Optional, string - filter by branch (default: all)
start_date: Optional, YYYY-MM-DD - start of date range (default: 30 days ago)
end_date:   Optional, YYYY-MM-DD - end of date range (default: today)
```

**Response (200 - Success)**:
```json
{
  "summary": {
    "totalExpenses": 12500.00,
    "cashExpenses": 7500.00,
    "mpesaExpenses": 5000.00,
    "approvedExpenses": 10000.00,
    "pendingExpenses": 2500.00,
    "expenseCount": 25,
    "averageExpense": 500.00
  },
  "categoryData": [
    {
      "category": "Transport",
      "amount": 5000.00
    },
    {
      "category": "Repairs",
      "amount": 3500.00
    },
    {
      "category": "Packaging",
      "amount": 2500.00
    },
    {
      "category": "Food",
      "amount": 1500.00
    }
  ],
  "dailyData": [
    {
      "date": "2026-02-01",
      "amount": 800.00,
      "count": 2
    },
    {
      "date": "2026-02-02",
      "amount": 1200.00,
      "count": 3
    }
  ],
  "topSpenders": [
    {
      "name": "Alice",
      "total": 3000.00,
      "count": 6
    },
    {
      "name": "Bob",
      "total": 2500.00,
      "count": 5
    },
    {
      "name": "Carol",
      "total": 2000.00,
      "count": 4
    }
  ],
  "highExpenses": [
    {
      "id": "expense-uuid-1",
      "amount": 1500.00,
      "category": "Repairs",
      "description": "Equipment replacement",
      "created_at": "2026-02-03T14:00:00Z"
    }
  ],
  "recentExpenses": [
    {
      "id": "expense-uuid",
      "amount": 500.00,
      "category": "Transport",
      "cashier": {
        "name": "Alice"
      },
      "created_at": "2026-02-06T10:30:00Z"
    }
  ]
}
```

**Logging**:
```
[EXPENSE_ANALYTICS] Fetched analytics: 25 expenses for branch Tamasha from 2026-01-06 to 2026-02-06
```

---

## ERROR CODES

### HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input (amount <= 0, closed shift, etc.) |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Invalid/expired token |
| 404 | Not Found | Expense/shift not found |
| 500 | Server Error | Database error, unexpected error |

### Standard Error Response

```json
{
  "error": "Descriptive error message"
}
```

### Common Error Messages

```
"Missing required fields"
"Amount must be greater than 0"
"Cannot add expense to closed shift"
"Cannot edit approved expense"
"Cannot delete approved expense"
"Cannot delete expense for closed shift"
"Cannot edit expense for closed shift"
"Shift not found"
"Expense not found"
"Access denied. No token provided."
"Invalid or expired token."
```

---

## AUTHENTICATION

### JWT Token Structure

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "id": "uuid-of-user",
  "name": "Alice",
  "role": "cashier|admin|manager",
  "iat": 1707210000,
  "exp": 1707296400
}
```

### Token Secret

```
JWT_SECRET = "eden-drop-001-secret-key-2026"
```

### Token Usage

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LXNvbWUtdXVpZCIsIm5hbWUiOiJBbGljZSIsInJvbGUiOiJjYXNoaWVyIn0.signature
```

### Expired Token Response

```json
{
  "error": "Invalid or expired token."
}
```

---

## DATA VALIDATION

### Validation Rules

```typescript
// Amount validation
- Must be numeric (decimal)
- Must be > 0
- Maximum 2 decimal places
- Range: 0.01 to 99,999.99

// Category validation
- Must be one of: Transport, Packaging, Repairs, Food, Supplies, Other
- Case-sensitive
- Required

// Payment method validation
- Must be one of: cash, mpesa
- Lowercase
- Required

// Description validation
- Optional
- Maximum 500 characters
- Allows any Unicode characters

// Shift ID validation
- Must be valid UUID
- Must reference existing shift
- Shift status must be 'open'
- Required

// Cashier ID validation
- Must be valid UUID
- Must reference existing user
- Required

// Branch ID validation
- Must be string 1-100 characters
- Examples: Tamasha, Reem, LungaLunga
- Required
```

### Validation Example (Frontend)

```typescript
const validateExpense = (expense: {
  amount: number;
  category: string;
  payment_method: string;
}) => {
  const errors: string[] = [];

  if (!expense.amount || expense.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  const validCategories = [
    "Transport", "Packaging", "Repairs",
    "Food", "Supplies", "Other"
  ];
  if (!validCategories.includes(expense.category)) {
    errors.push("Invalid category");
  }

  if (!["cash", "mpesa"].includes(expense.payment_method)) {
    errors.push("Invalid payment method");
  }

  return errors;
};
```

---

## PERFORMANCE CONSIDERATIONS

### Database Optimization

**Query Performance**:
- Indexes on shift_id, cashier_id, created_at for fast queries
- Date range queries use created_at index
- Composite indexes for common filter combinations

**Indexing Strategy**:
```sql
-- Fast lookups by shift
CREATE INDEX idx_expenses_shift_id ON expenses(shift_id);

-- Fast date range queries
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Composite for shift + date
CREATE INDEX idx_expenses_shift_created ON expenses(shift_id, created_at DESC);
```

### Query Optimization

**Problem**: Fetching all expenses for analytics is slow  
**Solution**: 
- Use date range filters (start_date, end_date)
- Limit to 30 days by default
- Use paginated results for large datasets

**Example**:
```typescript
// Good: Scoped by date range and branch
GET /api/expenses/analytics?branch_id=Tamasha&start_date=2026-02-01&end_date=2026-02-06

// Bad: No filters, returns all expenses ever
GET /api/expenses/analytics
```

### Caching Strategy

**Frontend Caching**:
- Cache analytics data for 5 minutes
- Invalidate on "Refresh" button click
- Store in Zustand (global state)

**API Response Caching** (future):
- Cache analytics summary for 60 seconds
- Invalidate on new expense creation
- Use HTTP cache headers

---

## DEPLOYMENT

### Environment Variables

```bash
# Backend (.env)
SUPABASE_URL=https://glskbegsmdrylrhczpyy.supabase.co
SUPABASE_KEY=sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ
JWT_SECRET=eden-drop-001-secret-key-2026
NODE_ENV=development
PORT=4000
```

### Database Migration

**Step 1**: Connect to Supabase SQL Editor  
**Step 2**: Open `server/src/migrations/create_expenses_table.sql`  
**Step 3**: Copy entire SQL content  
**Step 4**: Execute in Supabase  

### Server Startup

```bash
# Development
cd server
npm install
npm run dev    # Watches for changes

# Backend runs on port 4000
# Frontend runs on port 5173
```

### Production Deployment

```bash
# Build backend
cd server
npm run build

# Start backend
npm run start

# Build frontend
npm run build

# Deploy using your hosting (Vercel, Netlify, etc.)
```

---

## MONITORING & LOGGING

### Log Format

```
[FUNCTION] Timestamp Level Message Details
```

### Log Examples

```
[EXPENSE_ADD] Expense created: abcd1234... for shift 12345678...
[EXPENSE_GET] Fetched 5 expenses for branch Tamasha
[EXPENSE_UPDATE] Expense abcd1234... updated
[EXPENSE_DELETE] Expense abcd1234... deleted
[EXPENSE_ANALYTICS] Fetched analytics: 25 expenses from 2026-02-01 to 2026-02-06
[EXPENSE_SUMMARY] Shift 12345678... has 3 expenses totaling 1500.00
```

### Error Logging

```
[EXPENSE_ADD] Error: Amount must be greater than 0
[EXPENSE_DELETE] Error: Cannot delete expense for closed shift
```

### Monitoring Metrics

**Track**:
- API response times (all endpoints)
- Database query times (especially analytics)
- Error rates (400, 401, 403, 500)
- Request volume (expenses per day)
- Database size (expenses table growth)

---

## MIGRATION GUIDE

### From Manual to System-Tracked Expenses

**Before**: Expenses tracked in Excel, manually entered  
**After**: Real-time system tracking, automatic balance calculation

**Migration Steps**:

1. **Data Preparation**:
   - Export historical expenses from manual tracking
   - Map to new categories (Transport, Packaging, etc.)
   - Verify amounts and dates

2. **System Setup**:
   - Create expenses table (SQL migration)
   - Verify authentication working
   - Test all 6 endpoints

3. **User Training**:
   - Cashiers learn "Add Expense" workflow
   - Admin learns analytics dashboard
   - Shift closing with expenses process

4. **Pilot Period** (1-2 weeks):
   - Track in both systems
   - Verify calculations match
   - Identify missing expenses
   - Fine-tune process

5. **Full Rollout**:
   - Stop manual tracking
   - All new expenses in system
   - Monthly reconciliation
   - Archive old manual records

---

## APPENDIX: EXAMPLE REQUESTS

### cURL Examples

```bash
# Create Expense
curl -X POST http://localhost:4000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shift_id": "shift-uuid",
    "cashier_id": "cashier-uuid",
    "branch_id": "Tamasha",
    "amount": 500.00,
    "category": "Transport",
    "description": "Delivery",
    "payment_method": "cash"
  }'

# Get Shift Summary
curl -X GET "http://localhost:4000/api/expenses/shift/shift-uuid/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Analytics
curl -X GET "http://localhost:4000/api/expenses/analytics?branch_id=Tamasha&start_date=2026-02-01&end_date=2026-02-06" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript Fetch Examples

```javascript
// Create Expense
const response = await fetch('http://localhost:4000/api/expenses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shift_id: 'shift-uuid',
    cashier_id: 'cashier-uuid',
    branch_id: 'Tamasha',
    amount: 500,
    category: 'Transport',
    payment_method: 'cash',
  }),
});
const data = await response.json();

// Get Analytics
const analytics = await fetch(
  'http://localhost:4000/api/expenses/analytics?branch_id=Tamasha',
  {
    headers: { 'Authorization': `Bearer ${token}` },
  }
);
const results = await analytics.json();
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 6, 2026  
**Status**: Production Ready  

