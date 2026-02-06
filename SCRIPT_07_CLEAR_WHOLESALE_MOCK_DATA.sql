-- ========================================
-- REMOVE ANY OLD WHOLESALE MOCK DATA
-- ========================================
-- Run in Supabase SQL Editor

DELETE FROM public.wholesale_summaries
WHERE date IN ('2026-02-02', '2026-02-03');

-- Verify table is clean
SELECT COUNT(*) AS total_records FROM public.wholesale_summaries;
