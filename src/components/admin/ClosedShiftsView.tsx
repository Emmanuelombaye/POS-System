import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDateTime } from "@/utils/format";

interface ClosedShiftProduct {
  product_id: string;
  product_name: string;
  category: string;
  opening_stock: number;
  added_stock: number;
  sold_stock: number;
  closing_stock: number;
  variance: number;
}

interface ClosedShift {
  shift_id: string;
  cashier_id: string;
  cashier_name: string;
  cashier_email: string;
  status: "PENDING_REVIEW" | "APPROVED";
  opened_at: string;
  closed_at: string;
  branch_id: string;
  shift_date: string;
  total_opening: number;
  total_added: number;
  total_sold: number;
  total_closing: number;
  total_variance: number;
  products: ClosedShiftProduct[];
}

interface ClosedShiftsData {
  closedShifts: ClosedShift[];
  branch_id: string;
  date: string;
}

export const ClosedShiftsView = () => {
  const token = useAppStore((s) => s.token);
  const currentBranch = useAppStore((s) => s.currentBranch);

  const [data, setData] = useState<ClosedShiftsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  const fetchClosedShifts = async () => {
    setIsLoading(true);
    try {
      const result = await api.get("/api/shift-stock/closed-shifts", {
        branch_id: currentBranch,
        date: selectedDate
      });
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch closed shifts:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClosedShifts();
    const interval = setInterval(fetchClosedShifts, 10000);
    return () => clearInterval(interval);
  }, [selectedDate, currentBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">📊 Sales & Transactions</h2>
            <p className="text-gray-600 mt-1">View all closed shifts and stock variances from cashiers</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-sm font-bold text-emerald-700">Live • Updates every 10s</span>
          </div>
        </div>
      </motion.div>

      {/* Date Filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-xs"
        />
        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        )}
      </motion.div>

      {/* Closed Shifts List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading closed shifts...</div>
        ) : !data || data.closedShifts.length === 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6 text-center">
              <Clock className="h-12 w-12 text-amber-600 mx-auto mb-3 opacity-50" />
              <p className="text-amber-900 font-semibold">No closed shifts for this date</p>
              <p className="text-sm text-amber-800 mt-1">Cashiers will appear here after closing their shifts</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.closedShifts.map((shift, idx) => (
              <motion.div
                key={shift.shift_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setExpandedShift(expandedShift === shift.shift_id ? null : shift.shift_id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Cashier Avatar */}
                        <div className="h-12 w-12 rounded-full bg-brand-burgundy flex items-center justify-center text-white font-black text-lg">
                          {shift.cashier_name.charAt(0)}
                        </div>

                        {/* Cashier Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-gray-900">{shift.cashier_name}</div>
                          <div className="text-sm text-gray-600">{shift.cashier_email}</div>
                        </div>

                        {/* Time Info */}
                        <div className="text-right text-sm">
                          <div className="text-gray-600 font-mono">
                            {formatDateTime(shift.closed_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Duration:{" "}
                            {Math.round(
                              (new Date(shift.closed_at).getTime() - new Date(shift.opened_at).getTime()) / 3600000
                            )}
                            h
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        className={`rounded-lg font-black px-3 py-1 text-xs uppercase tracking-wider ${
                          shift.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-amber-100 text-amber-700 border border-amber-300"
                        }`}
                      >
                        {shift.status === "APPROVED" ? "✓ Approved" : "⏳ Pending Review"}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Summary Stats */}
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Opening</p>
                        <p className="text-lg font-black text-blue-900">{shift.total_opening.toFixed(1)}kg</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Added</p>
                        <p className="text-lg font-black text-green-900">
                          +{shift.total_added.toFixed(1)}kg
                        </p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Sold</p>
                        <p className="text-lg font-black text-red-900">-{shift.total_sold.toFixed(1)}kg</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Closing</p>
                        <p className="text-lg font-black text-purple-900">{shift.total_closing.toFixed(1)}kg</p>
                      </div>

                      <div
                        className={`rounded-lg p-3 border ${
                          Math.abs(shift.total_variance) < 0.1
                            ? "bg-emerald-50 border-emerald-200"
                            : shift.total_variance > 0
                            ? "bg-orange-50 border-orange-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {Math.abs(shift.total_variance) < 0.1
                            ? "Variance ✓"
                            : shift.total_variance > 0
                            ? "Surplus +"
                            : "Deficit -"}
                        </p>
                        <p
                          className={`text-lg font-black ${
                            Math.abs(shift.total_variance) < 0.1
                              ? "text-emerald-900"
                              : shift.total_variance > 0
                              ? "text-orange-900"
                              : "text-red-900"
                          }`}
                        >
                          {shift.total_variance > 0 ? "+" : ""}
                          {shift.total_variance.toFixed(1)}kg
                        </p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedShift === shift.shift_id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-gray-200 space-y-3"
                      >
                        <h4 className="font-black text-gray-900">Product Breakdown</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {shift.products.map((product) => (
                            <div
                              key={product.product_id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900">{product.product_name}</div>
                                <div className="text-xs text-gray-600">{product.category}</div>
                              </div>

                              <div className="flex gap-6 text-sm font-mono text-right">
                                <div className="text-gray-700">
                                  <div className="text-xs text-gray-500">Opening</div>
                                  <div className="font-bold">{product.opening_stock.toFixed(1)}kg</div>
                                </div>
                                <div className="text-green-700">
                                  <div className="text-xs text-gray-500">+Added</div>
                                  <div className="font-bold">{product.added_stock.toFixed(1)}kg</div>
                                </div>
                                <div className="text-red-700">
                                  <div className="text-xs text-gray-500">-Sold</div>
                                  <div className="font-bold">{product.sold_stock.toFixed(1)}kg</div>
                                </div>
                                <div className="text-purple-700">
                                  <div className="text-xs text-gray-500">Closing</div>
                                  <div className="font-bold">{product.closing_stock.toFixed(1)}kg</div>
                                </div>
                                <div
                                  className={`${
                                    Math.abs(product.variance) < 0.1
                                      ? "text-emerald-700"
                                      : product.variance > 0
                                      ? "text-orange-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  <div className="text-xs text-gray-500">Variance</div>
                                  <div className="font-bold">
                                    {product.variance > 0 ? "+" : ""}
                                    {product.variance.toFixed(1)}kg
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Alert for Variances */}
                        {shift.products.some((p) => Math.abs(p.variance) > 0.1) && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-yellow-900">Discrepancies Found</p>
                              <p className="text-sm text-yellow-800">
                                {shift.products.filter((p) => p.variance < -0.1).length} deficit(s),{" "}
                                {shift.products.filter((p) => p.variance > 0.1).length} surplus(es) detected
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
