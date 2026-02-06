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
// EXPENSE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * 🟢 ADD EXPENSE
 * POST /api/expenses
 * Cashier adds an expense during shift
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id, cashier_id, branch_id, amount, category, description, payment_method } = req.body;
    const user = (req as any).user;

    // Validate required fields
    if (!shift_id || !cashier_id || !branch_id || !amount || !category || !payment_method) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Verify shift exists (allow open or just-closed shifts)
    const { data: shift } = await supabase
      .from("shifts")
      .select("id, status")
      .eq("id", shift_id)
      .single();

    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    // Allow expenses for open shifts OR closed shifts (to handle edge cases)
    // if (shift.status !== "open" && shift.status !== "closed") {
    //   return res.status(400).json({ error: "Cannot add expense to this shift" });
    // }

    // Create expense (handle both approved and approved_by_admin schemas)
    const baseInsert = {
      shift_id,
      cashier_id,
      branch_id,
      amount,
      category,
      description: description || "",
      payment_method,
      created_at: new Date().toISOString(),
    };

    let expense: any;
    let expenseError: any;

    ({ data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({ ...baseInsert, approved_by_admin: false })
      .select()
      .single());

    if (expenseError && String(expenseError.message || expenseError).toLowerCase().includes("approved_by_admin")) {
      ({ data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({ ...baseInsert, approved: false })
        .select()
        .single());
    }

    if (expenseError) throw expenseError;

    console.log(`[EXPENSE_ADD] Expense created: ${expense.id} for shift ${shift_id}`);

    res.json({
      success: true,
      expense,
      message: "Expense recorded successfully",
    });
  } catch (error) {
    console.error("[EXPENSE_ADD] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 GET EXPENSES
 * GET /api/expenses?shift_id=X&cashier_id=Y&date=YYYY-MM-DD
 * Fetch expenses with filters
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id, cashier_id, branch_id, date, start_date, end_date, approved, page, limit } = req.query;
    const user = (req as any).user;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 25));
    const rangeFrom = (pageNumber - 1) * limitNumber;
    const rangeTo = rangeFrom + limitNumber - 1;

    const normalizeDate = (value: unknown, endOfDay: boolean) => {
      if (!value) return undefined;
      const str = String(value);
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
      if (isDateOnly) {
        return `${str}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
      }
      const parsed = new Date(str);
      if (Number.isNaN(parsed.getTime())) return undefined;
      return parsed.toISOString();
    };

    let query = supabase
      .from("expenses")
      .select(
        `*, cashier:users!cashier_id(name, email), shift:shifts(id, shift_date, status)`
        , { count: "exact" }
      );

    if (shift_id) query = query.eq("shift_id", shift_id);
    if (cashier_id) query = query.eq("cashier_id", cashier_id);
    if (branch_id) query = query.eq("branch_id", branch_id);
    const approvedFilter = approved !== undefined ? approved === "true" : undefined;

    // Filter by date if provided
    if (date) {
      const dateStr = String(date);
      query = query
        .gte("created_at", `${dateStr}T00:00:00Z`)
        .lte("created_at", `${dateStr}T23:59:59Z`);
    } else if (start_date || end_date) {
      const startIso = normalizeDate(start_date, false);
      const endIso = normalizeDate(end_date, true);
      if (startIso) query = query.gte("created_at", startIso);
      if (endIso) query = query.lte("created_at", endIso);
    }

    let expenses: any[] | null = null;
    let error: any = null;
    let count: number | null = null;

    const runQuery = async (approvedColumn?: "approved" | "approved_by_admin") => {
      let q = query;
      if (approvedColumn && approvedFilter !== undefined) {
        q = q.eq(approvedColumn, approvedFilter);
      }
      const result = await q.order("created_at", { ascending: false }).range(rangeFrom, rangeTo);
      return result;
    };

    ({ data: expenses, error, count } = await runQuery("approved"));
    if (error && String(error.message || error).toLowerCase().includes("approved")) {
      ({ data: expenses, error, count } = await runQuery("approved_by_admin"));
    }

    if (error) throw error;

    const normalized = (expenses || []).map((e: any) => ({
      ...e,
      approved: e.approved ?? e.approved_by_admin ?? false,
    }));

    console.log(`[EXPENSE_GET] Fetched ${expenses?.length || 0} expenses`);

    res.json({
      expenses: normalized,
      total: normalized.reduce((sum, e) => sum + e.amount, 0) || 0,
      totalCount: count || 0,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("[EXPENSE_GET] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 UPDATE EXPENSE
 * PATCH /api/expenses/:id
 * Update expense or approve it (admin only)
 */
router.patch("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, category, description, payment_method, approved } = req.body;
    const user = (req as any).user;

    // Get current expense
    const { data: currentExpense } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (!currentExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const isApproved = currentExpense.approved ?? currentExpense.approved_by_admin ?? false;

    // Only allow editing if shift is still open and expense not approved
    if (isApproved) {
      return res.status(400).json({ error: "Cannot edit approved expense" });
    }

    const { data: shift } = await supabase
      .from("shifts")
      .select("status")
      .eq("id", currentExpense.shift_id)
      .single();

    if (shift?.status !== "open") {
      return res.status(400).json({ error: "Cannot edit expense for closed shift" });
    }

    // Update fields
    const updateData: any = {};
    if (amount !== undefined) {
      if (amount <= 0) return res.status(400).json({ error: "Amount must be greater than 0" });
      updateData.amount = amount;
    }
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (payment_method) updateData.payment_method = payment_method;
    if (approved !== undefined) updateData.approved = approved;

    let updated: any;
    let error: any;

    ({ data: updated, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single());

    if (error && approved !== undefined && String(error.message || error).toLowerCase().includes("approved")) {
      const { approved: approvedValue, ...rest } = updateData;
      ({ data: updated, error } = await supabase
        .from("expenses")
        .update({ ...rest, approved_by_admin: approvedValue })
        .eq("id", id)
        .select()
        .single());
    }

    if (error) throw error;

    const normalized = {
      ...updated,
      approved: updated.approved ?? updated.approved_by_admin ?? false,
    };

    console.log(`[EXPENSE_UPDATE] Expense ${id} updated`);

    res.json({
      success: true,
      expense: normalized,
    });
  } catch (error) {
    console.error("[EXPENSE_UPDATE] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 DELETE EXPENSE
 * DELETE /api/expenses/:id
 * Delete expense (only before shift closes)
 */
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const { data: expense } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Cannot delete approved expenses
    if (expense.approved) {
      return res.status(400).json({ error: "Cannot delete approved expense" });
    }

    // Check if shift is still open
    const { data: shift } = await supabase
      .from("shifts")
      .select("status")
      .eq("id", expense.shift_id)
      .single();

    if (shift?.status !== "open") {
      return res.status(400).json({ error: "Cannot delete expense for closed shift" });
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    console.log(`[EXPENSE_DELETE] Expense ${id} deleted`);

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("[EXPENSE_DELETE] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 GET SHIFT EXPENSES SUMMARY
 * GET /api/expenses/shift/:shiftId/summary
 * Get total expenses for a shift
 */
router.get("/shift/:shiftId/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("shift_id", shiftId);

    if (error) throw error;

    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const approvedExpenses = expenses?.filter(e => e.approved).reduce((sum, e) => sum + e.amount, 0) || 0;
    const pendingExpenses = expenses?.filter(e => !e.approved).reduce((sum, e) => sum + e.amount, 0) || 0;

    res.json({
      total_expenses: totalExpenses,
      approved_expenses: approvedExpenses,
      pending_expenses: pendingExpenses,
      count: expenses?.length || 0,
      expenses: expenses || [],
    });
  } catch (error) {
    console.error("[EXPENSE_SUMMARY] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * 🟢 GET EXPENSE ANALYTICS
 * GET /api/expenses/analytics?branch_id=X&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get comprehensive expense analytics for admin dashboard
 */
router.get("/analytics", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const user = (req as any).user;

    // Build date range (default to last 30 days)
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let query = supabase
      .from("expenses")
      .select(`
        *,
        cashier:users!cashier_id(name, email),
        shift:shifts(id, shift_date, status)
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (branch_id) query = query.eq("branch_id", branch_id);

    const { data: expenses, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate summary metrics
    const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const cashExpenses = expenses?.filter(e => e.payment_method === "cash")
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const mpesaExpenses = expenses?.filter(e => e.payment_method === "mpesa")
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const approvedExpenses = expenses?.filter(e => e.approved)
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const pendingExpenses = expenses?.filter(e => !e.approved)
      .reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    expenses?.forEach(exp => {
      const cat = exp.category || "Other";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount;
    });

    const categoryData = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Daily expenses trend
    const dailyExpenses: { [key: string]: { total: number; count: number } } = {};
    expenses?.forEach(exp => {
      const date = new Date(exp.created_at).toISOString().split("T")[0];
      if (!dailyExpenses[date]) {
        dailyExpenses[date] = { total: 0, count: 0 };
      }
      dailyExpenses[date].total += exp.amount;
      dailyExpenses[date].count += 1;
    });

    const dailyData = Object.entries(dailyExpenses)
      .map(([date, data]) => ({
        date,
        amount: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top spenders (cashiers with most expenses)
    const cashierExpenses: { [key: string]: { name: string; total: number; count: number } } = {};
    expenses?.forEach(exp => {
      const cashierId = exp.cashier_id;
      const cashierName = exp.cashier?.name || "Unknown";
      if (!cashierExpenses[cashierId]) {
        cashierExpenses[cashierId] = { name: cashierName, total: 0, count: 0 };
      }
      cashierExpenses[cashierId].total += exp.amount;
      cashierExpenses[cashierId].count += 1;
    });

    const topSpenders = Object.values(cashierExpenses)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Recent high expenses (over 1000 KES)
    const highExpenses = expenses?.filter(e => e.amount > 1000)
      .slice(0, 10) || [];

    console.log(`[EXPENSE_ANALYTICS] Fetched analytics: ${expenses?.length || 0} expenses`);

    res.json({
      summary: {
        totalExpenses,
        cashExpenses,
        mpesaExpenses,
        approvedExpenses,
        pendingExpenses,
        expenseCount: expenses?.length || 0,
        averageExpense: expenses?.length ? totalExpenses / expenses.length : 0,
      },
      categoryData,
      dailyData,
      topSpenders,
      highExpenses,
      recentExpenses: expenses?.slice(0, 20) || [],
    });
  } catch (error) {
    console.error("[EXPENSE_ANALYTICS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
