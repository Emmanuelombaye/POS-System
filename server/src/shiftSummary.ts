import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || "eden-drop-001-secret-key-2026";

const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    (req as any).user = user;
    next();
  });
};

/**
 * 🟢 GET SHIFT SUMMARY BY DATE
 * GET /api/shift-summary?date=2026-02-04
 * Returns comprehensive summary of all closed shifts for a specific date
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)" });
    }

    console.log(`[SHIFT_SUMMARY] Fetching summary for date: ${date}`);

    // Fetch all closed shifts for the date
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("*")
      .eq("shift_date", date)
      .eq("status", "closed")
      .order("closing_time", { ascending: false });

    if (shiftsError) throw shiftsError;

    if (!shifts || shifts.length === 0) {
      return res.json({
        date,
        total_shifts: 0,
        summaries: [],
        grand_totals: {
          cash_expected: 0,
          mpesa_expected: 0,
          total_expected: 0,
          cash_reported: 0,
          mpesa_reported: 0,
          total_reported: 0,
          cash_variance: 0,
          mpesa_variance: 0,
          total_variance: 0,
          total_opening_stock: 0,
          total_closing_stock: 0,
          total_added_stock: 0,
          total_sold_stock: 0,
        },
      });
    }

    // Process each shift
    const summaries = await Promise.all(
      shifts.map(async (shift: any) => {
        // Fetch cashier info
        const { data: cashier } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", shift.cashier_id)
          .single();

        // Fetch stock entries
        const { data: stockEntries } = await supabase
          .from("shift_stock_entries")
          .select("*, products(name, category, unit_price)")
          .eq("shift_id", shift.id);

        // Calculate stock totals
        const stockTotals = (stockEntries || []).reduce(
          (acc, entry: any) => ({
            opening_stock: acc.opening_stock + (entry.opening_stock || 0),
            closing_stock: acc.closing_stock + (entry.closing_stock || 0),
            added_stock: acc.added_stock + (entry.added_stock || 0),
            sold_stock: acc.sold_stock + (entry.sold_stock || 0),
            total_variance: acc.total_variance + Math.abs(entry.variance || 0),
          }),
          { opening_stock: 0, closing_stock: 0, added_stock: 0, sold_stock: 0, total_variance: 0 }
        );

        // Fetch transactions
        const { data: transactions } = await supabase
          .from("transactions")
          .select("payment_method, total")
          .eq("shift_id", shift.id);

        // Calculate payment totals
        let cash_expected = 0;
        let mpesa_expected = 0;

        (transactions || []).forEach((tx: any) => {
          if (tx.payment_method === "cash") {
            cash_expected += tx.total || 0;
          } else if (tx.payment_method === "mpesa") {
            mpesa_expected += tx.total || 0;
          }
        });

        const cash_reported = shift.closing_cash || 0;
        const mpesa_reported = shift.closing_mpesa || 0;

        const cash_variance = cash_reported - cash_expected;
        const mpesa_variance = mpesa_reported - mpesa_expected;
        const total_variance = cash_variance + mpesa_variance;

        // Get products with variance
        const variance_details = (stockEntries || [])
          .filter((e: any) => Math.abs(e.variance || 0) > 0.01)
          .map((e: any) => ({
            product_name: e.products?.name || "Unknown",
            category: e.products?.category || "Unknown",
            opening_stock: e.opening_stock || 0,
            closing_stock: e.closing_stock || 0,
            added_stock: e.added_stock || 0,
            sold_stock: e.sold_stock || 0,
            expected_closing:
              (e.opening_stock || 0) + (e.added_stock || 0) - (e.sold_stock || 0),
            actual_closing: e.closing_stock || 0,
            variance: e.variance || 0,
          }));

        return {
          shift_id: shift.id,
          cashier_id: shift.cashier_id,
          cashier_name: cashier?.name || shift.cashier_name || "Unknown",
          cashier_email: cashier?.email || "",
          opened_at: shift.opening_time,
          closed_at: shift.closing_time,
          duration_hours: shift.closing_time
            ? Math.round(
                (new Date(shift.closing_time).getTime() -
                  new Date(shift.opening_time).getTime()) /
                  (1000 * 60 * 60) *
                  10
              ) / 10
            : 0,
          payments: {
            cash_expected,
            mpesa_expected,
            total_expected: cash_expected + mpesa_expected,
            cash_reported,
            mpesa_reported,
            total_reported: cash_reported + mpesa_reported,
            cash_variance,
            mpesa_variance,
            total_variance,
            has_variance: Math.abs(total_variance) > 1,
          },
          stock: {
            opening_stock: stockTotals.opening_stock,
            closing_stock: stockTotals.closing_stock,
            added_stock: stockTotals.added_stock,
            sold_stock: stockTotals.sold_stock,
            total_variance: stockTotals.total_variance,
            has_variance: stockTotals.total_variance > 0.5,
            variance_details,
          },
          transaction_count: transactions?.length || 0,
          products_count: stockEntries?.length || 0,
        };
      })
    );

    // Calculate grand totals
    const grand_totals = summaries.reduce(
      (acc, summary) => ({
        cash_expected: acc.cash_expected + summary.payments.cash_expected,
        mpesa_expected: acc.mpesa_expected + summary.payments.mpesa_expected,
        total_expected: acc.total_expected + summary.payments.total_expected,
        cash_reported: acc.cash_reported + summary.payments.cash_reported,
        mpesa_reported: acc.mpesa_reported + summary.payments.mpesa_reported,
        total_reported: acc.total_reported + summary.payments.total_reported,
        cash_variance: acc.cash_variance + summary.payments.cash_variance,
        mpesa_variance: acc.mpesa_variance + summary.payments.mpesa_variance,
        total_variance: acc.total_variance + summary.payments.total_variance,
        total_opening_stock: acc.total_opening_stock + summary.stock.opening_stock,
        total_closing_stock: acc.total_closing_stock + summary.stock.closing_stock,
        total_added_stock: acc.total_added_stock + summary.stock.added_stock,
        total_sold_stock: acc.total_sold_stock + summary.stock.sold_stock,
      }),
      {
        cash_expected: 0,
        mpesa_expected: 0,
        total_expected: 0,
        cash_reported: 0,
        mpesa_reported: 0,
        total_reported: 0,
        cash_variance: 0,
        mpesa_variance: 0,
        total_variance: 0,
        total_opening_stock: 0,
        total_closing_stock: 0,
        total_added_stock: 0,
        total_sold_stock: 0,
      }
    );

    res.json({
      date,
      total_shifts: shifts.length,
      summaries,
      grand_totals,
    });
  } catch (error) {
    console.error("[SHIFT_SUMMARY] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
