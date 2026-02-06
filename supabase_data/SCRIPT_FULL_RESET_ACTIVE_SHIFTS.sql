-- SCRIPT_FULL_RESET_ACTIVE_SHIFTS.sql
-- Complete reset: Delete ALL open shifts and related data
-- After running this, all cashiers can start fresh shifts

-- ============================================================================
-- STEP 1: GET COUNT OF SHIFTS TO BE DELETED
-- ============================================================================
SELECT COUNT(*) as open_shifts_to_delete
FROM shifts
WHERE status = 'open';

-- ============================================================================
-- STEP 2: DELETE ALL STOCK ENTRIES FOR OPEN SHIFTS
-- ============================================================================
DELETE FROM shift_stock_entries
WHERE shift_id IN (
  SELECT id FROM shifts WHERE status = 'open'
);

-- Verify deletion
SELECT COUNT(*) as remaining_stock_entries
FROM shift_stock_entries
WHERE shift_id IN (
  SELECT id FROM shifts WHERE status = 'open'
);

-- ============================================================================
-- STEP 3: DELETE ALL TRANSACTIONS FOR OPEN SHIFTS
-- ============================================================================
DELETE FROM transactions
WHERE shift_id IN (
  SELECT id FROM shifts WHERE status = 'open'
);

-- Verify deletion
SELECT COUNT(*) as remaining_transactions
FROM transactions
WHERE shift_id IN (
  SELECT id FROM shifts WHERE status = 'open'
);

-- ============================================================================
-- STEP 4: DELETE ALL OPEN SHIFTS
-- ============================================================================
DELETE FROM shifts
WHERE status = 'open';

-- ============================================================================
-- STEP 5: VERIFY ALL OPEN SHIFTS DELETED
-- ============================================================================
SELECT COUNT(*) as open_shifts_remaining
FROM shifts
WHERE status = 'open';

-- Expected result: 0

-- ============================================================================
-- STEP 6: SHOW REMAINING CLOSED SHIFTS (FOR REFERENCE)
-- ============================================================================
SELECT 
  id,
  cashier_id,
  cashier_name,
  branch_id,
  shift_date,
  status,
  opening_time,
  closing_time
FROM shifts
WHERE status = 'closed'
ORDER BY closing_time DESC
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ All open shifts deleted
-- ✅ All associated stock entries deleted
-- ✅ All associated transactions deleted
-- ✅ System is ready for fresh starts
-- 
-- Next steps:
-- 1. Clear browser localStorage: Press F12 → Console → localStorage.clear()
-- 2. Refresh page: F5
-- 3. All users can now start fresh shifts
-- 
-- You will see:
-- - Login page (fresh)
-- - "Start Your Shift" button (no active shift)
-- - Can create new shifts without errors
-- ============================================================================
