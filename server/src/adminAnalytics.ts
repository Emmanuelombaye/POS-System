import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const router = Router();

// Middleware to authenticate JWT
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

const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/analytics/kpis
 * Get key performance indicators for today/selected date
 */
router.get("/kpis", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Total sales today
    const { data: transactions } = await supabase
      .from("transactions")
      .select("total, transaction_date")
      .eq("transaction_date", selectedDate);

    const totalSales = (transactions || []).reduce((sum, t) => sum + (t.total || 0), 0);

    // Profit calculation (Sales - Cost of Goods Sold)
    // Simplified: profit = sales * profit margin (typically 30-40% for butchery)
    const profitMargin = 0.35;
    const profit = totalSales * profitMargin;

    // Active shifts
    const { data: shifts } = await supabase
      .from("shifts")
      .select("id")
      .or("status.eq.OPEN,status.eq.open");

    const activeShifts = (shifts || []).length;

    // Stock value
    const { data: stockEntries } = await supabase
      .from("shift_stock_entries")
      .select("product_id, closing_stock, products!inner(unit_price)")
      .eq("shift_date", selectedDate);

    const stockValue = (stockEntries || []).reduce((sum: number, entry: any) => {
      const price = entry.products?.unit_price || 0;
      return sum + (entry.closing_stock || 0) * price;
    }, 0);

    // Refunds/Voids (negative transactions or marked as void)
    const { data: voids } = await supabase
      .from("transactions")
      .select("total, transaction_date")
      .eq("transaction_date", selectedDate)
      .lt("total", 0);

    const refundAmount = Math.abs((voids || []).reduce((sum, v) => sum + (v.total || 0), 0));

    res.json({
      date: selectedDate,
      totalSales: Math.round(totalSales),
      profit: Math.round(profit),
      activeShifts,
      stockValue: Math.round(stockValue),
      refunds: Math.round(refundAmount),
    });
  } catch (error) {
    console.error("[ANALYTICS_KPIs] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/sales-trend
 * Get sales data for trend chart (week/month)
 */
router.get("/sales-trend", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { period = "week" } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    if (period === "month") {
      startDate.setDate(1);
    } else {
      startDate.setDate(now.getDate() - 6);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    const { data: transactions } = await supabase
      .from("transactions")
      .select("total, transaction_date")
      .gte("transaction_date", startDateStr)
      .lte("transaction_date", endDateStr)
      .order("transaction_date", { ascending: true });

    // Group by date
    const grouped: Record<string, number> = {};
    (transactions || []).forEach(t => {
      const date = t.transaction_date;
      grouped[date] = (grouped[date] || 0) + (t.total || 0);
    });

    const data = Object.entries(grouped).map(([date, sales]) => ({
      date,
      sales: Math.round(sales),
    }));

    res.json(data);
  } catch (error) {
    console.error("[SALES_TREND] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/top-products
 * Get top selling products
 */
router.get("/top-products", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const { data: sales } = await supabase
      .from("transactions")
      .select("product_id, quantity_kg, products!inner(name, category)")
      .eq("transaction_date", selectedDate);

    // Group by product
    const grouped: Record<string, { name: string; category: string; kg: number; count: number }> = {};
    
    (sales || []).forEach((s: any) => {
      const id = s.product_id;
      if (!grouped[id]) {
        grouped[id] = {
          name: s.products?.name || "Unknown",
          category: s.products?.category || "Unknown",
          kg: 0,
          count: 0,
        };
      }
      grouped[id].kg += s.quantity_kg || 0;
      grouped[id].count += 1;
    });

    const topProducts = Object.entries(grouped)
      .map(([id, data]: [string, any]) => ({
        product_id: id,
        name: data.name,
        category: data.category,
        kg: data.kg,
        count: data.count,
      }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 5);

    res.json(topProducts);
  } catch (error) {
    console.error("[TOP_PRODUCTS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/branch-comparison
 * Compare sales across branches
 */
router.get("/branch-comparison", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    const { data: shifts } = await supabase
      .from("shifts")
      .select("branch_id, closing_cash, closing_mpesa")
      .eq("shift_date", selectedDate);

    // Group by branch
    const grouped: Record<string, { cash: number; mpesa: number; count: number }> = {};
    
    (shifts || []).forEach(s => {
      const branch = s.branch_id || "Unknown";
      if (!grouped[branch]) {
        grouped[branch] = { cash: 0, mpesa: 0, count: 0 };
      }
      grouped[branch].cash += s.closing_cash || 0;
      grouped[branch].mpesa += s.closing_mpesa || 0;
      grouped[branch].count += 1;
    });

    const branchData = Object.entries(grouped).map(([branch, data]) => ({
      branch,
      sales: data.cash + data.mpesa,
      cash: data.cash,
      mpesa: data.mpesa,
      shifts: data.count,
    }));

    res.json(branchData);
  } catch (error) {
    console.error("[BRANCH_COMPARISON] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/low-stock
 * Get products with low stock levels
 */
router.get("/low-stock", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, category, weight_kg, low_stock_threshold_kg, status");

    const lowStock = (products || [])
      .filter((p: any) => (p.status || "active") === "active")
      .filter((p: any) => Number(p.weight_kg || 0) < Number(p.low_stock_threshold_kg || 0))
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock_kg: Number(p.weight_kg || 0),
        low_stock_threshold_kg: Number(p.low_stock_threshold_kg || 0),
      }));

    res.json(lowStock);
  } catch (error) {
    console.error("[LOW_STOCK] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/active-shifts
 * Get current active shifts with cashier details
 */
router.get("/active-shifts", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data: shifts } = await supabase
      .from("shifts")
      .select("id, shift_id, cashier_id, branch_id, opening_time, users!inner(name, email)")
      .or("status.eq.OPEN,status.eq.open")
      .order("opening_time", { ascending: false });

    const enriched = (shifts || []).map((s: any) => ({
      shift_id: s.shift_id || s.id,
      cashier: s.users?.name || "Unknown",
      branch: s.branch_id,
      opened_at: s.opening_time,
      duration_minutes: Math.round((Date.now() - new Date(s.opening_time).getTime()) / 60000),
    }));

    res.json(enriched);
  } catch (error) {
    console.error("[ACTIVE_SHIFTS] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/waste-summary
 * Get waste/spoilage summary
 */
router.get("/waste-summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date as string).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Waste is tracked via variance (closing_stock - actual stock)
    const { data: entries } = await supabase
      .from("shift_stock_entries")
      .select("product_id, variance, products!inner(name, category)")
      .eq("shift_date", selectedDate)
      .gt("variance", 0);

    const wasteByProduct = (entries || []).map((e: any) => ({
      product: e.products?.name || "Unknown",
      category: e.products?.category || "Unknown",
      wasted_kg: Math.abs(e.variance || 0),
    }));

    res.json(wasteByProduct);
  } catch (error) {
    console.error("[WASTE_SUMMARY] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
