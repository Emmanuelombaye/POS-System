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

const ANALYTICS_TIMEZONE = "Africa/Nairobi";

const formatDateInTZ = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getWeekStart = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().split("T")[0];
};

const getMonthStart = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  date.setUTCDate(1);
  return date.toISOString().split("T")[0];
};

const addDays = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
};

const buildDateSeries = (start: string, end: string) => {
  const series: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    series.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return series;
};

const buildWeekSeries = (start: string, end: string) => {
  const series: string[] = [];
  let cursor = getWeekStart(start);
  while (cursor <= end) {
    series.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return series;
};

const buildMonthSeries = (start: string, end: string) => {
  const series: string[] = [];
  const startDate = new Date(`${getMonthStart(start)}T00:00:00+03:00`);
  const endDate = new Date(`${getMonthStart(end)}T00:00:00+03:00`);
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    series.push(cursor.toISOString().split("T")[0]);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return series;
};

const fetchTransactionsBetween = async (start: string, end: string) => {
  const startDateTime = `${start}T00:00:00`;
  const endDateTime = `${end}T23:59:59`;

  let txResponse: any = await supabase
    .from("transactions")
    .select("total, created_at, transaction_date")
    .gte("created_at", startDateTime)
    .lte("created_at", endDateTime);

  if (txResponse.error && txResponse.error.code === "42703") {
    txResponse = await supabase
      .from("transactions")
      .select("total, transaction_date")
      .gte("transaction_date", startDateTime)
      .lte("transaction_date", endDateTime);
  }

  if (txResponse.error) throw txResponse.error;
  return txResponse.data || [];
};

const buildHourlySeries = (data: any[]) => {
  const hours = Array.from({ length: 24 }).map((_, i) => ({
    label: `${String(i).padStart(2, "0")}:00`,
    value: 0,
  }));

  for (const row of data) {
    const ts = row.created_at || row.transaction_date;
    if (!ts) continue;
    const date = new Date(ts);
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: ANALYTICS_TIMEZONE,
        hour: "2-digit",
        hour12: false,
      }).format(date)
    );
    if (Number.isFinite(hour) && hours[hour]) {
      hours[hour].value += Number(row.total || 0);
    }
  }

  return hours;
};

const buildSummarySeries = (
  seriesKeys: string[],
  data: any[],
  key: string,
  valueKey: string
) => {
  const map = new Map<string, number>();
  data.forEach((row) => {
    map.set(row[key], Number(row[valueKey] || 0));
  });

  return seriesKeys.map((entry) => ({
    label: entry,
    value: map.get(entry) || 0,
  }));
};

const getRangeConfig = (range: string) => {
  const today = formatDateInTZ(new Date(), ANALYTICS_TIMEZONE);

  switch (range) {
    case "1D": {
      const previous = addDays(today, -1);
      return {
        bucket: "hour",
        currentStart: today,
        currentEnd: today,
        previousStart: previous,
        previousEnd: previous,
      };
    }
    case "7D": {
      const currentStart = addDays(today, -6);
      const previousEnd = addDays(currentStart, -1);
      const previousStart = addDays(previousEnd, -6);
      return { bucket: "day", currentStart, currentEnd: today, previousStart, previousEnd };
    }
    case "1M": {
      const currentStart = addDays(today, -29);
      const previousEnd = addDays(currentStart, -1);
      const previousStart = addDays(previousEnd, -29);
      return { bucket: "day", currentStart, currentEnd: today, previousStart, previousEnd };
    }
    case "3M": {
      const currentStart = addDays(today, -83);
      const previousEnd = addDays(currentStart, -1);
      const previousStart = addDays(previousEnd, -83);
      return { bucket: "week", currentStart, currentEnd: today, previousStart, previousEnd };
    }
    case "6M": {
      const currentStart = addDays(today, -181);
      const previousEnd = addDays(currentStart, -1);
      const previousStart = addDays(previousEnd, -181);
      return { bucket: "week", currentStart, currentEnd: today, previousStart, previousEnd };
    }
    case "1Y": {
      const currentStart = addDays(today, -364);
      const previousEnd = addDays(currentStart, -1);
      const previousStart = addDays(previousEnd, -364);
      return { bucket: "month", currentStart, currentEnd: today, previousStart, previousEnd };
    }
    default:
      return getRangeConfig("7D");
  }
};

