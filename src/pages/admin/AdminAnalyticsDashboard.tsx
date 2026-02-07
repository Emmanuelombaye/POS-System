import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/utils/supabase";
import { useAppStore } from "@/store/appStore";
import { api } from "@/utils/api";

interface GrowthPoint {
  label: string;
  value: number;
}

interface GrowthResponse {
  range: string;
  bucket: "hour" | "day" | "week" | "month";
  current: GrowthPoint[];
  previous: GrowthPoint[];
}

interface GrowthSummary {
  range: string;
  bucket: "hour" | "day" | "week" | "month";
  currentTotal: number;
  previousTotal: number;
  avg: number;
  bestLabel: string;
  changePct: number;
  trend: "Growing" | "Stable" | "Declining";
}

const RANGE_OPTIONS = ["1D", "7D", "1M", "3M", "6M", "1Y"] as const;

const formatCurrency = (amount: number, currency: string) => {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
};

const formatLabel = (label: string, bucket: GrowthResponse["bucket"]) => {
  if (bucket === "hour") {
    return label;
  }
  const date = new Date(`${label}T00:00:00`);
  return date.toLocaleDateString(undefined, bucket === "month"
    ? { month: "short", year: "2-digit" }
    : { month: "short", day: "2-digit" });
};

const computeTrend = (values: number[]) => {
  if (values.length < 2) {
    return { label: "Stable", slope: 0 };
  }

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

  if (slope > threshold) return { label: "Growing", slope };
  if (slope < -threshold) return { label: "Declining", slope };
  return { label: "Stable", slope };
};

