import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useAppStore } from "@/store/appStore";

export interface KPIs {
  date: string;
  totalSales: number;
  profit: number;
  activeShifts: number;
  stockValue: number;
  refunds: number;
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  category: string;
  kg: number;
  count: number;
}

export interface BranchComparison {
  branch: string;
  sales: number;
  cash: number;
  mpesa: number;
  shifts: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  stock_kg: number;
  low_stock_threshold_kg: number;
}

export interface ActiveShift {
  shift_id: string;
  cashier: string;
  branch: string;
  opened_at: string;
  duration_minutes: number;
}

export interface WasteItem {
  product: string;
  category: string;
  wasted_kg: number;
}

/**
 * Hook for fetching analytics data
 */
export const useAnalytics = (date?: string) => {
  const token = useAppStore((s) => s.token);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [branches, setBranches] = useState<BranchComparison[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [waste, setWaste] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKpis = useCallback(async () => {
    try {
      const url = date ? `/api/admin/analytics/kpis?date=${date}` : "/api/admin/analytics/kpis";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch KPIs");
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token, date]);

  const fetchSalesTrend = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics/sales-trend", {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch sales trend");
      const data = await response.json();
      setSalesTrend(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token]);

  const fetchTopProducts = useCallback(async () => {
    try {
      const url = date ? `/api/admin/analytics/top-products?date=${date}` : "/api/admin/analytics/top-products";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch top products");
      const data = await response.json();
      setTopProducts(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token, date]);

  const fetchBranches = useCallback(async () => {
    try {
      const url = date ? `/api/admin/analytics/branch-comparison?date=${date}` : "/api/admin/analytics/branch-comparison";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch branch comparison");
      const data = await response.json();
      setBranches(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token, date]);

  const fetchLowStock = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics/low-stock", {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch low stock");
      const data = await response.json();
      setLowStock(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token]);

  const fetchActiveShifts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/analytics/active-shifts", {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch active shifts");
      const data = await response.json();
      setActiveShifts(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token]);

  const fetchWaste = useCallback(async () => {
    try {
      const url = date ? `/api/admin/analytics/waste-summary?date=${date}` : "/api/admin/analytics/waste-summary";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch waste summary");
      const data = await response.json();
      setWaste(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [token, date]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKpis(),
        fetchSalesTrend(),
        fetchTopProducts(),
        fetchBranches(),
        fetchLowStock(),
        fetchActiveShifts(),
        fetchWaste(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchKpis, fetchSalesTrend, fetchTopProducts, fetchBranches, fetchLowStock, fetchActiveShifts, fetchWaste]);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Subscribe to shifts changes (affects KPIs, active shifts)
    const shiftsChannel = supabase
      .channel("analytics-shifts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        () => {
          console.log("[ANALYTICS] Shifts changed, refetching...");
          fetchKpis();
          fetchActiveShifts();
        }
      )
      .subscribe();

    // Subscribe to transactions changes (affects KPIs, sales trend)
    const transactionsChannel = supabase
      .channel("analytics-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          console.log("[ANALYTICS] Transactions changed, refetching...");
          fetchKpis();
          fetchSalesTrend();
        }
      )
      .subscribe();

    // Subscribe to stock changes (affects low stock, waste, product trending)
    const stockChannel = supabase
      .channel("analytics-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_stock_entries" },
        () => {
          console.log("[ANALYTICS] Stock changed, refetching...");
          fetchLowStock();
          fetchWaste();
          fetchTopProducts();
        }
      )
      .subscribe();

    // Poll for updates every 10 seconds as fallback
    const interval = setInterval(() => {
      fetchAll();
    }, 10000);

    return () => {
      shiftsChannel.unsubscribe();
      transactionsChannel.unsubscribe();
      stockChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchAll, fetchKpis, fetchActiveShifts, fetchSalesTrend, fetchLowStock, fetchWaste, fetchTopProducts]);

  return {
    kpis,
    salesTrend,
    topProducts,
    branches,
    lowStock,
    activeShifts,
    waste,
    loading,
    error,
    refetch: fetchAll,
  };
};
