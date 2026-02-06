import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { api } from "@/utils/api";

export interface CashierShiftSummary {
  shift_id: string;
  cashier_id: string;
  cashier_name: string;
  closed_at: string;
  cash_recorded: number;
  mpesa_recorded: number;
  total_recorded: number;
  opening_stock_kg: number;
  closing_stock_kg: number;
  stock_deficiency_kg: number;
  deficiency_percent: number;
  transaction_count: number;
  is_recent: boolean;
}

// Get today's date in YYYY-MM-DD format (local timezone, not UTC)
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useCashierShiftSummary = (selectedDate?: string) => {
  const [cashierSummaries, setCashierSummaries] = useState<CashierShiftSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  // Memoize today's date - use local timezone aware calculation
  const today = useMemo(() => getTodayDateString(), []);
  // Guard against undefined selectedDate - use today as fallback
  const dateToDisplay = useMemo(() => {
    const date = selectedDate || today;
    if (!date) return today;
    return date;
  }, [selectedDate, today]);

  // Fetch function - wrapped in useCallback to have stable reference
  const fetchCashierShiftSummaries = useCallback(async (dateToFetch: string) => {
    try {
      if (!dateToFetch) {
        console.log("[useCashierShiftSummary] Skipping fetch - no date provided");
        return;
      }
      
      console.log(`[useCashierShiftSummary] Fetching data for date: ${dateToFetch}`);
      setLoading(true);
      setError(null);

      // Call backend API endpoint with date parameter
      const data = await api.get("/api/shifts/summary", { date: dateToFetch });

      // Transform data to match our interface
      const transformed = (data.summaries || []).map((summary: any) => ({
        shift_id: summary.shift_id,
        cashier_id: summary.cashier_id,
        cashier_name: summary.cashier_name,
        closed_at: summary.closed_at,
        cash_recorded: summary.cash_recorded,
        mpesa_recorded: summary.mpesa_recorded,
        total_recorded: summary.total_recorded,
        opening_stock_kg: summary.opening_stock_kg,
        closing_stock_kg: summary.closing_stock_kg,
        stock_deficiency_kg: summary.stock_deficiency_kg,
        deficiency_percent: summary.deficiency_percent,
        transaction_count: summary.transaction_count,
        is_recent: summary.is_recent,
      }));

      setCashierSummaries(transformed);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError((err as Error).message);
      console.error("[useCashierShiftSummary] Error fetching:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount or when selectedDate changes
  useEffect(() => {
    console.log(`[useCashierShiftSummary] Date changed to: ${dateToDisplay}, today is: ${today}`);
    fetchCashierShiftSummaries(dateToDisplay);
  }, [dateToDisplay, today]);

  // Subscribe to real-time shift updates (only for today)
  useEffect(() => {
    const isToday = dateToDisplay === today;
    
    console.log(`[useCashierShiftSummary] Subscription check: dateToDisplay=${dateToDisplay}, today=${today}, isToday=${isToday}`);
    
    if (!isToday) {
      console.log(`[useCashierShiftSummary] Viewing historical data, skipping subscription`);
      return;
    }

    console.log("[useCashierShiftSummary] Setting up real-time subscription for today");
    let isActive = true;

    const shiftsChannel = supabase
      .channel(`cashier-shift-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shifts" },
        (payload) => {
          if (isActive) {
            console.log("[useCashierShiftSummary] Shift update detected, refreshing");
            fetchCashierShiftSummaries(today);
          }
        }
      )
      .subscribe((status, error) => {
        console.log("[useCashierShiftSummary] Subscription status:", status, error);
      });

    return () => {
      isActive = false;
      shiftsChannel.unsubscribe();
    };
  }, [dateToDisplay, today, fetchCashierShiftSummaries]);

  // Polling every 5 seconds for live updates (only for today)
  useEffect(() => {
    const isToday = dateToDisplay === today;
    
    if (!isToday) {
      console.log(`[useCashierShiftSummary] Viewing historical data, skipping polling`);
      return;
    }

    console.log("[useCashierShiftSummary] Starting 5-second polling");
    const interval = setInterval(() => {
      console.log("[useCashierShiftSummary] Polling interval fired, fetching for date:", today);
      fetchCashierShiftSummaries(today);
    }, 5000);

    return () => {
      console.log("[useCashierShiftSummary] Clearing polling interval");
      clearInterval(interval);
    };
  }, [dateToDisplay, today, fetchCashierShiftSummaries]);

  return {
    cashierSummaries,
    loading,
    error,
    lastUpdate,
    currentDate: dateToDisplay,
    refetch: (dateToFetch?: string) => fetchCashierShiftSummaries(dateToFetch || dateToDisplay),
  };
};