const computeTrendLabel = (values: number[]) => {
  if (values.length < 2) return "Stable";

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  values.forEach((value, index) => {
    sumX += index;
    sumY += value;
    sumXY += index * value;
    sumX2 += index * index;
  });

  const n = values.length;
  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const avg = sumY / n;
  const threshold = Math.max(avg * 0.02, 1);

  if (slope > threshold) return "Growing";
  if (slope < -threshold) return "Declining";
  return "Stable";
};

const getGrowthSeries = async (range: string) => {
  const { bucket, currentStart, currentEnd, previousStart, previousEnd } = getRangeConfig(range);

  if (bucket === "hour") {
    const currentTx = await fetchTransactionsBetween(currentStart, currentEnd);
    const previousTx = await fetchTransactionsBetween(previousStart, previousEnd);
    const current = buildHourlySeries(currentTx);
    const previous = buildHourlySeries(previousTx);
    return { range, bucket, current, previous };
  }

  if (bucket === "day") {
    const series = buildDateSeries(currentStart, currentEnd);
    const previousSeries = buildDateSeries(previousStart, previousEnd);

    let currentRows = await supabase
      .from("sales_daily")
      .select("date, total_sales")
      .gte("date", currentStart)
      .lte("date", currentEnd)
      .order("date", { ascending: true });

    if (currentRows.error) {
      const tx = await fetchTransactionsBetween(currentStart, currentEnd);
      const grouped: Record<string, number> = {};
      tx.forEach((row: any) => {
        const key = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
        grouped[key] = (grouped[key] || 0) + Number(row.total || 0);
      });
      currentRows = { data: Object.entries(grouped).map(([date, total_sales]) => ({ date, total_sales })) } as any;
    }

    let previousRows = await supabase
      .from("sales_daily")
      .select("date, total_sales")
      .gte("date", previousStart)
      .lte("date", previousEnd)
      .order("date", { ascending: true });

    if (previousRows.error) {
      const tx = await fetchTransactionsBetween(previousStart, previousEnd);
      const grouped: Record<string, number> = {};
      tx.forEach((row: any) => {
        const key = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
        grouped[key] = (grouped[key] || 0) + Number(row.total || 0);
      });
      previousRows = { data: Object.entries(grouped).map(([date, total_sales]) => ({ date, total_sales })) } as any;
    }

    const current = buildSummarySeries(series, currentRows.data || [], "date", "total_sales");
    const previous = buildSummarySeries(previousSeries, previousRows.data || [], "date", "total_sales");
    return { range, bucket, current, previous };
  }

  if (bucket === "week") {
    const series = buildWeekSeries(currentStart, currentEnd);
    const previousSeries = buildWeekSeries(previousStart, previousEnd);

    let currentRows = await supabase
      .from("sales_weekly")
      .select("week_start, total_sales")
      .gte("week_start", series[0])
      .lte("week_start", series[series.length - 1])
      .order("week_start", { ascending: true });

    if (currentRows.error) {
      const tx = await fetchTransactionsBetween(currentStart, currentEnd);
      const grouped: Record<string, number> = {};
      tx.forEach((row: any) => {
        const dateKey = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
        const weekKey = getWeekStart(dateKey);
        grouped[weekKey] = (grouped[weekKey] || 0) + Number(row.total || 0);
      });
      currentRows = { data: Object.entries(grouped).map(([week_start, total_sales]) => ({ week_start, total_sales })) } as any;
    }

    let previousRows = await supabase
      .from("sales_weekly")
      .select("week_start, total_sales")
      .gte("week_start", previousSeries[0])
      .lte("week_start", previousSeries[previousSeries.length - 1])
      .order("week_start", { ascending: true });

    if (previousRows.error) {
      const tx = await fetchTransactionsBetween(previousStart, previousEnd);
      const grouped: Record<string, number> = {};
      tx.forEach((row: any) => {
        const dateKey = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
        const weekKey = getWeekStart(dateKey);
        grouped[weekKey] = (grouped[weekKey] || 0) + Number(row.total || 0);
      });
      previousRows = { data: Object.entries(grouped).map(([week_start, total_sales]) => ({ week_start, total_sales })) } as any;
    }

    const current = buildSummarySeries(series, currentRows.data || [], "week_start", "total_sales");
    const previous = buildSummarySeries(previousSeries, previousRows.data || [], "week_start", "total_sales");
    return { range, bucket, current, previous };
  }

  const series = buildMonthSeries(currentStart, currentEnd);
  const previousSeries = buildMonthSeries(previousStart, previousEnd);

  let currentRows = await supabase
    .from("sales_monthly")
    .select("month_start, total_sales")
    .gte("month_start", series[0])
    .lte("month_start", series[series.length - 1])
    .order("month_start", { ascending: true });

  if (currentRows.error) {
    const tx = await fetchTransactionsBetween(currentStart, currentEnd);
    const grouped: Record<string, number> = {};
    tx.forEach((row: any) => {
      const dateKey = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
      const monthKey = getMonthStart(dateKey);
      grouped[monthKey] = (grouped[monthKey] || 0) + Number(row.total || 0);
    });
    currentRows = { data: Object.entries(grouped).map(([month_start, total_sales]) => ({ month_start, total_sales })) } as any;
  }

  let previousRows = await supabase
    .from("sales_monthly")
    .select("month_start, total_sales")
    .gte("month_start", previousSeries[0])
    .lte("month_start", previousSeries[previousSeries.length - 1])
    .order("month_start", { ascending: true });

  if (previousRows.error) {
    const tx = await fetchTransactionsBetween(previousStart, previousEnd);
    const grouped: Record<string, number> = {};
    tx.forEach((row: any) => {
      const dateKey = formatDateInTZ(new Date(row.created_at || row.transaction_date), ANALYTICS_TIMEZONE);
      const monthKey = getMonthStart(dateKey);
      grouped[monthKey] = (grouped[monthKey] || 0) + Number(row.total || 0);
    });
    previousRows = { data: Object.entries(grouped).map(([month_start, total_sales]) => ({ month_start, total_sales })) } as any;
  }

  const current = buildSummarySeries(series, currentRows.data || [], "month_start", "total_sales");
  const previous = buildSummarySeries(previousSeries, previousRows.data || [], "month_start", "total_sales");
  return { range, bucket: "month", current, previous };
};

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
 * GET /api/admin/analytics/growth
 * Business Growth Timeline (current vs previous period)
 */
