import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, TrendingUp, TrendingDown, Package } from "lucide-react";

interface StockEntry {
  id: string;
  product_id: string;
  branch_id: string;
  shift_date: string;
  opening_stock: number;
  added_stock: number;
  sold_stock: number;
  closing_stock: number;
  variance: number;
  products: {
    name: string;
    category: string;
    code: string;
    low_stock_threshold_kg?: number;
  };
}

interface StockSummary {
  total_opening: number;
  total_added: number;
  total_sold: number;
  total_closing: number;
  low_stock_count: number;
  entries: StockEntry[];
}

export const StockManagement = () => {
  const currentBranch = useAppStore((s) => s.currentBranch);
  const token = useAppStore((s) => s.token);

  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Fetch stock data
  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/shift-stock/summary?branch_id=${currentBranch}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStockData();
    const interval = setInterval(() => fetchStockData(), 10000);
    return () => clearInterval(interval);
  }, [selectedDate, currentBranch]);

  const categoryColors: Record<string, string> = {
    beef: "bg-red-50 border-red-200",
    goat: "bg-green-50 border-green-200",
    offal: "bg-amber-50 border-amber-200",
    processed: "bg-blue-50 border-blue-200",
  };

  const categoryBadges: Record<string, string> = {
    beef: "🥩 Beef",
    goat: "🐐 Goat",
    offal: "🦴 Offal",
    processed: "📦 Processed",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-charcoal via-slate-950 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-black text-white mb-2">📊 Stock Management</h1>
          <p className="text-gray-400">Track daily stock movements per product and branch</p>
        </motion.div>

        {/* Controls */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 flex gap-4 flex-wrap items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs bg-slate-800 border-slate-700 text-white"
          />
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
            Live updates every 10s {lastUpdated ? `• Last update ${lastUpdated}` : ""}
          </div>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Opening Stock</p>
                    <p className="text-2xl font-bold text-white">{summary.total_opening.toFixed(1)}kg</p>
                  </div>
                  <Package className="h-8 w-8 text-brand-copper opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Added Stock</p>
                    <p className="text-2xl font-bold text-green-400">{summary.total_added.toFixed(1)}kg</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Sold Stock</p>
                    <p className="text-2xl font-bold text-red-400">{summary.total_sold.toFixed(1)}kg</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-brand-burgundy/20 to-brand-copper/20 border-brand-copper/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Current Stock</p>
                    <p className="text-2xl font-bold text-brand-copper">{summary.total_closing.toFixed(1)}kg</p>
                  </div>
                  <div className="text-3xl">📦</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Low Stock Alerts */}
        {summary && summary.low_stock_count > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50 flex gap-3 items-start"
          >
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-400">{summary.low_stock_count} products below threshold</p>
              <p className="text-sm text-yellow-300">Review and reorder critical items</p>
            </div>
          </motion.div>
        )}

        {/* Stock Entries Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shift Stock Movement - {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading stock data...</div>
              ) : summary && summary.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-2 text-gray-400 font-semibold">Product</th>
                        <th className="text-right py-3 px-2 text-gray-400 font-semibold">Opening</th>
                        <th className="text-right py-3 px-2 text-gray-400 font-semibold">Added</th>
                        <th className="text-right py-3 px-2 text-gray-400 font-semibold">Sold</th>
                        <th className="text-right py-3 px-2 text-gray-400 font-semibold">Current</th>
                        <th className="text-right py-3 px-2 text-gray-400 font-semibold">Variance</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.entries.map((entry) => (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${
                            categoryColors[entry.products.category as keyof typeof categoryColors] || "bg-slate-800/30"
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="font-semibold text-white">{entry.products.name}</div>
                            <div className="text-xs text-gray-500">{categoryBadges[entry.products.category as keyof typeof categoryBadges]}</div>
                          </td>
                          <td className="text-right py-3 px-2 text-white">{Number(entry.opening_stock || 0).toFixed(1)}kg</td>
                          <td className="text-right py-3 px-2 text-green-400">+{Number(entry.added_stock || 0).toFixed(1)}kg</td>
                          <td className="text-right py-3 px-2 text-red-400">-{Number(entry.sold_stock || 0).toFixed(1)}kg</td>
                          <td className="text-right py-3 px-2 font-semibold text-brand-copper">
                            {Number(entry.closing_stock || 0).toFixed(1)}kg
                          </td>
                          <td className={`text-right py-3 px-2 font-semibold ${Number(entry.variance || 0) > 0.1 ? "text-yellow-400" : Number(entry.variance || 0) < -0.1 ? "text-red-400" : "text-gray-500"}`}>
                            {Number(entry.variance || 0) > 0 ? "+" : ""}{Number(entry.variance || 0).toFixed(1)}kg
                          </td>
                          <td className="text-center py-3 px-2">
                            {Number(entry.closing_stock || 0) < Number(entry.products.low_stock_threshold_kg || 0) ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                                ⚠️ Low
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
                                ✓ OK
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No stock entries for this date</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StockManagement;
