-- SCRIPT_02_CLOSE_ALL_SHIFTS.sql
-- Close all open shifts (useful for testing/development)

-- Option 1: Mark all open shifts as closed
UPDATE public.shifts 
SET 
  status = 'closed',
  closing_time = NOW(),
  closing_cash = 0,
  closing_mpesa = 0
WHERE status = 'open';

-- Option 2: Delete all shifts entirely (use this if you want a clean slate)
-- TRUNCATE TABLE public.shifts CASCADE;
-- TRUNCATE TABLE public.shift_stock_entries CASCADE;
-- TRUNCATE TABLE public.shift_stock_snapshots CASCADE;
-- TRUNCATE TABLE public.transactions CASCADE;

COMMIT;

-- Now you can open a new shift without errors
