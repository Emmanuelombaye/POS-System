-- ========================================
-- WHOLESALE SUMMARIES TABLE SETUP
-- ========================================
-- Run this script in your Supabase SQL Editor to ensure the wholesale_summaries table exists
-- This fixes the "Failed to fetch summaries" error in the Wholesale/Market section

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the wholesale_summaries table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.wholesale_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')),
  cash_received INTEGER NOT NULL DEFAULT 0,
  mpesa_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_branch ON public.wholesale_summaries(branch);
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_date ON public.wholesale_summaries(date);
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_created_at ON public.wholesale_summaries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wholesale_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to recreate them
DROP POLICY IF EXISTS "ws_read_all" ON public.wholesale_summaries;
DROP POLICY IF EXISTS "ws_insert_all" ON public.wholesale_summaries;
DROP POLICY IF EXISTS "ws_update_all" ON public.wholesale_summaries;
DROP POLICY IF EXISTS "ws_delete_all" ON public.wholesale_summaries;

-- Create RLS policies for authenticated users
-- Allow all authenticated users to view wholesale summaries
CREATE POLICY "ws_read_all" 
  ON public.wholesale_summaries 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert wholesale summaries
CREATE POLICY "ws_insert_all" 
  ON public.wholesale_summaries 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to update wholesale summaries
CREATE POLICY "ws_update_all" 
  ON public.wholesale_summaries 
  FOR UPDATE 
  USING (true);

-- Allow authenticated users to delete wholesale summaries
CREATE POLICY "ws_delete_all" 
  ON public.wholesale_summaries 
  FOR DELETE 
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wholesale_summaries TO anon, authenticated;

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_wholesale_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS wholesale_summaries_updated_at ON public.wholesale_summaries;
CREATE TRIGGER wholesale_summaries_updated_at
  BEFORE UPDATE ON public.wholesale_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wholesale_summaries_updated_at();

-- Verify the table was created successfully
SELECT 'Wholesale summaries table created successfully!' AS status;
SELECT COUNT(*) AS total_records FROM public.wholesale_summaries;

-- Show sample data
SELECT date, branch, cash_received, mpesa_received, created_at 
FROM public.wholesale_summaries 
ORDER BY date DESC, branch 
LIMIT 10;
