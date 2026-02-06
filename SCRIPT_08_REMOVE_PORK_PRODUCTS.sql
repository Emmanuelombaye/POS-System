-- ============================================================================
-- SCRIPT 08: REMOVE ALL PORK PRODUCTS (SAFE CLEANUP)
-- ============================================================================
-- Removes any product that looks like pork by name/category/code
-- Also removes related rows in stock/ledger tables if they exist
-- NOTE: Must delete from tables with NOT NULL product_id constraints FIRST

-- Step 1: Get list of pork product IDs
WITH pork_products AS (
  SELECT id FROM public.products
  WHERE lower(name) LIKE '%pork%'
     OR lower(category) = 'pork'
     OR lower(code) LIKE 'pork%'
)

-- Step 2: Delete all dependent records (in order of dependencies)
DELETE FROM public.transactions
WHERE product_id IN (SELECT id FROM pork_products);

-- Step 3: Delete stock additions (also has NOT NULL product_id)
DELETE FROM public.stock_additions
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE lower(name) LIKE '%pork%'
     OR lower(category) = 'pork'
     OR lower(code) LIKE 'pork%'
);

-- Step 4: Delete other related records (these have ON DELETE CASCADE)
DELETE FROM public.inventory_ledger
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE lower(name) LIKE '%pork%'
     OR lower(category) = 'pork'
     OR lower(code) LIKE 'pork%'
);

DELETE FROM public.shift_stock_entries
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE lower(name) LIKE '%pork%'
     OR lower(category) = 'pork'
     OR lower(code) LIKE 'pork%'
);

DELETE FROM public.stock_entries
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE lower(name) LIKE '%pork%'
     OR lower(category) = 'pork'
     OR lower(code) LIKE 'pork%'
);

-- Step 5: Finally remove the pork products themselves
DELETE FROM public.products
WHERE lower(name) LIKE '%pork%'
   OR lower(category) = 'pork'
   OR lower(code) LIKE 'pork%';

-- ============================================================================
-- NOTES:
-- - Run this in Supabase SQL Editor
-- - Re-run safely anytime (idempotent)
-- ============================================================================
