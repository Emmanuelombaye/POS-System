import { useState, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, Clock, DollarSign, Loader } from "lucide-react";
import { api, isOnline } from "@/utils/api";
import { OfflineErrorDisplay } from "@/components/OfflineErrorDisplay";

interface Shift {
  id: string;
  cashier_id: string;
  cashier_name: string;
  status: string;
  opened_at: string;
  closed_at?: string;
  closing_cash?: number;
  closing_mpesa?: number;
}

interface StockEntry {
  product_id: string;
  product_name: string;
  category: string;
  opening_stock: number;
  added_stock: number;
  sold_stock: number;
  closing_stock?: number;
  variance?: number;
}

interface ActiveShiftData {
  shift: Shift;
  stock_entries: StockEntry[];
  opening_stock?: StockEntry[];
  current_stock?: StockEntry[];
  closing_stock?: StockEntry[];
  total_sales?: number;
  total_variance?: number;
  has_major_variance?: boolean;
  cash_expected?: number;
  mpesa_expected?: number;
  cash_reported?: number;
  mpesa_reported?: number;
  payment_variance?: number;
  has_payment_variance?: boolean;
}

export const ShiftStockDashboard = () => {
  const { token, users } = useAppStore();
  const [activeShifts, setActiveShifts] = useState<ActiveShiftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [selectedCashierId, setSelectedCashierId] = useState<string>("all");

  const fetchActiveShiftsData = async () => {
    try {
      // Fetch active shifts
      const shiftsRes = await api.get("/api/shifts?status=open");
      const activeShiftsOnly = shiftsRes.filter((s: any) => s.status === "open");

      // For each active shift, fetch stock data
      const shiftsWithStockData = await Promise.all(
        activeShiftsOnly.map(async (shift: any) => {
          try {
            const cashier = users.find((u) => u.id === shift.cashier_id);
            const shiftWithName = {
              ...shift,
              cashier_name: cashier?.name || shift.cashier_name || `Cashier ${shift.cashier_id?.slice(0, 6) || "Unknown"}`,
              closing_cash: shift.closing_cash !== undefined && shift.closing_cash !== null ? Number(shift.closing_cash) : undefined,
              closing_mpesa: shift.closing_mpesa !== undefined && shift.closing_mpesa !== null ? Number(shift.closing_mpesa) : undefined,
            };
            const stockRes = await api.get(`/api/shift-stock?shift_id=${shift.id}`);
            const entries = stockRes.entries || [];

            const transactions = await api.get("/api/transactions", { shift_id: shift.id });
            const cashExpected = (transactions || []).filter((t: any) => t.payment_method === "cash")
              .reduce((sum: number, t: any) => sum + Number(t.total || 0), 0);
            const mpesaExpected = (transactions || []).filter((t: any) => t.payment_method === "mpesa")
              .reduce((sum: number, t: any) => sum + Number(t.total || 0), 0);

            const cashReported = shiftWithName.closing_cash;
            const mpesaReported = shiftWithName.closing_mpesa;
            const hasPaymentsReported = cashReported !== undefined && mpesaReported !== undefined;
            const paymentVariance = hasPaymentsReported
              ? (Number(cashReported || 0) + Number(mpesaReported || 0)) - (cashExpected + mpesaExpected)
              : undefined;
            const hasPaymentVariance = paymentVariance !== undefined && Math.abs(paymentVariance) > 1;

            const hasClosing = entries.some((e: any) => e.closing_stock !== null && e.closing_stock !== undefined);

            // Calculate totals
            const totalVariance = hasClosing
              ? entries.reduce((sum: number, e: any) => {
                  const variance = (e.opening_stock || 0) + (e.added_stock || 0) - (e.sold_stock || 0) - (e.closing_stock || 0);
                  return sum + variance;
                }, 0)
              : undefined;

            const hasVariance = totalVariance !== undefined && Math.abs(totalVariance) > 0.5;

            return {
              shift: shiftWithName,
              stock_entries: entries,
              total_variance: totalVariance,
              has_major_variance: hasVariance,
              cash_expected: cashExpected,
              mpesa_expected: mpesaExpected,
              cash_reported: cashReported,
              mpesa_reported: mpesaReported,
              payment_variance: paymentVariance,
              has_payment_variance: hasPaymentVariance,
            };
          } catch (error) {
            console.error(`[DASHBOARD] Error fetching stock for shift ${shift.id}:`, error);
            return {
              shift: {
                ...shift,
                cashier_name: shift.cashier_name || `Cashier ${shift.cashier_id?.slice(0, 6) || "Unknown"}`,
              },
              stock_entries: [],
              total_variance: undefined,
              has_major_variance: false,
              cash_expected: undefined,
              mpesa_expected: undefined,
              cash_reported: undefined,
              mpesa_reported: undefined,
              payment_variance: undefined,
              has_payment_variance: false,
            };
          }
        })
      );

      setActiveShifts(shiftsWithStockData);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching shifts:", error);
      setError((error as Error).message || "Failed to load shifts data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShiftsData();
    const interval = setInterval(fetchActiveShiftsData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [token, users]);

  const filteredShifts = selectedCashierId === "all"
    ? activeShifts
    : activeShifts.filter((s) => s.shift.cashier_id === selectedCashierId);

  const issuesCount = filteredShifts.filter((s) => s.has_major_variance || s.has_payment_variance).length;
  const healthyCount = Math.max(filteredShifts.length - issuesCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
          <h1 className="text-4xl font-black text-gray-900">📊 Shift Stock Monitor</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: <span className="font-mono font-bold text-gray-700">{lastUpdate}</span>
            </div>
            <select
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700"
              value={selectedCashierId}
              onChange={(e) => setSelectedCashierId(e.target.value)}
            >
              <option value="all">All Cashiers</option>
              {users.filter((u) => u.role === "cashier").map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-gray-600">Real-time tracking of cashier shifts, stock movements, and payments</p>
      </div>

      {/* Active Shifts Count */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Shifts</p>
                <p className="text-3xl font-black text-gray-900">{filteredShifts.length}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Issues Detected</p>
                <p className="text-3xl font-black text-gray-900">
                  {issuesCount}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Shifts Closed</p>
                <p className="text-3xl font-black text-gray-900">
                  {filteredShifts.filter((s) => s.shift.status === "PENDING_REVIEW").length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Stock Health</p>
                <p className="text-3xl font-black text-emerald-600">
                  {filteredShifts.length > 0 ? Math.round((healthyCount / filteredShifts.length) * 100) : 100}%
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Grid */}
      <OfflineErrorDisplay error={error} isLoading={loading} />

      {loading && !error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shifts...</p>
          </div>
        </div>
      ) : filteredShifts.length === 0 ? (
        <Card className="bg-white border-none shadow-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No active shifts</p>
            <p className="text-sm text-gray-500">Cashiers will appear here once they open a shift</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredShifts.map((data) => (
            <ShiftMonitorCard key={data.shift.id} data={data} />
          ))}
        </div>
      )}
    </div>
  );
};

interface ShiftMonitorCardProps {
  data: ActiveShiftData;
}

const ShiftMonitorCard: React.FC<ShiftMonitorCardProps> = ({ data }) => {
  const {
    shift,
    stock_entries,
    total_variance,
    has_major_variance = false,
    cash_expected,
    mpesa_expected,
    cash_reported,
    mpesa_reported,
    payment_variance,
    has_payment_variance = false
  } = data;
  const variance = total_variance ?? 0;
  const paymentVariance = payment_variance ?? 0;
  const hasIssues = has_major_variance || has_payment_variance;

  const openedAt = new Date(shift.opened_at);
  const shiftDuration = Math.round((Date.now() - openedAt.getTime()) / 1000 / 60); // minutes

  // Group products by category
  const byCategory: { [key: string]: StockEntry[] } = {};
  stock_entries.forEach((entry: any) => {
    const cat = entry.products?.category || entry.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    const hasClosingStock = entry.closing_stock !== null && entry.closing_stock !== undefined;
    byCategory[cat].push({
      product_id: entry.product_id,
      product_name: entry.products?.name || "Unknown",
      category: cat,
      opening_stock: entry.opening_stock || 0,
      added_stock: entry.added_stock || 0,
      sold_stock: entry.sold_stock || 0,
      closing_stock: entry.closing_stock,
      variance: hasClosingStock
        ? (entry.opening_stock || 0) + (entry.added_stock || 0) - (entry.sold_stock || 0) - (entry.closing_stock || 0)
        : undefined,
    });
  });

  const totalOpening = stock_entries.reduce((sum: number, e: any) => sum + (e.opening_stock || 0), 0);
  const totalSold = stock_entries.reduce((sum: number, e: any) => sum + (e.sold_stock || 0), 0);
  const totalAdded = stock_entries.reduce((sum: number, e: any) => sum + (e.added_stock || 0), 0);
  const totalClosing = stock_entries.reduce((sum: number, e: any) => sum + (e.closing_stock || 0), 0);
  const hasClosing = stock_entries.some((e: any) => e.closing_stock !== null && e.closing_stock !== undefined);

  return (
    <Card className={`border-none shadow-md transition-all ${hasIssues ? "border-l-4 border-l-red-500 bg-red-50" : "bg-white"}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-black text-gray-900">{shift.cashier_name}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {openedAt.toLocaleTimeString()} ({shiftDuration} min)
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${shift.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                {shift.status === "open" ? "🟢 LIVE" : "⏸️ PENDING"}
              </div>
            </div>
          </div>

          {/* Variance Alert */}
          {has_major_variance && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-right">
              <p className="text-xs text-red-600 font-bold uppercase">Stock Variance</p>
              <p className={`text-2xl font-black ${variance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {variance < 0 ? "−" : "+"}{Math.abs(variance).toFixed(2)} kg
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatBox label="Opening" value={totalOpening.toFixed(2)} unit="kg" color="blue" />
          <StatBox label="Added" value={totalAdded.toFixed(2)} unit="kg" color="green" />
          <StatBox label="Sold" value={totalSold.toFixed(2)} unit="kg" color="orange" />
          <StatBox label="Expected" value={(totalOpening + totalAdded - totalSold).toFixed(2)} unit="kg" color="purple" />
          {hasClosing && <StatBox label="Actual" value={totalClosing.toFixed(2)} unit="kg" color="indigo" />}
        </div>

        {!hasClosing && shift.status === "open" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-900">Shift Still Open</p>
                <p className="text-sm text-yellow-800">Waiting for cashier to close shift and enter closing stock counts</p>
              </div>
            </div>
          </div>
        )}

        {hasClosing && (
          <div className={`border rounded-lg p-4 ${variance === 0 ? "bg-emerald-50 border-emerald-200" : variance < 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-bold ${variance === 0 ? "text-emerald-900" : variance < 0 ? "text-red-900" : "text-blue-900"}`}>
                  {variance === 0 ? "✓ Stock Reconciled" : variance < 0 ? "⚠ Missing Stock" : "+ Extra Stock"}
                </p>
                <p className={`text-sm ${variance === 0 ? "text-emerald-800" : variance < 0 ? "text-red-800" : "text-blue-800"}`}>
                  Variance: {variance < 0 ? "−" : "+"}{Math.abs(variance).toFixed(2)} kg
                </p>
              </div>
              {variance === 0 && <div className="text-3xl">✓</div>}
            </div>
          </div>
        )}

        {(cash_expected !== undefined || mpesa_expected !== undefined) && (
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Payments</p>
                <p className="text-sm font-bold text-gray-700">Cash & M-Pesa Totals</p>
              </div>
              {cash_reported !== undefined && mpesa_reported !== undefined && (
                <div className={`text-xs font-bold ${paymentVariance === 0 ? "text-emerald-600" : paymentVariance < 0 ? "text-red-600" : "text-blue-600"}`}>
                  {paymentVariance === 0 ? "✓ Balanced" : paymentVariance < 0 ? "⚠ Short" : "+ Extra"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Expected Cash</div>
                <div className="text-lg font-black text-gray-900">{Number(cash_expected || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Expected M-Pesa</div>
                <div className="text-lg font-black text-gray-900">{Number(mpesa_expected || 0).toFixed(2)}</div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Reported Cash</div>
                <div className="text-lg font-black text-indigo-900">{cash_reported !== undefined ? Number(cash_reported).toFixed(2) : "—"}</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Reported M-Pesa</div>
                <div className="text-lg font-black text-indigo-900">{mpesa_reported !== undefined ? Number(mpesa_reported).toFixed(2) : "—"}</div>
              </div>
            </div>

            {cash_reported !== undefined && mpesa_reported !== undefined && (
              <div className={`mt-3 rounded-xl p-3 ${paymentVariance === 0 ? "bg-emerald-50" : paymentVariance < 0 ? "bg-red-50" : "bg-blue-50"}`}>
                <div className={`text-sm font-bold ${paymentVariance === 0 ? "text-emerald-700" : paymentVariance < 0 ? "text-red-700" : "text-blue-700"}`}>
                  Payment Variance: {paymentVariance < 0 ? "−" : "+"}{Math.abs(paymentVariance).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products by Category */}
        <div className="space-y-4">
          {Object.entries(byCategory).map(([category, products]) => (
            <div key={category} className="border-t pt-4">
              <h4 className="font-bold text-gray-900 mb-3 capitalize">{category} Products</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-bold text-gray-700">Product</th>
                      <th className="text-right py-2 font-bold text-gray-700">Opening</th>
                      <th className="text-right py-2 font-bold text-gray-700">Added</th>
                      <th className="text-right py-2 font-bold text-gray-700">Sold</th>
                      <th className="text-right py-2 font-bold text-gray-700">Expected</th>
                      {products.some((p) => p.closing_stock !== undefined) && <th className="text-right py-2 font-bold text-gray-700">Actual</th>}
                      {products.some((p) => p.variance !== undefined) && <th className="text-right py-2 font-bold text-gray-700">Variance</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 text-gray-900">{product.product_name}</td>
                        <td className="py-2 text-right text-gray-700">{product.opening_stock.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700">{product.added_stock.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700">{product.sold_stock.toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-700 font-bold">{(product.opening_stock + product.added_stock - product.sold_stock).toFixed(2)}</td>
                        {product.closing_stock !== undefined && (
                          <td className="py-2 text-right text-gray-700 font-bold">{product.closing_stock.toFixed(2)}</td>
                        )}
                        {product.variance !== undefined && (
                          <td className={`py-2 text-right font-bold ${product.variance === 0 ? "text-gray-700" : product.variance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {product.variance < 0 ? "−" : "+"}{Math.abs(product.variance).toFixed(2)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface StatBoxProps {
  label: string;
  value: string;
  unit: string;
  color: "blue" | "green" | "orange" | "purple" | "indigo";
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, unit, color }) => {
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-emerald-50 border-emerald-200",
    orange: "bg-orange-50 border-orange-200",
    purple: "bg-purple-50 border-purple-200",
    indigo: "bg-indigo-50 border-indigo-200",
  };

  const textClasses: { [key: string]: string } = {
    blue: "text-blue-900",
    green: "text-emerald-900",
    orange: "text-orange-900",
    purple: "text-purple-900",
    indigo: "text-indigo-900",
  };

  return (
    <div className={`border rounded-lg p-3 text-center ${colorClasses[color]}`}>
      <p className={`text-xs font-bold uppercase ${textClasses[color]}`}>{label}</p>
      <p className={`text-2xl font-black ${textClasses[color]}`}>{value}</p>
      <p className={`text-xs ${textClasses[color]} opacity-75`}>{unit}</p>
    </div>
  );
};