router.get("/growth", authenticateToken, async (req: Request, res: Response) => {
  try {
    const range = String(req.query.range || "7D").toUpperCase();
    const data = await getGrowthSeries(range);
    return res.json(data);
  } catch (error) {
    console.error("[GROWTH_TIMELINE] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/admin/analytics/growth/summary
 * Summary metrics for current vs previous period
 */
router.get("/growth/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const range = String(req.query.range || "7D").toUpperCase();
    const data = await getGrowthSeries(range);

    const currentTotal = data.current.reduce((sum, point) => sum + point.value, 0);
    const previousTotal = data.previous.reduce((sum, point) => sum + point.value, 0);
    const avg = data.current.length > 0 ? currentTotal / data.current.length : 0;

    let bestLabel = "-";
    let bestValue = -Infinity;
    data.current.forEach((point) => {
      if (point.value > bestValue) {
        bestValue = point.value;
        bestLabel = point.label;
      }
    });

    const changePct = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    const trend = computeTrendLabel(data.current.map((point) => point.value));

    res.json({
      range,
      bucket: data.bucket,
      currentTotal,
      previousTotal,
      avg,
      bestLabel,
      changePct,
      trend,
    });
  } catch (error) {
    console.error("[GROWTH_SUMMARY] Error:", error);
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
