import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import {
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Eye,
} from "lucide-react";

interface ShiftDetails {
  shift_id: string;
  cashier_id: string;
  cashier_name: string;
  branch_id: string;
  status: string;
  opened_at: string;
  closed_at?: string;
  closing_cash: number;
  closing_mpesa: number;
}

interface StockEntry {
  product_id: string;
  product_name: string;
  category: string;
  opening_stock: number;
  added_stock: number;
  sold_stock: number;
  closing_stock: number;
  variance: number;
}

interface Transaction {
  id: string;
  payment_method: "cash" | "mpesa";
  total_amount: number;
  transaction_date: string;
}

interface VarianceAlert {
  product_id: string;
  product_name: string;
  expected: number;
  actual: number;
  variance: number;
}

interface ShiftDetailData {
  shift: ShiftDetails;
  stock_reconciliation: {
    entries: StockEntry[];
    totals: {
      opening_stock: number;
      added_stock: number;
      sold_stock: number;
      expected_closing: number;
      actual_closing: number;
      total_variance: number;
    };
    alerts: VarianceAlert[];
  };
  payment_reconciliation: {
    transactions: Transaction[];
    totals: {
      cash: number;
      mpesa: number;
      total: number;
    };
    reported: {
      cash: number;
      mpesa: number;
      total: number;
    };
    variance: {
      cash: number;
      mpesa: number;
    };
  };
}

