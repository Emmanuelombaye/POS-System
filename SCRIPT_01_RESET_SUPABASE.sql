-- ============================================================================
-- EDEN TOP POS - SCRIPT 1: RESET EVERYTHING
-- ============================================================================
-- Run this FIRST to completely reset your Supabase database
-- Copy and paste the ENTIRE content into Supabase SQL Editor and click RUN
-- ============================================================================

-- Step 1: Drop all tables (cascading deletes dependent tables)
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- RESET COMPLETE
-- ============================================================================
-- All tables have been deleted. Your database is now blank.
-- Next: Run SCRIPT_02_SETUP_FRESH.sql to create and populate tables
-- ============================================================================
