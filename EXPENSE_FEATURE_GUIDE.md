# Expense Feature Integration Guide

## Summary

The complete expense tracking system has been built with:

1. **Backend API** (`server/src/expenses.ts`)
   - POST /api/expenses - Add expense
   - GET /api/expenses - List expenses with filters
   - PUT /api/expenses/:id - Approve/update expense
   - DELETE /api/expenses/:id - Delete expense
   - GET /api/expenses/shift/:shiftId/summary - Get shift expenses

2. **Database Schema** (`migrations/create_expenses_table.sql`)
   - expenses table with full audit trail
   - Indexes for performance
   - RLS policies for security

3. **Frontend Hooks**
   - `useExpenses` hook with real-time subscriptions

4. **Frontend Components**
   - `AddExpenseModal` - Cashier adds expenses during shift
   - `ExpenseList` - Shows all expenses for a shift
   - `AdminExpensesDashboard` - Admin view with KPIs and approvals

## How to Integrate into Existing Pages

### Option 1: Add to CashierShiftWorkflow (RIGHT PANEL)

In `src/pages/cashier/CashierShiftWorkflow.tsx`, add this to the active shift UI (right column):

```tsx
import { AddExpenseModal } from "@/components/cashier/AddExpenseModal";
import { ExpenseList } from "@/components/cashier/ExpenseList";
import { useExpenses } from "@/hooks/useExpenses";

// Inside component
const [showExpenseModal, setShowExpenseModal] = useState(false);
const { expenses, addExpense, deleteExpense, totalExpenses } = useExpenses(getShiftId(shiftData) || "");

// In JSX - Right column after transactions
<Card className="rounded-xl shadow-sm overflow-hidden">
  <div className="bg-gradient-to-r from-red-500 to-orange-600 p-6">
    <h2 className="text-2xl font-black text-white flex items-center gap-2">
      <TrendingDown className="h-6 w-6" />
      Expenses ({expenses.length})
    </h2>
  </div>
  <div className="p-6 space-y-4">
    <button
      onClick={() => setShowExpenseModal(true)}
      className="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
    >
      <Plus size={20} />
      Add Expense
    </button>
    
    <ExpenseList 
      expenses={expenses} 
      onDelete={deleteExpense} 
      shiftOpen={stage === "active"}
    />
    
    {totalExpenses > 0 && (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm text-gray-600">Total Expenses</p>
        <p className="text-2xl font-bold text-red-600">
          -{totalExpenses.toFixed(2)} KES
        </p>
      </div>
    )}
  </div>
</Card>

<AddExpenseModal
  isOpen={showExpenseModal}
  onClose={() => setShowExpenseModal(false)}
  onSubmit={addExpense}
  shiftId={getShiftId(shiftData) || ""}
  cashierId={currentUser?.id || ""}
  branchId={shiftData?.branch_id || ""}
/>
```

### Option 2: Add to Admin Dashboard

In `src/pages/admin/AdminDashboard.tsx` (or wherever you want), add a tab:

```tsx
import { AdminExpensesDashboard } from "@/components/admin/AdminExpensesDashboard";

// In your navigation/tabs
<AdminExpensesDashboard />
```

## Database Setup

Run this SQL in Supabase:

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('Transport', 'Supplies', 'Repairs', 'Other')),
  description TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa')),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_shift_id ON expenses(shift_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cashier_id ON expenses(cashier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_approved ON expenses(approved);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

## Real-Time Features

✅ When cashier adds expense:
- Instantly appears in their expense list
- Admin dashboard updates in real-time
- Shows in shift summary

✅ When admin approves:
- Marked as approved
- Expense list updates
- Dashboard reflects approval

✅ Mobile responsive:
- Bottom sheet modal on mobile
- Center dialog on desktop
- Touch-friendly category buttons

## Security

✅ Cashiers can:
- Add expenses during open shift only
- Delete only unapproved expenses
- Delete only before shift closes

✅ Admin can:
- View all expenses
- Approve/reject expenses
- See category breakdowns

❌ Cannot:
- Delete approved expenses
- Add to closed shift
- Abuse system (amount validation)

## Next Steps

1. Run the SQL migration in Supabase console
2. Restart backend server
3. Add components to your pages
4. Test: Start shift → Add expense → Close shift → Check admin dashboard
5. Verify real-time updates work