export const AdminAnalyticsDashboard = () => {
  const token = useAppStore((s) => s.token);
  const settings = useAppStore((s) => s.settings);
  const currency = settings.currency || "KES";

  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>("7D");
  const [growthData, setGrowthData] = useState<GrowthResponse | null>(null);
  const [summary, setSummary] = useState<GrowthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);

  const fetchGrowth = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      console.log('[GROWTH] API_URL:', API_URL);
      console.log('[GROWTH] Fetching growth data for range:', range);
      console.log('[GROWTH] Full URL will be:', `${API_URL}/api/admin/analytics/growth?range=${range}`);
      
      const [growthResponse, summaryResponse] = await Promise.all([
        api.get(`/api/admin/analytics/growth`, { range }),
        api.get(`/api/admin/analytics/growth/summary`, { range }),
      ]);

      console.log('[GROWTH] Growth response:', growthResponse);
      console.log('[GROWTH] Summary response:', summaryResponse);

      setGrowthData(growthResponse as GrowthResponse);
      setSummary(summaryResponse as GrowthSummary);
      setPinnedIndex(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[GROWTH] Error fetching growth data:', err);
      const errorMsg = (err as Error).message || 'Failed to load growth data';
      setError(`${errorMsg}\n\nPlease ensure the backend server is running on port 4000.`);
    } finally {
      setLoading(false);
    }
  }, [range, token]);

  useEffect(() => {
    fetchGrowth();
  }, [fetchGrowth]);

  useEffect(() => {
    if (!token) return;

    const transactionsChannel = supabase
      .channel("growth-transactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchGrowth()
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchGrowth();
    }, 20000);

    return () => {
      transactionsChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchGrowth, token]);

  const chartSeries = useMemo(() => {
    if (!growthData) return [];
    return growthData.current.map((point, index) => ({
      label: formatLabel(point.label, growthData.bucket),
      current: point.value,
      previous: growthData.previous[index]?.value ?? 0,
    }));
  }, [growthData]);

  const pinnedPoint = useMemo(() => {
    if (pinnedIndex === null) return null;
    return chartSeries[pinnedIndex] || null;
  }, [chartSeries, pinnedIndex]);

  const totals = useMemo(() => {
    if (summary) {
      return {
        current: summary.currentTotal,
        previous: summary.previousTotal,
        avg: summary.avg,
        best: summary.bestLabel && growthData ? formatLabel(summary.bestLabel, summary.bucket) : "-",
      };
    }

    if (!growthData) {
      return { current: 0, previous: 0, avg: 0, best: "-" };
    }

    const currentTotal = growthData.current.reduce((sum, point) => sum + point.value, 0);
    const previousTotal = growthData.previous.reduce((sum, point) => sum + point.value, 0);
    const avg = growthData.current.length > 0 ? currentTotal / growthData.current.length : 0;

    let best = "-";
    let maxValue = -Infinity;
    growthData.current.forEach((point) => {
      if (point.value > maxValue) {
        maxValue = point.value;
        best = formatLabel(point.label, growthData.bucket);
      }
    });

    return { current: currentTotal, previous: previousTotal, avg, best };
  }, [growthData, summary]);

  const changePct = summary?.changePct ?? (totals.previous > 0
    ? ((totals.current - totals.previous) / totals.previous) * 100
    : 0);

  const trend = summary ? { label: summary.trend } : computeTrend(growthData?.current.map((point) => point.value) || []);

  const avgLabel = (summary?.bucket || growthData?.bucket) === "hour" ? "Avg Hourly Sales" : "Avg Daily Sales";

  const handleChartClick = useCallback((data: any) => {
    const index = data?.activeTooltipIndex;
    if (typeof index !== "number") return;
    setPinnedIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff1e8,_#fdf6f2_40%,_#f6f3ef_70%)] text-slate-900"
      style={{ fontFamily: "'Sora', 'Montserrat', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Business Intelligence</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Business Growth Timeline
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              A single view that morphs across time horizons, revealing growth momentum
              and performance shifts instantly.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/70 border border-white rounded-full px-4 py-2 shadow-sm">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-600">Live feed</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button
              onClick={fetchGrowth}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
          <motion.div
            key={range}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-white/70 bg-white/90 shadow-xl backdrop-blur-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Growth Engine</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">Revenue Flow</h2>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {range}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setRange(option)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      range === option
                        ? "bg-slate-900 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold">Business Trend</p>
                  <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    {trend.label === "Growing" && <TrendingUp className="h-5 w-5 text-emerald-500" />}
                    {trend.label === "Declining" && <TrendingDown className="h-5 w-5 text-rose-500" />}
                    {trend.label === "Stable" && <Minus className="h-5 w-5 text-slate-400" />}
                    {trend.label}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  Last update: {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
                </div>
              </div>

              <div className="mt-4 h-[320px] relative">
                {loading ? (
                  <div className="h-full rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse" />
                ) : error ? (
                  <div className="h-full rounded-2xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-500 text-sm p-6">
                    <p className="font-bold mb-2">Error Loading Data</p>
                    <p className="text-center">{error}</p>
                    <button
                      onClick={fetchGrowth}
                      className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600"
                    >
                      Retry
                    </button>
                  </div>
                ) : chartSeries.length === 0 ? (
                  <div className="h-full rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-600 text-sm p-6">
                    <Activity className="h-12 w-12 mb-3 opacity-50" />
                    <p className="font-bold mb-1">No Data Available</p>
                    <p className="text-center text-xs text-blue-500">
                      No transactions found for the selected period. Start recording sales to see growth trends.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartSeries}
                      margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                      onClick={handleChartClick}
                    >
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                      />
                      <Tooltip
                        cursor={{ stroke: "#0f766e", strokeWidth: 1, strokeDasharray: "4 4" }}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency), "Sales"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke="#0f766e"
                        strokeWidth={3}
                        fill="url(#growthFill)"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="previous"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {pinnedPoint && (
                  <div className="absolute right-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-xs shadow-lg">
                    <div className="text-slate-500">Pinned point</div>
                    <div className="text-sm font-bold text-slate-900">{pinnedPoint.label}</div>
                    <div className="text-sm font-semibold text-emerald-700">
                      {formatCurrency(pinnedPoint.current, currency)}
                    </div>
                    <button
                      onClick={() => setPinnedIndex(null)}
                      className="mt-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Clear pin
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-slate-400">
                Tap a point to pin details. Tap again to clear.
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Current period
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Previous period
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase text-slate-400 font-semibold">Total Sales</p>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(totals.current, currency)}
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${changePct >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}% vs previous
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase text-slate-400 font-semibold">{avgLabel}</p>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {formatCurrency(totals.avg, currency)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Based on {growthData?.current.length || 0} buckets
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase text-slate-400 font-semibold">Best Period</p>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{totals.best}</div>
                  <p className="mt-1 text-xs text-slate-500">Highest sales point</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/70 bg-white/90 shadow-xl p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Growth pulse</p>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Owner Snapshot</h3>
              <p className="text-sm text-slate-500 mt-3">
                The growth curve is automatically compared to the previous period to surface momentum shifts
                without manual analysis.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs uppercase text-emerald-600 font-semibold">Momentum</p>
                      <p className="text-lg font-bold text-slate-900">{trend.label}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-4">
                  <div className="flex items-center gap-3">
                    <ArrowDownRight className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-xs uppercase text-amber-600 font-semibold">Comparison</p>
                      <p className="text-lg font-bold text-slate-900">
                        {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase text-slate-500 font-semibold">Current Range</p>
                      <p className="text-lg font-bold text-slate-900">{range}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-slate-900 text-white p-6 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Growth story</p>
              <h3 className="text-xl font-bold mt-2">Pitch-ready insight</h3>
              <p className="text-sm text-slate-300 mt-4">
                This timeline is built for owners: a single graph, adaptive to any horizon, with
                instant period comparison. The slope shows direction, the fill shows volume, and the
                dotted baseline keeps yesterday in view.
              </p>
              <div className="mt-4 text-sm text-slate-200 font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Business trend is {trend.label.toLowerCase()} in the selected window.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