export const LiveAdminDashboard = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
  const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [activeShifts, setActiveShifts] = useState<ShiftDetails[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [shiftDetails, setShiftDetails] = useState<ShiftDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // Fetch all active shifts
  const fetchActiveShifts = useCallback(async () => {
    try {
      const response = await fetch("/api/shifts?status=OPEN", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShifts(data || []);
      }
    } catch (error) {
      console.error("Error fetching active shifts:", error);
    }
  }, []);

  // Fetch selected shift details
  const fetchShiftDetails = useCallback(async (shiftId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shifts/${shiftId}/details`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setShiftDetails(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching shift details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!realtimeEnabled) return;

    // Fetch initial data
    fetchActiveShifts();

    // Subscribe to shifts table for changes
    const shiftsSubscription = supabase
      .channel("shifts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shifts" },
        async () => {
          console.log("[REALTIME] Shifts changed, refetching...");
          await fetchActiveShifts();
        }
      )
      .subscribe();

    // Subscribe to shift_stock_entries for changes
    const stockSubscription = supabase
      .channel("stock-entries-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shift_stock_entries" },
        async (payload) => {
          console.log("[REALTIME] Stock entries changed:", payload);
          if (selectedShift) {
            await fetchShiftDetails(selectedShift);
          }
        }
      )
      .subscribe();

    // Subscribe to transactions for changes
    const transactionsSubscription = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        async (payload) => {
          console.log("[REALTIME] Transactions changed:", payload);
          if (selectedShift) {
            await fetchShiftDetails(selectedShift);
          }
        }
      )
      .subscribe();

    // Poll for updates every 5 seconds as fallback
    const interval = setInterval(() => {
      if (selectedShift) {
        fetchShiftDetails(selectedShift);
      } else {
        fetchActiveShifts();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      shiftsSubscription.unsubscribe();
      stockSubscription.unsubscribe();
      transactionsSubscription.unsubscribe();
    };
  }, [selectedShift, realtimeEnabled, fetchActiveShifts, fetchShiftDetails]);

  // Handle shift selection
  const handleSelectShift = async (shiftId: string) => {
    setSelectedShift(shiftId);
    await fetchShiftDetails(shiftId);
  };

  // ============================================================================
  // LIVE SHIFTS LIST
  // ============================================================================
  if (!selectedShift) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-1">Real-time Shift Monitoring</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {realtimeEnabled ? (
                    <>
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </div>
                      <span className="text-emerald-600 font-semibold text-sm">
                        REALTIME
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                      <span className="text-slate-600 font-semibold text-sm">
                        POLLING
                      </span>
                    </>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setLastUpdated(new Date());
                    fetchActiveShifts();
                  }}
                  className="flex items-center gap-2 bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>

                <span className="text-xs text-slate-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Active Shifts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Active Shifts ({activeShifts.length})
            </h2>

            {activeShifts.length === 0 ? (
              <Card className="rounded-xl shadow-sm p-12 bg-white text-center">
                <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold">No active shifts</p>
                <p className="text-slate-400 text-sm">
                  Cashiers will appear here when they start their shifts
                </p>
              </Card>
            ) : (
              <AnimatePresence>
                {activeShifts.map((shift) => (
                  <motion.div
                    key={shift.shift_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="rounded-xl shadow-sm p-6 bg-white hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-slate-900">
                            {shift.cashier_name}
                          </h3>
                          <p className="text-slate-500 text-sm">
                            Branch: {shift.branch_id} • Since:{" "}
                            {new Date(shift.opened_at).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-emerald-600 font-semibold text-sm">
                              OPEN
                            </span>
                          </div>

                          <Button
                            onClick={() => handleSelectShift(shift.shift_id)}
                            className="bg-blue-500 text-white hover:bg-blue-600 transition-all flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================================================
  // LIVE SHIFT DETAILS
  // ============================================================================
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                {shiftDetails?.shift.cashier_name}'s Shift
              </h1>
              <p className="text-slate-500 mt-1">
                Real-time Reconciliation • {shiftDetails?.shift.branch_id}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <span className="text-emerald-600 font-semibold text-sm">
                  LIVE
                </span>
              </div>

              <Button
                onClick={() => {
                  setSelectedShift(null);
                  setShiftDetails(null);
                }}
                className="bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
              >
                ← Back to Shifts
              </Button>
            </div>
          </div>
        </div>

        {!shiftDetails ? (
          <Card className="rounded-xl shadow-sm p-12 bg-white text-center">
            <RefreshCw className="h-16 w-16 text-slate-300 mx-auto mb-4 animate-spin" />
            <p className="text-slate-500 font-semibold">Loading shift details...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stock Reconciliation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stock Summary */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Stock Reconciliation
                  </h2>
                </div>

                <div className="p-6">
                  {/* Stock Totals Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-semibold">
                        OPENING STOCK
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {shiftDetails.stock_reconciliation.totals.opening_stock.toFixed(1)}
                        <span className="text-sm font-semibold text-slate-600">
                          kg
                        </span>
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-semibold">
                        ADDED MID-SHIFT
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {shiftDetails.stock_reconciliation.totals.added_stock.toFixed(
                          1
                        )}
                        <span className="text-sm font-semibold text-slate-600">
                          kg
                        </span>
                      </p>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-semibold">SOLD</p>
                      <p className="text-2xl font-black text-slate-900">
                        {shiftDetails.stock_reconciliation.totals.sold_stock.toFixed(
                          1
                        )}
                        <span className="text-sm font-semibold text-slate-600">
                          kg
                        </span>
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-semibold">
                        EXPECTED CLOSING
                      </p>
                      <p className="text-2xl font-black text-slate-900">
                        {shiftDetails.stock_reconciliation.totals.expected_closing.toFixed(
                          1
                        )}
                        <span className="text-sm font-semibold text-slate-600">
                          kg
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Formula Display */}
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                    <p className="font-semibold mb-2">Calculation Formula:</p>
                    <p className="font-mono text-xs">
                      Expected Stock = Opening + Added - Sold
                    </p>
                    <p className="font-mono text-xs mt-2">
                      {shiftDetails.stock_reconciliation.totals.opening_stock.toFixed(1)} +{" "}
                      {shiftDetails.stock_reconciliation.totals.added_stock.toFixed(1)} -{" "}
                      {shiftDetails.stock_reconciliation.totals.sold_stock.toFixed(1)} ={" "}
                      <strong>
                        {shiftDetails.stock_reconciliation.totals.expected_closing.toFixed(
                          1
                        )}
                        kg
                      </strong>
                    </p>
                  </div>
                </div>
              </Card>

              {/* Product-by-Product Breakdown */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-6">
                  <h2 className="text-xl font-black text-white">
                    Product Details
                  </h2>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-bold text-slate-700">
                            Product
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Opening
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Added
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Sold
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Expected
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Actual
                          </th>
                          <th className="text-right py-3 px-4 font-bold text-slate-700">
                            Variance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {shiftDetails.stock_reconciliation.entries.map(
                          (entry) => {
                            const expected =
                              entry.opening_stock +
                              entry.added_stock -
                              entry.sold_stock;
                            const variance = entry.closing_stock - expected;
                            const hasVariance = Math.abs(variance) > 0.1;

                            return (
                              <motion.tr
                                key={entry.product_id}
                                className={`border-b border-slate-100 hover:bg-slate-50 transition-all ${
                                  hasVariance ? "bg-red-50" : ""
                                }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {entry.product_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {entry.category}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {entry.opening_stock.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-green-600">
                                  +{entry.added_stock.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-red-600">
                                  -{entry.sold_stock.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-blue-600">
                                  {expected.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {entry.closing_stock.toFixed(1)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                      hasVariance
                                        ? "bg-red-200 text-red-700"
                                        : "bg-green-200 text-green-700"
                                    }`}
                                  >
                                    {variance > 0 ? "+" : ""}
                                    {variance.toFixed(2)}
                                  </span>
                                </td>
                              </motion.tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* Variance Alerts */}
              {shiftDetails.stock_reconciliation.alerts.length > 0 && (
                <Card className="rounded-xl shadow-sm overflow-hidden border-2 border-red-200">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6" />
                      Stock Discrepancies ({shiftDetails.stock_reconciliation.alerts.length})
                    </h2>
                  </div>

                  <div className="p-6 space-y-4">
                    {shiftDetails.stock_reconciliation.alerts.map((alert) => (
                      <motion.div
                        key={alert.product_id}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-red-900">
                            {alert.product_name}
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Expected: {alert.expected.toFixed(2)}kg | Actual:{" "}
                            {alert.actual.toFixed(2)}kg | Difference:{" "}
                            <strong>
                              {alert.variance > 0 ? "+" : ""}
                              {alert.variance.toFixed(2)}kg
                            </strong>
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Payments & Summary */}
            <div className="space-y-6">
              {/* Payment Reconciliation */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Payment Reconciliation
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Cash */}
                  <div className="border-b border-slate-200 pb-4">
                    <p className="text-xs text-slate-600 font-semibold mb-2">
                      CASH
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Expected:</span>
                        <span className="font-bold">
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.totals.cash
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Reported:</span>
                        <span className="font-bold">
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.reported.cash
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-600 font-semibold">
                          Variance:
                        </span>
                        <span
                          className={`font-bold ${
                            Math.abs(
                              shiftDetails.payment_reconciliation.variance.cash
                            ) > 0.01
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {shiftDetails.payment_reconciliation.variance.cash > 0
                            ? "+"
                            : ""}
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.variance.cash
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* M-Pesa */}
                  <div>
                    <p className="text-xs text-slate-600 font-semibold mb-2">
                      M-PESA
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Expected:</span>
                        <span className="font-bold">
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.totals.mpesa
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Reported:</span>
                        <span className="font-bold">
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.reported.mpesa
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-600 font-semibold">
                          Variance:
                        </span>
                        <span
                          className={`font-bold ${
                            Math.abs(
                              shiftDetails.payment_reconciliation.variance.mpesa
                            ) > 0.01
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {shiftDetails.payment_reconciliation.variance.mpesa > 0
                            ? "+"
                            : ""}
                          {formatCurrency(
                            shiftDetails.payment_reconciliation.variance.mpesa
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-slate-100 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-700 font-semibold">
                        Total Expected:
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(
                          shiftDetails.payment_reconciliation.totals.total
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 font-semibold">
                        Total Reported:
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(
                          shiftDetails.payment_reconciliation.reported.total
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Shift Status */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-6">
                  <h2 className="text-xl font-black text-white">Shift Status</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {shiftDetails.shift.status === "OPEN" ? (
                      <>
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <span className="text-emerald-600 font-bold">OPEN</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                        <span className="text-slate-600 font-bold">CLOSED</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Opened:</span>
                      <span className="font-semibold">
                        {new Date(shiftDetails.shift.opened_at).toLocaleString()}
                      </span>
                    </div>
                    {shiftDetails.shift.closed_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Closed:</span>
                        <span className="font-semibold">
                          {new Date(shiftDetails.shift.closed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Last Updated */}
              <div className="text-center text-xs text-slate-500 mt-4">
                <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>
                <p>Updates every 5 seconds</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
