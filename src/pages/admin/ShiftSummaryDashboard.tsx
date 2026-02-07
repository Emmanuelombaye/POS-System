import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, isOnline } from "@/utils/api";
import { useAppStore } from "@/store/appStore";
import { OfflineErrorDisplay } from "@/components/OfflineErrorDisplay";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

interface ShiftSummary {
  shift_id: string;
  cashier_id: string;
  cashier_name: string;
  cashier_email: string;
  opened_at: string;
  closed_at: string;
  duration_hours: number;
  payments: {
    cash_expected: number;
    mpesa_expected: number;
    total_expected: number;
    cash_reported: number;
    mpesa_reported: number;
    total_reported: number;
    cash_variance: number;
    mpesa_variance: number;
    total_variance: number;
    has_variance: boolean;
  };
  stock: {
    opening_stock: number;
    closing_stock: number;
    added_stock: number;
    sold_stock: number;
    total_variance: number;
    has_variance: boolean;
    variance_details: any[];
  };
  transaction_count: number;
  products_count: number;
}

interface SummaryResponse {
  date: string;
  total_shifts: number;
  summaries: ShiftSummary[];
  grand_totals: {
    cash_expected: number;
    mpesa_expected: number;
    total_expected: number;
    cash_reported: number;
    mpesa_reported: number;
    total_reported: number;
    cash_variance: number;
    mpesa_variance: number;
    total_variance: number;
    total_opening_stock: number;
    total_closing_stock: number;
    total_added_stock: number;
    total_sold_stock: number;
  };
}

