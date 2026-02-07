import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingDown, AlertTriangle, Calendar, Download } from "lucide-react";
import { api, isOnline } from "@/utils/api";

interface WastageItem {
  product_name: string;
  quantity_wasted: number;
  unit: string;
  reason: string; // "spoilage", "trimming", "damage", "other"
  date: string;
  cashier_name: string;
  cost_lost: number;
}

export const WastageReport = () => {
  const [wastageData, setWastageData] = useState<WastageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWastageData();
  }, [dateRange]);

  const fetchWastageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/reports/wastage", { period: dateRange });
      setWastageData(response?.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const totalWastage = wastageData.reduce((sum, w) => sum + w.cost_lost, 0);
  const spoilageCount = wastageData.filter(w => w.reason === "spoilage").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">📊 Wastage Report</h2>
          <p className="text-sm text-gray-500">Track losses, spoilage & waste</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase">Total Lost Value</p>
                <p className="text-3xl font-black text-red-900">KES {totalWastage.toFixed(0)}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase">Spoilage Items</p>
                <p className="text-3xl font-black text-yellow-900">{spoilageCount}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">Total Items</p>
                <p className="text-3xl font-black text-blue-900">{wastageData.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2">
        {["today", "week", "month"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              dateRange === range
                ? "bg-brand-burgundy text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Wastage Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-6 text-red-700 font-bold">{error}</CardContent>
        </Card>
      ) : wastageData.length === 0 ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-6 text-green-700 font-bold text-center">✓ No wastage recorded</CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Product</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Qty</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Cashier</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Cost Lost</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wastageData.map((item, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity_wasted} {item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.reason === "spoilage" ? "bg-red-100 text-red-700" :
                        item.reason === "trimming" ? "bg-yellow-100 text-yellow-700" :
                        item.reason === "damage" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {item.reason.charAt(0).toUpperCase() + item.reason.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.cashier_name}</td>
                    <td className="px-4 py-3 font-black text-red-600">KES {item.cost_lost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{new Date(item.date).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
