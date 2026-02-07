import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Plus, X } from "lucide-react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StockAlert {
  product_id: string;
  product_name: string;
  current_stock: number;
  min_threshold: number;
  unit: string;
  branch: string;
  last_restocked: string;
}

export const StockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStockAlerts();
    const interval = setInterval(fetchStockAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStockAlerts = async () => {
    try {
      const response = await api.get("/api/stock/alerts");
      setAlerts(response?.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  const criticalAlerts = alerts.filter(a => a.current_stock <= 5);
  const warningAlerts = alerts.filter(a => a.current_stock > 5 && a.current_stock <= a.min_threshold);
  const activeAlerts = alerts.filter(a => !dismissedAlerts.has(a.product_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">🚨 Stock Alerts</h2>
        <p className="text-sm text-gray-500">Real-time low stock notifications</p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-red-600 uppercase mb-1">Critical (0-5)</p>
            <p className="text-3xl font-black text-red-900">{criticalAlerts.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Warning (5-Min)</p>
            <p className="text-3xl font-black text-yellow-900">{warningAlerts.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Items</p>
            <p className="text-3xl font-black text-blue-900">{activeAlerts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeAlerts.length === 0 ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-8 text-center">
            <p className="text-green-700 font-bold">✓ All stock levels are healthy!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map((alert) => {
            const isCritical = alert.current_stock <= 5;
            return (
              <motion.div
                key={alert.product_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                  isCritical
                    ? "border-red-300 bg-red-50 hover:shadow-lg"
                    : "border-yellow-300 bg-yellow-50 hover:shadow-lg"
                } transition-all`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isCritical ? "text-red-600" : "text-yellow-600"}`} />
                  <div>
                    <p className="font-bold text-gray-900">{alert.product_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                      <span className={`font-black ${isCritical ? "text-red-600" : "text-yellow-600"}`}>
                        {alert.current_stock} {alert.unit}
                      </span>
                      <span className="text-gray-500">/ {alert.min_threshold} {alert.unit} threshold</span>
                      <span className="text-xs text-gray-500">• {alert.branch}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDismissedAlerts(new Set([...dismissedAlerts, alert.product_id]))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-2"
                  title="Dismiss alert"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
