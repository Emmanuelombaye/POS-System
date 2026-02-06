import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to create the shift_stock_entries table
const sql = `
CREATE TABLE IF NOT EXISTS public.shift_stock_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  branch_id TEXT NOT NULL DEFAULT 'branch1',
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,

  opening_stock DECIMAL(10, 2) DEFAULT 0,
  added_stock DECIMAL(10, 2) DEFAULT 0,
  sold_stock DECIMAL(10, 2) DEFAULT 0,
  closing_stock DECIMAL(10, 2) DEFAULT 0,
  variance DECIMAL(10, 2) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(shift_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_branch_date
ON public.shift_stock_entries(branch_id, shift_date DESC);

CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_cashier
ON public.shift_stock_entries(cashier_id, shift_date DESC);
`;

(async () => {
  try {
    console.log("Running migration to create shift_stock_entries table...");
    
    // Since Supabase JS client doesn't support raw SQL directly,
    // we'll use the Supabase HTTP API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error executing SQL:", error);
    } else {
      console.log("Migration executed successfully!");
    }
  } catch (error) {
    console.error("Failed to run migration:", error);
  }
})();
