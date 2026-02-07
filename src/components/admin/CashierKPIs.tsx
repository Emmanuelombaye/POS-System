import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, TrendingUp, DollarSign, Clock } from "lucide-react";
import { api } from "@/utils/api";

interface CashierKPI {
  cashier_id: string;
  cashier_name: string;
  total_sales: number;
  transaction_count: number;
  avg_transaction: number;
  shift_hours: number;
  sales_per_hour: number;
}

export const CashierKPIs = () => {
  const [kpis, setKpis] = useState<CashierKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"sales" | "transactions" | "efficiency">("sales");

  useEffect(() => {
    fetchCashierKPIs();
  }, []);

  const fetchCashierKPIs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/cashier-kpis");
      setKpis(response?.data || []);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...kpis].sort((a, b) => {
    if (sortBy === "sales") return b.total_sales - a.total_sales;
    if (sortBy === "transactions") return b.transaction_count - a.transaction_count;
    return b.sales_per_hour - a.sales_per_hour;
  });

  const topPerformer = sorted[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">📈 Cashier Performance KPIs</h2>
        <p className="text-sm text-gray-500">Track individual cashier metrics & efficiency</p>
      </div>

      {/* Top Performer */}
      {topPerformer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-600 flex items-center justify-center text-white font-black text-lg">
              ⭐
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase">Top Performer Today</p>
              <p className="text-2xl font-black text-amber-900">{topPerformer.cashier_name}</p>
              <p className="text-sm text-amber-800">KES {topPerformer.total_sales.toFixed(0)} in {topPerformer.transaction_count} transactions</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort Buttons */}
      <div className="flex gap-2">
        {["sales", "transactions", "efficiency"].map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort as any)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              sortBy === sort
                ? "bg-brand-burgundy text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {sort === "sales" ? "By Sales" : sort === "transactions" ? "By Transactions" : "By Efficiency"}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sorted.map((kpi, i) => (
            <motion.div
              key={kpi.cashier_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-burgundy/20 flex items-center justify-center font-black text-brand-burgundy">
                    {kpi.cashier_name.charAt(0)}
                  </div>
                  <div className="font-bold text-gray-900">{kpi.cashier_name}</div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-semibold">Total Sales</p>
                  <p className="text-lg font-black text-brand-burgundy">KES {kpi.total_sales.toFixed(0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-blue-50">
                  <div className="text-gray-600 font-semibold">Transactions</div>
                  <div className="font-black text-blue-900">{kpi.transaction_count}</div>
                </div>
                <div className="p-2 rounded-lg bg-green-50">
                  <div className="text-gray-600 font-semibold">Avg / Trans</div>
                  <div className="font-black text-green-900">KES {kpi.avg_transaction.toFixed(0)}</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-50">
                  <div className="text-gray-600 font-semibold">Hrs Worked</div>
                  <div className="font-black text-purple-900">{kpi.shift_hours.toFixed(1)}h</div>
                </div>
                <div className="p-2 rounded-lg bg-orange-50">
                  <div className="text-gray-600 font-semibold">Per Hour</div>
                  <div className="font-black text-orange-900">KES {kpi.sales_per_hour.toFixed(0)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
