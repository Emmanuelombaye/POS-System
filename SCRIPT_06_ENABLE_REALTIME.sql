-- ============================================================================
-- ENABLE REAL-TIME SUBSCRIPTIONS FOR SALES MONITOR
-- ============================================================================
-- Run this in Supabase SQL Editor to enable real-time updates
-- This enables Supabase Realtime on transactions and branches tables

-- Step 1: Drop existing realtime subscriptions (if any)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Step 2: Create publication for real-time
CREATE PUBLICATION supabase_realtime FOR TABLE transactions, branches;

-- Step 3: Enable realtime on transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE branches;

-- Step 4: Verify the publication
SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';

-- ============================================================================
-- EXPLANATION:
-- - supabase_realtime publication enables Realtime broadcasting
-- - Any INSERT, UPDATE, or DELETE on these tables will be broadcast to all subscribers
-- - Frontend components using .on("postgres_changes") will receive updates instantly
-- ============================================================================
