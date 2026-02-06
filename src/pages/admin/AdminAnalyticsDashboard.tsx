import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { KPICard, KPILoadingSkeleton } from "@/components/analytics/KPICard";
import {
  SalesTrendChart,
  TopProductsChart,
  BranchComparisonChart,
  AlertsPanel,
  ProfitTrendChart,
  SalesForecastChart,
} from "@/components/analytics/Charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoLoader } from "@/components/ui/LogoLoader";
import { useAppStore } from "@/store/appStore";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  ShoppingCart,
  RefreshCw,
  Calendar,
  Sparkles,
  ShieldAlert,
  Paintbrush,
} from "lucide-react";

export const AdminAnalyticsDashboard = () => {
  const settings = useAppStore((s) => s.settings);
  const currentUser = useAppStore((s) => s.currentUser);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { theme, setTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);

  const {
    kpis,
    salesTrend,
    topProducts,
    branches,
    lowStock,
    activeShifts,
    waste,
    loading,
    error,
    refetch,
  } = useAnalytics(selectedDate);

  useEffect(() => {
    setReceiptHeader(settings.receiptHeader);
  }, [settings.receiptHeader]);

  const currency = settings.currency || "KES";

  const profitMargin = useMemo(() => {
    if (!kpis || kpis.totalSales <= 0) return 0.32;
    const margin = kpis.profit / kpis.totalSales;
    return Math.min(Math.max(margin, 0.12), 0.6);
  }, [kpis]);

  const profitTrend = useMemo(
    () => salesTrend.map((point) => ({
      date: point.date,
      profit: Math.round(point.sales * profitMargin),
    })),
    [salesTrend, profitMargin]
  );

  const salesForecast = useMemo(() => {
    if (salesTrend.length === 0) return [] as Array<{ date: string; actual?: number; forecast?: number }>;

    const historical = salesTrend.slice(-14);
    const last7 = historical.slice(-7);
    const avg = last7.reduce((sum, p) => sum + p.sales, 0) / Math.max(last7.length, 1);
    const trend = last7.length >= 2 ? (last7[last7.length - 1].sales - last7[0].sales) / Math.max(last7[0].sales, 1) : 0;
    const dailyGrowth = Math.min(Math.max(trend / 7, -0.05), 0.05);

    const actualSeries = last7.map((p) => ({ date: p.date, actual: p.sales }));
    const baseDate = new Date();
    const forecastSeries = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i + 1);
      const nextValue = Math.round(avg * (1 + dailyGrowth * (i + 1)));
      return {
        date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        forecast: Math.max(nextValue, 0),
      };
    });

    return [...actualSeries, ...forecastSeries];
  }, [salesTrend]);

  // Generate alerts
  const alerts = useMemo(() => {
    const alertItems: any[] = [];

    if (lowStock.length > 0) {
      alertItems.push({
        id: "low-stock",
        title: `⚠️ ${lowStock.length} Product(s) Low on Stock`,
        description: `${lowStock[0]?.name} has only ${lowStock[0]?.stock_kg}kg remaining`,
        severity: lowStock[0]?.stock_kg === 0 ? "critical" : "warning",
      });
    }

    if (activeShifts.length === 0) {
      alertItems.push({
        id: "no-shifts",
        title: "ℹ️ No Active Shifts",
        description: "All shifts have been closed for the day",
        severity: "info",
      });
    }

    if (kpis && kpis.refunds > kpis.totalSales * 0.05) {
      alertItems.push({
        id: "high-refunds",
        title: "⚠️ High Refund Rate",
        description: `Refunds are ${((kpis.refunds / kpis.totalSales) * 100).toFixed(1)}% of sales`,
        severity: "warning",
      });
    }

    if (waste.length > 0) {
      const totalWaste = waste.reduce((sum, w) => sum + w.wasted_kg, 0);
      alertItems.push({
        id: "waste",
        title: `📦 Waste/Spoilage Detected`,
        description: `${totalWaste.toFixed(1)}kg of product waste recorded`,
        severity: "warning",
      });
    }

    const lastDay = salesTrend[salesTrend.length - 1];
    if (lastDay && salesTrend.length >= 4) {
      const avgSales = salesTrend.reduce((sum, s) => sum + s.sales, 0) / salesTrend.length;
      if (lastDay.sales > avgSales * 1.7) {
        alertItems.push({
          id: "sales-spike",
          title: "🚀 Sales Spike Detected",
          description: `Latest sales are ${Math.round(lastDay.sales / avgSales)}x above average`,
          severity: "info",
        });
      }
    }

    const longShift = activeShifts.find((s) => s.duration_minutes > 720);
    if (longShift) {
      alertItems.push({
        id: "long-shift",
        title: "🕒 Long Running Shift",
        description: `${longShift.cashier} has been active for ${Math.round(longShift.duration_minutes / 60)}h`,
        severity: "warning",
      });
    }

    if (lowStock.length > 0 && topProducts.length > 0) {
      const topNames = new Set(topProducts.slice(0, 3).map((p) => p.name.toLowerCase()));
      const riskItem = lowStock.find((item) => topNames.has(item.name.toLowerCase()));
      if (riskItem) {
        alertItems.push({
          id: "top-seller-low-stock",
          title: "⚠️ Bestseller Running Low",
          description: `${riskItem.name} is low on stock and is a top seller`,
          severity: "critical",
        });
      }
    }

    return alertItems;
  }, [lowStock, activeShifts, kpis, waste, salesTrend, topProducts]);

  const handleSaveReceipt = () => {
    updateSettings({ receiptHeader }, currentUser?.id ?? "system");
  };

  if (loading && !kpis && salesTrend.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl">
          <LogoLoader label="Loading analytics" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
              📊 Analytics Dashboard
            </h1>
            <p className="text-slate-600 font-bold">
              Real-time business metrics & insights
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border-2 border-slate-200 rounded-lg font-bold"
              />
            </div>
            <Button
              onClick={() => refetch()}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6"
          >
            <p className="text-red-900 font-bold">⚠️ Error Loading Analytics</p>
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {/* KPI Cards Grid */}
        {loading ? (
          <KPILoadingSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {kpis && (
              <>
                <KPICard
                  title="Total Sales"
                  value={`${currency} ${kpis.totalSales.toLocaleString()}`}
                  icon={<DollarSign className="h-8 w-8" />}
                  color="blue"
                  subtitle="Today"
                />

                <KPICard
                  title="Profit"
                  value={`${currency} ${kpis.profit.toLocaleString()}`}
                  icon={<TrendingUp className="h-8 w-8" />}
                  color="green"
                  subtitle="Estimated"
                />

                <KPICard
                  title="Active Shifts"
                  value={kpis.activeShifts}
                  icon={<Clock className="h-8 w-8" />}
                  color="purple"
                  subtitle="Ongoing"
                />

                <KPICard
                  title="Stock Value"
                  value={`${currency} ${kpis.stockValue.toLocaleString()}`}
                  icon={<Package className="h-8 w-8" />}
                  color="amber"
                  subtitle="Current inventory"
                />

                <KPICard
                  title="Refunds/Voids"
                  value={`${currency} ${kpis.refunds.toLocaleString()}`}
                  icon={<AlertTriangle className="h-8 w-8" />}
                  color={kpis.refunds > 5000 ? "red" : "amber"}
                  subtitle="Today's adjustments"
                />

                <KPICard
                  title="Transactions"
                  value={activeShifts.length}
                  icon={<ShoppingCart className="h-8 w-8" />}
                  color="blue"
                  subtitle="Active cashiers"
                />
              </>
            )}
          </motion.div>
        )}

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <SalesTrendChart data={salesTrend} loading={loading} />
          <SalesForecastChart data={salesForecast} loading={loading} />
          <TopProductsChart
            data={topProducts.map((p) => ({
              name: p.name,
              kg: p.kg,
            }))}
            loading={loading}
          />
          <ProfitTrendChart data={profitTrend} loading={loading} />
          <BranchComparisonChart data={branches} loading={loading} />
          <AlertsPanel items={alerts} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              <h3 className="text-lg font-black text-slate-900">Best Sellers</h3>
            </div>
            {topProducts.length === 0 ? (
              <div className="text-sm text-slate-500">No sales yet.</div>
            ) : (
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((product, idx) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{product.kg.toFixed(1)}kg</div>
                      <div className="text-xs text-slate-500">{product.count} sales</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">Suspicious Activity</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="text-sm text-emerald-600 font-bold">All clear. No anomalies detected.</div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <div className="text-xs font-black text-amber-900">{alert.title}</div>
                    <div className="text-xs text-amber-700 mt-1">{alert.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Paintbrush className="h-6 w-6 text-brand-burgundy" />
              <h3 className="text-lg font-black text-slate-900">Theme & Branding</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${theme === "light" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${theme === "dark" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${theme === "system" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
                >
                  System
                </button>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-xl bg-brand-burgundy" />
                <div className="h-10 w-10 rounded-xl bg-brand-gold" />
                <div className="h-10 w-10 rounded-xl bg-brand-charcoal" />
                <div className="h-10 w-10 rounded-xl bg-brand-copper" />
              </div>
              <div className="text-xs text-slate-500">System theme colors applied across dashboards & receipts.</div>
            </div>
          </div>
        </motion.div>

        {/* Active Shifts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-6">
            <h2 className="text-xl font-black text-white">Active Shifts</h2>
          </div>

          {activeShifts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 font-bold">No active shifts</p>
              <p className="text-slate-500 text-sm">All shifts have been closed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-900">
                      Cashier
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-900">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-900">
                      Started
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-slate-900">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {activeShifts.map((shift, index) => (
                      <motion.tr
                        key={shift.shift_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {shift.cashier}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{shift.branch}</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {new Date(shift.opened_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-bold">
                            {shift.duration_minutes}m
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Low Stock Alert Table */}
        {lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-red-200 rounded-xl shadow-sm overflow-hidden mt-8"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <h2 className="text-xl font-black text-white">
                🚨 Low Stock Alert ({lowStock.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50 border-b-2 border-red-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-black text-red-900">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-red-900">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-red-900">
                      Current Stock
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-black text-red-900">
                      Threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-red-100 hover:bg-red-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-red-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-red-700">{item.category}</td>
                      <td className="px-6 py-4">
                        <span className="bg-red-100 text-red-900 px-3 py-1 rounded-full text-sm font-bold">
                          {item.stock_kg.toFixed(1)}kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-red-600">
                        {item.low_stock_threshold_kg.toFixed(1)}kg
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Custom Receipt Branding</h3>
            <div className="space-y-3">
              <textarea
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm font-semibold focus:border-brand-burgundy outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Appears at the top of every receipt</span>
                <Button onClick={handleSaveReceipt} className="bg-brand-burgundy hover:bg-red-900 text-white font-bold px-4 py-2 rounded-lg">
                  Save Branding
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Receipt Preview</h3>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white shadow-sm ring-2 ring-brand-gold/40 flex items-center justify-center">
                <img src="/logo.png" alt="Eden Drop 001" className="h-10 w-10 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                <span className="text-xs font-black text-brand-charcoal">ED</span>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-brand-charcoal whitespace-pre-line">
                {receiptHeader}
              </div>
              <div className="mt-4 text-xs text-slate-500">Thank you for shopping with Eden Drop 001</div>
              <div className="mt-2 text-xs text-slate-400">Powered by Eden Drop POS</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