export const ShiftSummaryDashboard = () => {
  const { settings } = useAppStore();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  // Helper to format currency
  const formatMoney = (amount: number) => {
    return `${settings.currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const fetchSummary = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/shift-summary?date=${date}`);
      setSummaryData(data);
    } catch (err) {
      setError((err as Error).message || "Failed to fetch summary");
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate]);

  const handleRefresh = () => {
    fetchSummary(selectedDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              Shift Summary
            </h1>
            <p className="text-slate-600">
              Comprehensive daily report of all cashier shifts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="pl-10 pr-4 py-2 bg-white border-slate-200 shadow-sm"
                max={today}
              />
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="bg-white"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && !summaryData && (
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Loading summary...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        <OfflineErrorDisplay error={error} isLoading={loading} />

        {/* No Data State */}
        {!loading && summaryData && summaryData.total_shifts === 0 && (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No Closed Shifts
              </h3>
              <p className="text-slate-500">
                No shifts were closed on {formatDate(selectedDate)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary Data */}
        {!loading && summaryData && summaryData.total_shifts > 0 && (
          <>
            {/* Grand Totals */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Total Expected */}
              <Card className="shadow-lg border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Expected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-emerald-900">
                    {formatMoney(summaryData.grand_totals.total_expected)}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-emerald-700">
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span className="font-semibold">
                        {formatMoney(summaryData.grand_totals.cash_expected)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>M-Pesa:</span>
                      <span className="font-semibold">
                        {formatMoney(summaryData.grand_totals.mpesa_expected)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Reported */}
              <Card className="shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Total Reported
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-blue-900">
                    {formatMoney(summaryData.grand_totals.total_reported)}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-blue-700">
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span className="font-semibold">
                        {formatMoney(summaryData.grand_totals.cash_reported)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>M-Pesa:</span>
                      <span className="font-semibold">
                        {formatMoney(summaryData.grand_totals.mpesa_reported)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variance */}
              <Card
                className={`shadow-lg ${
                  Math.abs(summaryData.grand_totals.total_variance) > 1
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
                    : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-sm font-medium flex items-center gap-2 ${
                      Math.abs(summaryData.grand_totals.total_variance) > 1
                        ? "text-red-700"
                        : "text-slate-700"
                    }`}
                  >
                    {Math.abs(summaryData.grand_totals.total_variance) > 1 ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Total Variance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-black ${
                      summaryData.grand_totals.total_variance > 1
                        ? "text-red-900"
                        : summaryData.grand_totals.total_variance < -1
                        ? "text-orange-900"
                        : "text-slate-900"
                    }`}
                  >
                    {summaryData.grand_totals.total_variance > 0 ? "+" : ""}
                    {formatMoney(summaryData.grand_totals.total_variance)}
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span className="font-semibold">
                        {summaryData.grand_totals.cash_variance > 0 ? "+" : ""}
                        {formatMoney(summaryData.grand_totals.cash_variance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>M-Pesa:</span>
                      <span className="font-semibold">
                        {summaryData.grand_totals.mpesa_variance > 0 ? "+" : ""}
                        {formatMoney(summaryData.grand_totals.mpesa_variance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Movement */}
              <Card className="shadow-lg border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Movement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-purple-900">
                    {summaryData.grand_totals.total_sold_stock.toFixed(2)} kg
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-purple-700">
                    <div className="flex justify-between">
                      <span>Added:</span>
                      <span className="font-semibold">
                        +{summaryData.grand_totals.total_added_stock.toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shifts:</span>
                      <span className="font-semibold">{summaryData.total_shifts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Individual Cashier Summaries */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Cashier Breakdown ({summaryData.total_shifts})
              </h2>

              <AnimatePresence>
                {summaryData.summaries.map((summary, index) => (
                  <motion.div
                    key={summary.shift_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                        summary.payments.has_variance || summary.stock.has_variance
                          ? "border-l-4 border-l-red-500"
                          : "border-l-4 border-l-green-500"
                      }`}
                      onClick={() =>
                        setExpandedShift(
                          expandedShift === summary.shift_id ? null : summary.shift_id
                        )
                      }
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {summary.cashier_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {summary.cashier_name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(summary.opened_at)} -{" "}
                                  {formatTime(summary.closed_at)}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span>{summary.duration_hours.toFixed(1)}h</span>
                                <span className="text-slate-400">•</span>
                                <span>{summary.transaction_count} transactions</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {summary.payments.has_variance ? (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                <span className="font-semibold">Has Variance</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-semibold">Balanced</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Payment Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                            <div className="text-xs font-medium text-emerald-700 mb-1">
                              EXPECTED CASH
                            </div>
                            <div className="text-2xl font-bold text-emerald-900">
                              {formatMoney(summary.payments.cash_expected)}
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-1">
                              EXPECTED M-PESA
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                              {formatMoney(summary.payments.mpesa_expected)}
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="text-xs font-medium text-purple-700 mb-1">
                              TOTAL EXPECTED
                            </div>
                            <div className="text-2xl font-bold text-purple-900">
                              {formatMoney(summary.payments.total_expected)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                              REPORTED CASH
                              <span
                                className={`text-xs font-bold ${
                                  Math.abs(summary.payments.cash_variance) > 1
                                    ? summary.payments.cash_variance > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {summary.payments.cash_variance > 0
                                  ? `+${formatMoney(summary.payments.cash_variance)}`
                                  : formatMoney(summary.payments.cash_variance)}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                              {formatMoney(summary.payments.cash_reported)}
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                              REPORTED M-PESA
                              <span
                                className={`text-xs font-bold ${
                                  Math.abs(summary.payments.mpesa_variance) > 1
                                    ? summary.payments.mpesa_variance > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {summary.payments.mpesa_variance > 0
                                  ? `+${formatMoney(summary.payments.mpesa_variance)}`
                                  : formatMoney(summary.payments.mpesa_variance)}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">
                              {formatMoney(summary.payments.mpesa_reported)}
                            </div>
                          </div>

                          <div
                            className={`rounded-lg p-4 border ${
                              Math.abs(summary.payments.total_variance) > 1
                                ? summary.payments.total_variance > 0
                                  ? "bg-green-50 border-green-200"
                                  : "bg-red-50 border-red-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                              {summary.payments.total_variance > 0 ? (
                                <ArrowUpRight className="h-3 w-3 text-green-600" />
                              ) : summary.payments.total_variance < 0 ? (
                                <ArrowDownRight className="h-3 w-3 text-red-600" />
                              ) : null}
                              VARIANCE
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                summary.payments.total_variance > 1
                                  ? "text-green-900"
                                  : summary.payments.total_variance < -1
                                  ? "text-red-900"
                                  : "text-slate-900"
                              }`}
                            >
                              {summary.payments.total_variance > 0 ? "+" : ""}
                              {formatMoney(summary.payments.total_variance)}
                            </div>
                          </div>
                        </div>

                        {/* Stock Summary */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                          <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Stock Summary
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-indigo-700 mb-1">Opening</div>
                              <div className="font-bold text-indigo-900">
                                {summary.stock.opening_stock.toFixed(2)} kg
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-indigo-700 mb-1">Added</div>
                              <div className="font-bold text-indigo-900">
                                +{summary.stock.added_stock.toFixed(2)} kg
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-indigo-700 mb-1">Sold</div>
                              <div className="font-bold text-indigo-900">
                                -{summary.stock.sold_stock.toFixed(2)} kg
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-indigo-700 mb-1">Closing</div>
                              <div className="font-bold text-indigo-900">
                                {summary.stock.closing_stock.toFixed(2)} kg
                              </div>
                            </div>
                          </div>
                          {summary.stock.has_variance && (
                            <div className="mt-3 text-xs text-red-700 font-semibold flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Stock variance detected: {summary.stock.total_variance.toFixed(2)}{" "}
                              kg
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {expandedShift === summary.shift_id &&
                          summary.stock.variance_details.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                            >
                              <h4 className="font-bold text-slate-900 mb-3">
                                Products with Variance
                              </h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {summary.stock.variance_details.map((detail, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm bg-white p-3 rounded border"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-900">
                                        {detail.product_name}
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        {detail.category}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div
                                        className={`font-bold ${
                                          detail.variance > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {detail.variance > 0 ? "+" : ""}
                                        {detail.variance.toFixed(2)} kg
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Expected: {detail.expected_closing.toFixed(2)} kg
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShiftSummaryDashboard;
