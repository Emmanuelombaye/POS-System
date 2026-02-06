import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log("Checking if shift_stock_entries table exists...");
    
    // Try to query the table
    const { data, error } = await supabase
      .from("shift_stock_entries")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log("Table does NOT exist. Error:", error.message);
      console.log("\nAttempting to create the table...");
      
      // Try to create the table by executing SQL via a stored procedure or RPC
      // Since Supabase doesn't expose direct SQL execution through JS client,
      // we need to use the HTTP API
      
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
      
      // Try using Supabase SQL function endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/q`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: sql }),
      }).catch(e => ({ status: 404, error: e }));
      
      console.log("API response status:", response.status);
    } else {
      console.log("✓ Table EXISTS!");
      console.log("Sample data:", data);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
})();
