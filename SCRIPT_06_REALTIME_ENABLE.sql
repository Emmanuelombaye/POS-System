-- ========================================
-- REAL-TIME ENABLEMENT + TRANSACTION BRANCH SUPPORT
-- ========================================
-- Run this in Supabase SQL Editor

-- 1) Ensure transactions have created_at (if missing)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2) Ensure transactions have branch_id (for accurate branch aggregation)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- Optional: index for faster branch/date queries
CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON public.transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3) Enable realtime on the required tables (with error handling)
DO $$
BEGIN
    -- Try to add transactions table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
        RAISE NOTICE 'Added transactions to realtime publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'transactions already in realtime publication - skipping';
    END;

    -- Try to add wholesale_summaries table
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wholesale_summaries;
        RAISE NOTICE 'Added wholesale_summaries to realtime publication';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'wholesale_summaries already in realtime publication - skipping';
    END;
END $$;
