-- SCRIPT_CLEANUP_DUPLICATE_SHIFTS.sql
-- Remove all test/duplicate open shifts
-- Keep only CLOSED shifts for historical reference

-- ============================================================================
-- STEP 1: DELETE ALL OPEN SHIFTS (Bad test data)
-- ============================================================================
DELETE FROM shifts WHERE status = 'open';

-- ============================================================================
-- STEP 2: VERIFY CLEANUP
-- ============================================================================
SELECT 
  COUNT(*) as open_shifts
FROM shifts 
WHERE status = 'open';

-- Expected result: 0

-- ============================================================================
-- STEP 3: CHECK REMAINING SHIFTS
-- ============================================================================
SELECT 
  id, 
  cashier_id, 
  cashier_name, 
  status, 
  shift_date, 
  created_at
FROM shifts
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- NOTES:
-- - All open shifts have been deleted
-- - Closed shifts are preserved for historical reference
-- - System will work correctly now (one shift per cashier enforced)
-- - Next shift start will create a fresh shift
-- ============================================================================
