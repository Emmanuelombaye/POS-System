import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to authenticate JWT
import jwt from "jsonwebtoken";
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

// ============================================================================
// COMPLETE CASHIER WORKFLOW API ENDPOINTS
// ============================================================================

/**
 * 🟢 STEP 1: START SHIFT
 * POST /api/shifts/start
 * Cashier clicks "Start Shift"
 * Records: shift start time, opening stock for all products
 */
router.post("/start", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cashier_id, cashier_name, branch_id } = req.body;
    const user = (req as any).user;

    console.log(`[SHIFT_START] Starting shift for cashier: ${cashier_name} (${cashier_id})`);

    // Auto-close any old open shifts from previous days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split("T")[0];
    
    const { data: oldShifts } = await supabase
      .from("shifts")
      .select("id")
      .eq("cashier_id", cashier_id)
      .eq("status", "open")
      .lt("shift_date", yesterdayDate);
    
    if (oldShifts && oldShifts.length > 0) {
      console.log(`[SHIFT_START] Closing ${oldShifts.length} old open shifts`);
      await supabase
        .from("shifts")
        .update({ status: "closed", closing_time: new Date().toISOString() })
        .eq("cashier_id", cashier_id)
        .eq("status", "open")
        .lt("shift_date", yesterdayDate);
    }

    // Check if cashier already has ANY open shift (across all dates)
    // A cashier can only have ONE active shift at a time
    const { data: existing, error: checkError } = await supabase
      .from("shifts")
      .select("id, opening_time, shift_date")
      .eq("cashier_id", cashier_id)
      .eq("status", "open");

    if (existing && existing.length > 0) {
      const existingShift = existing[0];
      return res.status(409).json({
        error: "Cashier already has an active shift",
        shift_id: existingShift.id,
        shift_date: existingShift.shift_date,
        opened_at: existingShift.opening_time,
        message: `You already have an open shift from ${existingShift.shift_date}. Please close it before starting a new one.`,
        code: "DUPLICATE_ACTIVE_SHIFT"
      });
    }

    // Create the shift record
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .insert({
        cashier_id,
        cashier_name: cashier_name || "Cashier",
        branch_id: branch_id || "eden-drop-tamasha",
        shift_date: new Date().toISOString().split("T")[0],
        opening_time: new Date().toISOString(),
        status: "open",
        closing_cash: 0,
        closing_mpesa: 0,
      })
      .select()
      .single();

    if (shiftError) throw shiftError;

    console.log(`[SHIFT_START] ✓ Shift created: ${shift.id}`);

    // Fetch all active products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, code, category")
      .eq("status", "active");

    if (products && shift) {
      // Get yesterday's closing stock for each product (or default to 0)
      const shiftDate = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      const { data: yesterdayEntries } = await supabase
        .from("shift_stock_entries")
        .select("product_id, closing_stock")
        .eq("branch_id", branch_id || "eden-drop-tamasha")
        .eq("shift_date", yesterdayDate);

      const yesterdayClosingMap = new Map();
      if (yesterdayEntries) {
        yesterdayEntries.forEach((e: any) =>
          yesterdayClosingMap.set(e.product_id, e.closing_stock)
        );
      }

      // Create shift_stock_entries for each product
      const entries = products.map((p: any) => {
        const openingStock =
          yesterdayClosingMap.get(p.id) ?? 0;
        return {
          shift_id: shift.id,
          cashier_id,
          branch_id: branch_id || "eden-drop-tamasha",
          product_id: p.id,
          shift_date: shiftDate,
          opening_stock: openingStock,
          added_stock: 0,
          sold_stock: 0,
          closing_stock: openingStock,
          variance: 0,
        };
      });

      console.log(
        `[SHIFT_START] Inserting ${entries.length} stock entries for shift ${shift.id}`
      );
      const { error: insertError } = await supabase
        .from("shift_stock_entries")
        .insert(entries);

      if (insertError) {
        console.error(
          `[SHIFT_START] Error inserting shift_stock_entries:`,
          insertError
        );
      } else {
        console.log(`[SHIFT_START] ✓ Successfully inserted stock entries`);
      }
    }

    res.status(201).json({
      success: true,
      shift_id: shift.id,
      message: "Shift started successfully",
      shift: {
        shift_id: shift.id,
        cashier_id,
        cashier_name,
        branch_id: branch_id || "eden-drop-tamasha",
        status: "open",
        opened_at: shift.opening_time,
        closed_at: undefined,
        closing_cash: 0,
        closing_mpesa: 0,
        total_products: products?.length || 0,
        total_sold_kg: 0,
        total_added_kg: 0,
      },
    });
  } catch (error) {
    console.error("[SHIFT_START] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 STEP 2: GET ACTIVE SHIFT
 * GET /api/shifts/active/:cashier_id
 * Fetch the cashier's active shift with all current stock data
 */
router.get("/active/:cashier_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cashier_id } = req.params;

    // Fetch active shift
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .select("*")
      .eq("cashier_id", cashier_id)
      .eq("status", "open")
      .single();

    if (shiftError || !shift) {
      return res.status(404).json({
        error: "No active shift found for cashier",
      });
    }

    // Fetch stock entries for this shift
    const { data: rawStockEntries } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, code, category, unit_price)")
      .eq("shift_id", shift.id)
      .order("products(category)", { ascending: true });

    // Transform stock entries to include product_name
    const stockEntries = (rawStockEntries || []).map((e: any) => ({
      ...e,
      product_name: e.products?.name || "Unknown",
      category: e.products?.category || "Unknown",
      unit_price: e.products?.unit_price || 0,
    }));

    // Fetch transactions for this shift
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("shift_id", shift.id)
      .order("created_at", { ascending: false });

    // Calculate totals
    const totalSold = (stockEntries || []).reduce(
      (sum, e: any) => sum + (e.sold_stock || 0),
      0
    );
    const totalAdded = (stockEntries || []).reduce(
      (sum, e: any) => sum + (e.added_stock || 0),
      0
    );

    res.json({
      shift: {
        shift_id: shift.id, // ✅ Always include shift_id for frontend consistency
        ...shift,
        opened_at: shift.opening_time || shift.opened_at,
        closed_at: shift.closing_time || shift.closed_at,
        total_products: stockEntries?.length || 0,
        total_sold_kg: totalSold,
        total_added_kg: totalAdded,
      },
      stock_entries: stockEntries || [],
      transactions: transactions || [],
    });
  } catch (error) {
    console.error("[GET_ACTIVE_SHIFT] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 STEP 3: ADD SALE (TRANSACTION)
 * POST /api/shifts/:shift_id/add-sale
 * Cashier adds items to cart and confirms sale
 * System reduces stock automatically
 */
router.post("/:shift_id/add-sale", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.params;
    const { items, payment_method } = req.body;
    const user = (req as any).user;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in sale" });
    }

    // Validate shift is open
    const { data: shift } = await supabase
      .from("shifts")
      .select("status, cashier_id, branch_id")
      .eq("id", shift_id)
      .single();

    if (!shift || shift.status !== "open") {
      return res.status(400).json({ error: "Shift is not open" });
    }

    const now = new Date();
    const transactionRows = items.map((item: any) => ({
      shift_id,
      cashier_id: shift.cashier_id,
      product_id: item.product_id,
      branch_id: shift.branch_id,
      transaction_date: now.toISOString().split("T")[0],
      transaction_time: now.toISOString(),
      quantity_kg: item.weight_kg,
      unit_price: item.unit_price,
      total: (item.weight_kg || 0) * (item.unit_price || 0),
      payment_method,
      description: item.product_name || "Sale",
    }));

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .insert(transactionRows)
      .select();

    if (txError) throw txError;

    console.log(`[ADD_SALE] Transactions created: ${transactions?.length || 0}`);

    // Update shift_stock_entries for each sold item
    for (const item of items) {
      const { data: entry } = await supabase
        .from("shift_stock_entries")
        .select("id, opening_stock, added_stock, sold_stock, closing_stock")
        .eq("shift_id", shift_id)
        .eq("product_id", item.product_id)
        .single();

      if (entry) {
        const newSold = (entry.sold_stock || 0) + (item.weight_kg || 0);
        const newClosing =
          (entry.opening_stock || 0) +
          (entry.added_stock || 0) -
          newSold;

        const { error: updateError } = await supabase
          .from("shift_stock_entries")
          .update({
            sold_stock: newSold,
            closing_stock: newClosing,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (updateError) {
          console.error(
            `[ADD_SALE] Error updating stock entry: ${updateError.message}`
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      transaction_count: transactions?.length || 0,
      message: "Sale recorded successfully",
      transactions,
    });
  } catch (error) {
    console.error("[ADD_SALE] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 STEP 4: ADD STOCK MID-SHIFT
 * POST /api/shifts/:shift_id/add-stock
 * Cashier adds stock received during shift (e.g., 23kg goat meat)
 * System updates expected stock calculation
 */
router.post("/:shift_id/add-stock", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.params;
    const { product_id, quantity_kg, supplier, notes } = req.body;
    const user = (req as any).user;

    if (!product_id || !quantity_kg || quantity_kg <= 0) {
      return res.status(400).json({
        error: "Product ID and positive quantity required",
      });
    }

    // Fetch the shift_stock_entry
    const { data: entry } = await supabase
      .from("shift_stock_entries")
      .select("id, opening_stock, added_stock, sold_stock, closing_stock")
      .eq("shift_id", shift_id)
      .eq("product_id", product_id)
      .single();

    if (!entry) {
      return res.status(404).json({
        error: "Shift stock entry not found",
      });
    }

    // Update added_stock and recalculate closing_stock
    const newAdded = (entry.added_stock || 0) + quantity_kg;
    const newClosing =
      (entry.opening_stock || 0) + newAdded - (entry.sold_stock || 0);

    const { data: updated, error: updateError } = await supabase
      .from("shift_stock_entries")
      .update({
        added_stock: newAdded,
        closing_stock: newClosing,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to inventory_ledger for tracking
    await supabase.from("inventory_ledger").insert({
      event_type: "STOCK_ADDED",
      item_id: product_id,
      quantity_kg,
      shift_id,
      user_id: user.id,
    });

    console.log(
      `[ADD_STOCK] Added ${quantity_kg}kg to product ${product_id} in shift ${shift_id}`
    );

    res.json({
      success: true,
      message: "Stock added successfully",
      updated_entry: updated,
      expected_calculation: {
        opening_stock: entry.opening_stock,
        added_stock: newAdded,
        sold_stock: entry.sold_stock,
        expected_stock: newClosing,
      },
    });
  } catch (error) {
    console.error("[ADD_STOCK] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 STEP 5: CLOSE SHIFT
 * POST /api/shifts/:shift_id/close
 * Cashier enters closing stock for each product and payment totals
 * System calculates variance and stores reconciliation data
 */
router.post("/:shift_id/close", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.params;
    const { closing_stock_map, cash_received, mpesa_received } = req.body;

    if (!closing_stock_map || Object.keys(closing_stock_map).length === 0) {
      return res.status(400).json({
        error: "Closing stock for all products is required",
      });
    }

    if (cash_received === undefined || mpesa_received === undefined) {
      return res.status(400).json({
        error: "Cash and M-Pesa totals are required",
      });
    }

    console.log(
      `[SHIFT_CLOSE] Closing shift ${shift_id} with cash: ${cash_received}, mpesa: ${mpesa_received}`
    );

    // Fetch the shift
    const { data: shift } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", shift_id)
      .single();

    if (!shift || shift.status !== "open") {
      return res.status(400).json({ error: "Shift is not open" });
    }

    // Update shift status
    const { data: updatedShift, error: shiftError } = await supabase
      .from("shifts")
      .update({
        status: "closed",
        closing_time: new Date().toISOString(),
        closing_cash: cash_received,
        closing_mpesa: mpesa_received,
      })
      .eq("id", shift_id)
      .select()
      .single();

    if (shiftError) throw shiftError;

    console.log(`[SHIFT_CLOSE] Shift status updated to CLOSED`);

    // Update closing stock for each product and calculate variance
    let total_variance = 0;
    const variance_details = [];

    for (const [product_id, closing_stock] of Object.entries(closing_stock_map)) {
      const { data: entry } = await supabase
        .from("shift_stock_entries")
        .select("*")
        .eq("shift_id", shift_id)
        .eq("product_id", product_id)
        .single();

      if (entry) {
        // Calculate expected stock
        const expected_stock =
          (entry.opening_stock || 0) +
          (entry.added_stock || 0) -
          (entry.sold_stock || 0);

        // Calculate variance
        const variance = (closing_stock as number) - expected_stock;
        total_variance += Math.abs(variance);

        // Update the entry
        const { error: updateError } = await supabase
          .from("shift_stock_entries")
          .update({
            closing_stock: closing_stock,
            variance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (updateError) {
          console.error(`[SHIFT_CLOSE] Error updating entry: ${updateError.message}`);
        }

        variance_details.push({
          product_id,
          expected_stock,
          actual_closing: closing_stock,
          variance,
        });

        console.log(
          `[SHIFT_CLOSE] Product ${product_id}: Expected ${expected_stock}kg, Actual ${closing_stock}kg, Variance ${variance}kg`
        );
      }
    }

    // Fetch all transactions for this shift to calculate totals
    const { data: transactions } = await supabase
      .from("transactions")
      .select("payment_method, total")
      .eq("shift_id", shift_id);

    let calculated_cash = 0;
    let calculated_mpesa = 0;

    (transactions || []).forEach((tx: any) => {
      if (tx.payment_method === "cash") {
        calculated_cash += tx.total || 0;
      } else if (tx.payment_method === "mpesa") {
        calculated_mpesa += tx.total || 0;
      }
    });

    // ✨ FETCH AND CALCULATE EXPENSES
    const { data: expenses } = await supabase
      .from("expenses")
      .select("payment_method, amount")
      .eq("shift_id", shift_id);

    let cash_expenses = 0;
    let mpesa_expenses = 0;
    let total_expenses = 0;

    (expenses || []).forEach((exp: any) => {
      const amount = exp.amount || 0;
      total_expenses += amount;
      if (exp.payment_method === "cash") {
        cash_expenses += amount;
      } else if (exp.payment_method === "mpesa") {
        mpesa_expenses += amount;
      }
    });

    // 🧮 ADJUST CASH/MPESA WITH EXPENSES
    // Expected cash = Sales - Expenses
    const expected_cash = calculated_cash - cash_expenses;
    const expected_mpesa = calculated_mpesa - mpesa_expenses;

    const cash_variance = cash_received - expected_cash;
    const mpesa_variance = mpesa_received - expected_mpesa;

    console.log(`[SHIFT_CLOSE] Cash Sales: ${calculated_cash}, Expenses: ${cash_expenses}, Expected: ${expected_cash}, Received: ${cash_received}, Variance: ${cash_variance}`);
    console.log(`[SHIFT_CLOSE] MPESA Sales: ${calculated_mpesa}, Expenses: ${mpesa_expenses}, Expected: ${expected_mpesa}, Received: ${mpesa_received}, Variance: ${mpesa_variance}`);
    console.log(`[SHIFT_CLOSE] ✓ Shift closed successfully`);

    res.json({
      success: true,
      message: "Shift closed successfully",
      shift: {
        ...updatedShift,
        opened_at: updatedShift.opening_time || updatedShift.opened_at,
        closed_at: updatedShift.closing_time || updatedShift.closed_at,
      },
      reconciliation: {
        stock_reconciliation: {
          total_products: variance_details.length,
          total_variance_kg: total_variance,
          variance_details,
        },
        payment_reconciliation: {
          cash: {
            calculated: calculated_cash,
            expenses: cash_expenses,
            expected: expected_cash,
            reported: cash_received,
            variance: cash_variance,
          },
          mpesa: {
            calculated: calculated_mpesa,
            expenses: mpesa_expenses,
            expected: expected_mpesa,
            reported: mpesa_received,
            variance: mpesa_variance,
          },
          total_sales: calculated_cash + calculated_mpesa,
          total_expenses: total_expenses,
          total_expected: expected_cash + expected_mpesa,
          total_reported: cash_received + mpesa_received,
        },
        expenses: {
          total: total_expenses,
          cash: cash_expenses,
          mpesa: mpesa_expenses,
          count: expenses?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("[SHIFT_CLOSE] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 ADMIN: GET SHIFT DETAILS WITH ALL DATA
 * GET /api/shifts/:shift_id/details
 * Admin fetches complete shift information in real-time
 */
router.get("/:shift_id/details", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.params;

    // Fetch shift
    const { data: shift } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", shift_id)
      .single();

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Fetch cashier info
    const { data: cashier } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", shift.cashier_id)
      .single();

    // Fetch stock entries
    const { data: rawStockEntries } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, code, category, unit_price)")
      .eq("shift_id", shift_id)
      .order("products(category)", { ascending: true });

    // Transform stock entries to include product_name
    const stockEntries = (rawStockEntries || []).map((e: any) => ({
      ...e,
      product_name: e.products?.name || "Unknown",
      category: e.products?.category || "Unknown",
      unit_price: e.products?.unit_price || 0,
    }));

    // Fetch transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("shift_id", shift_id)
      .order("created_at", { ascending: false });

    // Calculate totals
    const totals = {
      opening_stock: (stockEntries || []).reduce((sum, e: any) => sum + (e.opening_stock || 0), 0),
      added_stock: (stockEntries || []).reduce((sum, e: any) => sum + (e.added_stock || 0), 0),
      sold_stock: (stockEntries || []).reduce((sum, e: any) => sum + (e.sold_stock || 0), 0),
      expected_closing: 0,
      actual_closing: (stockEntries || []).reduce((sum, e: any) => sum + (e.closing_stock || 0), 0),
      total_variance: (stockEntries || []).reduce((sum, e: any) => sum + Math.abs(e.variance || 0), 0),
    };

    totals.expected_closing = totals.opening_stock + totals.added_stock - totals.sold_stock;

    // Payment totals
    let cash_total = 0;
    let mpesa_total = 0;

    (transactions || []).forEach((tx: any) => {
      if (tx.payment_method === "cash") cash_total += tx.total || 0;
      else if (tx.payment_method === "mpesa") mpesa_total += tx.total || 0;
    });

    res.json({
      shift: {
        shift_id: shift.id, // ✅ Include shift_id for frontend consistency
        ...shift,
        opened_at: shift.opening_time || shift.opened_at,
        closed_at: shift.closing_time || shift.closed_at,
        cashier: cashier || null,
      },
      stock_reconciliation: {
        entries: stockEntries || [],
        totals,
        alerts: (stockEntries || [])
          .filter((e: any) => Math.abs(e.variance || 0) > 0.1)
          .map((e: any) => ({
            product_id: e.product_id,
            product_name: e.products?.name,
            expected: (e.opening_stock || 0) + (e.added_stock || 0) - (e.sold_stock || 0),
            actual: e.closing_stock,
            variance: e.variance,
          })),
      },
      payment_reconciliation: {
        transactions: transactions || [],
        totals: {
          cash: cash_total,
          mpesa: mpesa_total,
          total: cash_total + mpesa_total,
        },
        reported: {
          cash: shift.closing_cash,
          mpesa: shift.closing_mpesa,
          total: (shift.closing_cash || 0) + (shift.closing_mpesa || 0),
        },
        variance: {
          cash: (shift.closing_cash || 0) - cash_total,
          mpesa: (shift.closing_mpesa || 0) - mpesa_total,
        },
      },
    });
  } catch (error) {
    console.error("[GET_SHIFT_DETAILS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 ADMIN: GET ALL SHIFTS (with optional status filter)
 * GET /api/shifts?status=open
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from("shifts")
      .select("*")
      .order("opening_time", { ascending: false });

    if (status) {
      const statusLower = (status as string).toLowerCase();
      query = query.eq("status", statusLower);
    }

    const { data: shifts, error } = await query;

    if (error) throw error;

    // ✅ Map shifts to include shift_id for frontend consistency
    const shiftsWithShiftId = (shifts || []).map((shift: any) => ({
      ...shift,
      shift_id: shift.id,
    }));

    res.json(shiftsWithShiftId);
  } catch (error) {
    console.error("[GET_ALL_SHIFTS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 GET CASHIER SHIFT SUMMARY (END-OF-SHIFT PERFORMANCE)
 * GET /api/shifts/summary?date=YYYY-MM-DD (optional, defaults to today)
 * Returns closed shifts for selected date with cashier performance and stock deficiency
 */
router.get("/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? String(date) : new Date().toISOString().split("T")[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    console.log(`[SHIFT_SUMMARY] Fetching shifts for date: ${selectedDate}`);

    // Get all closed shifts for selected date
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("id, cashier_id, closing_time, closing_cash, closing_mpesa, shift_date")
      .eq("shift_date", selectedDate)
      .eq("status", "closed")
      .order("closing_time", { ascending: false });

    if (shiftsError) throw shiftsError;

    if (!shifts || shifts.length === 0) {
      return res.json({
        date: selectedDate,
        summaries: [],
        grand_totals: {
          cash_recorded: 0,
          mpesa_recorded: 0,
          total_recorded: 0,
          total_stock_deficiency_kg: 0,
          total_transactions: 0,
        },
      });
    }

    const summaries = await Promise.all(
      shifts.map(async (shift: any) => {
        // Get cashier info
        const { data: cashier } = await supabase
          .from("users")
          .select("id, name")
          .eq("id", shift.cashier_id)
          .single();

        // Get stock entries for this shift (opening and closing)
        const { data: stockEntries } = await supabase
          .from("shift_stock_entries")
          .select("opening_stock, added_stock, sold_stock, closing_stock")
          .eq("shift_id", shift.id);

        // Calculate stock totals
        const openingStock = (stockEntries || []).reduce((sum, e: any) => sum + (e.opening_stock || 0), 0);
        const closingStock = (stockEntries || []).reduce((sum, e: any) => sum + (e.closing_stock || 0), 0);
        const addedStock = (stockEntries || []).reduce((sum, e: any) => sum + (e.added_stock || 0), 0);
        const soldStock = (stockEntries || []).reduce((sum, e: any) => sum + (e.sold_stock || 0), 0);

        // Calculate deficiency: opening + added - sold - closing = deficiency
        // If closing stock is less than expected, there's deficiency
        const expectedClosing = openingStock + addedStock - soldStock;
        const stockDeficiency = Math.max(expectedClosing - closingStock, 0);
        const deficiencyPercent = openingStock > 0 ? (stockDeficiency / openingStock) * 100 : 0;

        // Get transaction count
        const { data: transactions } = await supabase
          .from("transactions")
          .select("id")
          .eq("shift_id", shift.id);

        // Check if recent (within last hour)
        const closedTime = new Date(shift.closing_time).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - closedTime) / (1000 * 60);
        const isRecent = diffMinutes <= 60;

        return {
          shift_id: shift.id,
          cashier_id: shift.cashier_id,
          cashier_name: cashier?.name || "Unknown",
          closed_at: shift.closing_time,
          cash_recorded: shift.closing_cash || 0,
          mpesa_recorded: shift.closing_mpesa || 0,
          total_recorded: (shift.closing_cash || 0) + (shift.closing_mpesa || 0),
          opening_stock_kg: openingStock,
          added_stock_kg: addedStock,
          sold_stock_kg: soldStock,
          closing_stock_kg: closingStock,
          expected_closing_kg: expectedClosing,
          stock_deficiency_kg: stockDeficiency,
          deficiency_percent: deficiencyPercent,
          transaction_count: transactions?.length || 0,
          is_recent: isRecent,
        };
      })
    );

    // Calculate grand totals
    const grandTotals = {
      cash_recorded: summaries.reduce((sum, s) => sum + s.cash_recorded, 0),
      mpesa_recorded: summaries.reduce((sum, s) => sum + s.mpesa_recorded, 0),
      total_recorded: summaries.reduce((sum, s) => sum + s.total_recorded, 0),
      total_stock_deficiency_kg: summaries.reduce((sum, s) => sum + s.stock_deficiency_kg, 0),
      total_transactions: summaries.reduce((sum, s) => sum + s.transaction_count, 0),
    };

    res.json({
      date: selectedDate,
      summaries,
      grand_totals: grandTotals,
    });
  } catch (error) {
    console.error("[GET_CASHIER_SHIFT_SUMMARY] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 GET ALL SHIFTS FOR A CASHIER
 * GET /api/shifts/cashier/:cashier_id
 */
router.get("/cashier/:cashier_id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cashier_id } = req.params;

    const { data: shifts, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("cashier_id", cashier_id)
      .order("opening_time", { ascending: false });

    if (error) throw error;

    // ✅ Map shifts to include shift_id for frontend consistency
    const shiftsWithShiftId = (shifts || []).map((shift: any) => ({
      ...shift,
      shift_id: shift.id,
    }));

    res.json(shiftsWithShiftId);
  } catch (error) {
    console.error("[GET_CASHIER_SHIFTS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
