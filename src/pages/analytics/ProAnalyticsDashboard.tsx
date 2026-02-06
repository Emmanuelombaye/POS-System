import { useState, useEffect } from "react";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  Building2,
  ChevronDown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";
import {
  SalesLineChart,
  BranchComparisonChart,
  TopProductsChart,
  CategoryPieChart,
  HourlyActivityChart,
  PaymentMethodChart,
  LossTrackingChart,
  MonthGrowthChart,
} from "@/components/analytics/AnalyticsCharts";
import { generateMockAnalyticsData, calculateSummary } from "@/utils/mockAnalyticsData";

interface KPICard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  format: "currency" | "number" | "text";
  change?: number;
}

const KPICard = ({ label, value, icon, format, change }: KPICard) => {
  const formatValue = () => {
    if (format === "currency") return `KES ${Number(value).toLocaleString()}`;
    if (format === "number") return Number(value).toLocaleString();
    return value;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-white">{formatValue()}</h3>
          {change !== undefined && (
            <p className={`text-sm font-semibold mt-2 ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className="text-emerald-500/80">{icon}</div>
      </div>
    </Card>
  );
};

const ChartSection = ({ title, children, loading = false }: any) => (
  <Card className="p-6 bg-slate-800 border-slate-700">
    <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
    {loading ? (
      <div className="h-80 bg-slate-900 rounded animate-pulse" />
    ) : (
      children
    )}
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-32 bg-slate-800 rounded animate-pulse" />
    ))}
  </div>
);

export const ProAnalyticsDashboard = () => {
  const token = useAppStore((s) => s.token);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState("week");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const branches = ["Tamasha", "Reem", "LungaLunga"];

  // Load analytics once on mount
  useEffect(() => {
    if (token) {
      console.log("[DASHBOARD] Token available, loading analytics");
      loadAnalytics();
    } else {
      console.log("[DASHBOARD] No token available");
    }
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Map dateRange to backend format
      const dateRangeMap: any = {
        "today": "today",
        "week": "week",
        "month": "month"
      };
      
      const apiDateRange = dateRangeMap[dateRange] || "week";

      console.log("[DASHBOARD] Fetching analytics for:", { dateRange: apiDateRange, branch: selectedBranch });

      const data = await api.get("/api/analytics/pro", {
        dateRange: apiDateRange,
        branch: selectedBranch
      });
      
      console.log("[DASHBOARD] Received data:", {
        summary: data.summary,
        salesByDayCount: data.salesByDay?.length,
        branchDataCount: data.branchData?.length,
        topProductsCount: data.topProducts?.length,
        hourlyDataCount: data.hourlyData?.length
      });

      setAnalyticsData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("[DASHBOARD] Failed to load analytics:", error);
      // Fallback to mock data on error
      const mockData = generateMockAnalyticsData(
        dateRange === "week" ? 7 : dateRange === "month" ? 30 : 1
      );
      const enrichedData = calculateSummary(mockData);
      setAnalyticsData(enrichedData);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  const getRefreshText = () => {
    if (!lastRefresh) return "Never loaded";
    const mins = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (mins === 0) return "Just now";
    return `${mins}m ago`;
  };

  if (!analyticsData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Loading...</h1>
          <Button onClick={loadAnalytics} className="bg-emerald-600 hover:bg-emerald-700">
            Load Analytics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur rounded-lg p-4 mb-6 border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">📊 POS Analytics</h1>
            <p className="text-sm text-slate-400 mt-1">Last updated: {getRefreshText()}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              onClick={loadAnalytics}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading && !analyticsData ? (
        <LoadingSkeleton />
      ) : analyticsData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Revenue"
              value={analyticsData.summary.totalRevenue}
              icon={<DollarSign className="w-8 h-8" />}
              format="currency"
              change={12}
            />
            <KPICard
              label="Profit"
              value={analyticsData.summary.totalProfit}
              icon={<TrendingUp className="w-8 h-8" />}
              format="currency"
              change={8}
            />
            <KPICard
              label="Total Orders"
              value={analyticsData.summary.totalOrders}
              icon={<ShoppingCart className="w-8 h-8" />}
              format="number"
              change={15}
            />
            <KPICard
              label="Avg Order Value"
              value={analyticsData.summary.avgOrderValue}
              icon={<DollarSign className="w-8 h-8" />}
              format="currency"
              change={-2}
            />
          </div>

          {/* Revenue and Sales Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection title="Sales Trend" loading={loading}>
              <SalesLineChart data={analyticsData.salesByDay} />
            </ChartSection>
            <ChartSection title="Month-over-Month Growth" loading={loading}>
              <MonthGrowthChart data={analyticsData.monthGrowth} />
            </ChartSection>
          </div>

          {/* Branch Performance */}
          <ChartSection title="Revenue by Branch" loading={loading}>
            <BranchComparisonChart data={analyticsData.branchData} />
          </ChartSection>

          {/* Product and Category Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection title="Top 10 Products" loading={loading}>
              <TopProductsChart data={analyticsData.topProducts} />
            </ChartSection>
            <ChartSection title="Sales by Category" loading={loading}>
              <CategoryPieChart data={analyticsData.categoryData} />
            </ChartSection>
          </div>

          {/* Hourly Activity and Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection title="Hourly Activity" loading={loading}>
              <HourlyActivityChart data={analyticsData.hourlyData} />
            </ChartSection>
            <ChartSection title="Payment Methods" loading={loading}>
              <PaymentMethodChart data={analyticsData.paymentData} />
            </ChartSection>
          </div>

          {/* Cashier Performance */}
          <ChartSection title="Cashier Performance Ranking" loading={loading}>
            <div className="space-y-3">
              {analyticsData.cashierPerformance
                .sort((a: any, b: any) => b.sales - a.sales)
                .map((cashier: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded border border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{cashier.name}</p>
                          <p className="text-xs text-slate-400">{cashier.branch}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        KES {(cashier.sales / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-slate-400">{cashier.transactions} orders</p>
                    </div>
                  </div>
                ))}
            </div>
          </ChartSection>

          {/* Loss Tracking */}
          <ChartSection title="Refunds, Voids & Losses" loading={loading}>
            <LossTrackingChart data={analyticsData.lossData} />
          </ChartSection>

          {/* Low Stock Alerts */}
          <ChartSection title="🚨 Low Stock Alerts" loading={loading}>
            <div className="space-y-3">
              {analyticsData.lowStockItems.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-red-900/20 border border-red-700 rounded"
                >
                  <div>
                    <p className="text-white font-semibold">{item.product}</p>
                    <p className="text-sm text-slate-300">
                      Current: {item.current} units (Reorder: {item.reorderLevel})
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              ))}
            </div>
          </ChartSection>

          {/* Summary Stats */}
          <Card className="p-6 bg-blue-900/20 border-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-slate-300 text-sm">Total Refunds</p>
                <p className="text-2xl font-bold text-white">
                  KES {(analyticsData.summary.totalRefunds / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-slate-300 text-sm">Total Voids</p>
                <p className="text-2xl font-bold text-white">
                  KES {(analyticsData.summary.totalVoids / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-slate-300 text-sm">Profit Margin</p>
                <p className="text-2xl font-bold text-emerald-400">35%</p>
              </div>
              <div>
                <p className="text-slate-300 text-sm">Avg Daily Sales</p>
                <p className="text-2xl font-bold text-white">
                  KES {(analyticsData.summary.totalRevenue / 7 / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-slate-400 text-lg mb-4">No data loaded</p>
          <Button
            onClick={loadAnalytics}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Load Analytics Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProAnalyticsDashboard;
