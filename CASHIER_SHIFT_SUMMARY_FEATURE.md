# Cashier End-of-Shift Summary Feature

## Overview
Added a new **Real-Time Cashier End-of-Shift Summary Table** to the Sales Real-Time Monitor dashboard. This table displays:
- Cashier name and ID
- Cash amount recorded at shift end
- M-Pesa amount recorded at shift end
- Total amount (cash + mpesa)
- **Stock deficiency** (based on opening vs closing stock)
- Transaction count
- Live status indicator

## What's New

### Frontend Components

#### 1. New Hook: `useCashierShiftSummary`
**File:** `src/hooks/useCashierShiftSummary.ts`

Features:
- Fetches closed shifts from backend API (`/api/shifts/summary/today`)
- Real-time subscription to shift updates via Supabase
- 5-second polling fallback for live data
- Transforms and caches data locally
- Error handling and loading states

```typescript
const { cashierSummaries, loading, error, lastUpdate, refetch } = useCashierShiftSummary();
```

#### 2. Updated Component: `SalesRealTimeMonitor`
**File:** `src/components/admin/SalesRealTimeMonitor.tsx`

New Table Features:
- **Cashier** column: Shows cashier name + ID
- **Cash** column: Amount recorded in cash (right-aligned, KES format)
- **M-Pesa** column: Amount recorded via M-Pesa (right-aligned, KES format)
- **Total Amount** column: Combined cash + mpesa (bold, larger font)
- **Stock Deficiency** column: Shows kg deficiency and % (highlighted in orange if > 0.5kg)
- **Transactions** column: Count of transactions during shift
- **Status** column: "Recent" (pulsing green) or "Closed" badge

Bottom summary shows:
- Total Cash across all cashiers
- Total M-Pesa across all cashiers
- Grand Total (all payments)
- Total Stock Deficiency (all cashiers combined)

### Backend API

#### New Endpoint: `GET /api/shifts/summary/today`
**File:** `server/src/shifts.ts`

Provides aggregated cashier performance data:

```json
{
  "date": "2026-02-05",
  "summaries": [
    {
      "shift_id": "shift-123",
      "cashier_id": "c1",
      "cashier_name": "Amina",
      "closed_at": "2026-02-05T17:30:00Z",
      "cash_recorded": 45000,
      "mpesa_recorded": 25000,
      "total_recorded": 70000,
      "opening_stock_kg": 150,
      "closing_stock_kg": 120,
      "expected_closing_kg": 125,
      "stock_deficiency_kg": 5,
      "deficiency_percent": 3.33,
      "transaction_count": 24,
      "is_recent": true
    }
  ],
  "grand_totals": {
    "cash_recorded": 135000,
    "mpesa_recorded": 65000,
    "total_recorded": 200000,
    "total_stock_deficiency_kg": 12.5,
    "total_transactions": 72
  }
}
```

**Stock Deficiency Calculation:**
```
Expected Closing = Opening Stock + Added Stock - Sold Stock
Stock Deficiency = Expected Closing - Actual Closing
Deficiency % = (Stock Deficiency / Opening Stock) * 100
```

## How It Works

### Real-Time Updates Flow

1. **Cashier closes shift** → Backend updates `shifts` table with `closing_cash`, `closing_mpesa`
2. **Supabase triggers** → Real-time subscription detects shift status = "closed"
3. **Hook fetches data** → Calls `/api/shifts/summary/today` endpoint
4. **Frontend renders** → Table updates with new cashier data
5. **Polling backup** → Every 5 seconds, data refreshes to ensure sync

### Data Refresh Triggers

- **Real-time:** Shift UPDATE event (when shift is closed)
- **Polling:** Every 5 seconds as fallback
- **Manual:** Refresh button in the UI
- **Component lifecycle:** Initial fetch on mount

## Visual Design

- **Header:** Rose/Pink gradient background (`from-rose-500 to-pink-600`)
- **Table rows:** Hover effect (light gray background)
- **Deficiency highlighting:** Orange background if > 0.5kg deficiency
- **Status badges:** 
  - ✅ "Recent" (pulsing green) = Closed within last hour
  - "Closed" (gray) = Closed over an hour ago
- **Summary footer:** Rose background with 4-column grid breakdown

## Database Schema Used

Queries from:
- `shifts` - shift data (id, cashier_id, closing_time, closing_cash, closing_mpesa, status, shift_date)
- `users` - cashier names (id, name)
- `shift_stock_entries` - stock tracking (shift_id, opening_stock, added_stock, sold_stock, closing_stock)
- `transactions` - transaction count (shift_id)

## Performance Considerations

✅ **Optimized for production:**
- Backend does heavy lifting (calculations, joins)
- Client just renders formatted data
- 5-second polling (not 1 second) to reduce load
- Supabase real-time subscriptions minimize polling dependency
- Responses limited to today's closed shifts only

## Error Handling

- Loading state: "Loading shift summaries..."
- No data state: "No closed shifts today"
- Error state: Shows error message from API
- Network errors: Graceful fallback with console logging

## Testing Checklist

- [ ] Close a shift as cashier → See data appear in table (5-60 seconds)
- [ ] Check stock deficiency calculation matches manual math
- [ ] Verify real-time pulsing on recently-closed shifts
- [ ] Test refresh button updates table
- [ ] Verify grand totals at bottom match sum of individual rows
- [ ] Test on multiple branches (if applicable)
- [ ] Check responsive design on mobile (table scrolls horizontally)

## No Breaking Changes

✅ Existing features unaffected:
- Cash/M-Pesa transaction tables still work
- Branch summary table still works
- All other admin dashboards functional
- Backend routes preserved

## Future Enhancements

Possible additions:
- Filter by branch
- Export to CSV/PDF
- Stock deficiency trend chart
- Alert thresholds for high deficiency
- Manager approval workflow for variances
