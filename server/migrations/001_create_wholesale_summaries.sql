-- Migration: Create Wholesale Summaries Table
-- Date: 2026-01-29
-- Description: Creates the wholesale_summaries table for tracking daily wholesale/market sales by branch

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the wholesale_summaries table
CREATE TABLE IF NOT EXISTS public.wholesale_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('Branch 1', 'Branch 2', 'Branch 3')),
  cash_received INTEGER NOT NULL DEFAULT 0,
  mpesa_received INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_branch 
  ON public.wholesale_summaries(branch);

CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_date 
  ON public.wholesale_summaries(date);

CREATE INDEX IF NOT EXISTS idx_wholesale_summaries_created_at 
  ON public.wholesale_summaries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wholesale_summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin-only access
-- Allow authenticated admins to view all summaries
CREATE POLICY "Allow authenticated users to view wholesale summaries"
  ON public.wholesale_summaries
  FOR SELECT
  USING (true);

-- Allow authenticated admins to insert summaries
CREATE POLICY "Allow authenticated users to insert wholesale summaries"
  ON public.wholesale_summaries
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to delete summaries
CREATE POLICY "Allow authenticated users to delete wholesale summaries"
  ON public.wholesale_summaries
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.wholesale_summaries TO anon, authenticated;

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_wholesale_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS wholesale_summaries_updated_at ON public.wholesale_summaries;
CREATE TRIGGER wholesale_summaries_updated_at
  BEFORE UPDATE ON public.wholesale_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wholesale_summaries_updated_at();
