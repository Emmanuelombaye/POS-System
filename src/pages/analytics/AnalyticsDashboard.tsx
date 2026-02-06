import { useState, useEffect } from "react";
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Package, 
  ShoppingCart,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";

interface KPI {
  date: string;
  totalSales: number;
  profit: number;
  activeShifts: number;
  stockValue: number;
  refunds: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  format?: "currency" | "number" | "text";
}

const MetricCard = ({ 
  icon, 
  label, 
  value, 
  format = "text"
}: MetricCardProps) => {
  const formatValue = () => {
    if (format === "currency") {
      return `KES ${Number(value).toLocaleString()}`;
    }
    if (format === "number") {
      return Number(value).toLocaleString();
    }
    return value;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-white">
              {formatValue()}
            </h3>
          </div>
        </div>
        <div className="text-emerald-500/80">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const AnalyticsDashboard = () => {
  const token = useAppStore((s) => s.token);
  
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Fetch analytics function - safe and clean
  const fetchAnalytics = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/kpis?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setKpis(data);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECT: Load once on mount, empty dependency array
  useEffect(() => {
    fetchAnalytics();
  }, []); // Run once only on mount

  const getLastRefreshText = () => {
    if (!lastRefreshTime) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins === 0) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              📊 Analytics Dashboard
            </h1>
            <p className="text-slate-400">
              Real-time business metrics & insights
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:border-emerald-500/50 focus:outline-none focus:border-emerald-500 transition-colors"
            />

            {/* Refresh Button */}
            <Button
              onClick={fetchAnalytics}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 py-2 rounded-lg font-semibold transition-all"
            >
              <RefreshCw 
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Last Refresh Info */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Last refresh: {getLastRefreshText()}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon={<DollarSign className="w-8 h-8" />}
            label="Total Sales"
            value={kpis.totalSales}
            format="currency"
          />

          <MetricCard
            icon={<TrendingUp className="w-8 h-8" />}
            label="Profit (Est.)"
            value={kpis.profit}
            format="currency"
          />

          <MetricCard
            icon={<ShoppingCart className="w-8 h-8" />}
            label="Refunds"
            value={kpis.refunds}
            format="currency"
          />

          <MetricCard
            icon={<Clock className="w-8 h-8" />}
            label="Active Shifts"
            value={kpis.activeShifts}
            format="number"
          />

          <MetricCard
            icon={<Package className="w-8 h-8" />}
            label="Stock Value"
            value={kpis.stockValue}
            format="currency"
          />

          <MetricCard
            icon={<AlertTriangle className="w-8 h-8" />}
            label="Selected Date"
            value={kpis.date}
            format="text"
          />
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border border-emerald-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">On-Demand Refresh</h3>
            <p className="text-sm text-slate-300">
              Data only updates when you click the refresh button. Select a date and refresh to see metrics for that specific day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
