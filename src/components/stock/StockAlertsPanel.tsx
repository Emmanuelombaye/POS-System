import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, TrendingDown, Zap } from "lucide-react";

interface StockAlert {
  id: string;
  alert_type: "low_stock" | "variance" | "critical";
  product_id: string;
  branch_id: string;
  message: string;
  is_resolved: boolean;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    code: string;
    category: string;
  };
}

interface StockAlertsProps {
  onRefresh?: () => void;
}

export const StockAlertsPanel = ({ onRefresh }: StockAlertsProps) => {
  const currentBranch = useAppStore((s) => s.currentBranch);
  const token = useAppStore((s) => s.token);
  const currentUser = useAppStore((s) => s.currentUser);

  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [currentBranch]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:4000/stock/alerts?branch_id=${currentBranch}&resolved=false`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    if (!currentUser) return;

    setResolving(alertId);
    try {
      // Update alert resolution in backend
      // This would require a PATCH endpoint: /stock/alerts/:id/resolve
      console.log("Resolving alert:", alertId, "by user:", currentUser.id);
      
      // Remove from local state optimistically
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      onRefresh?.();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    } finally {
      setResolving(null);
    }
  };

  const getAlertIcon = (type: StockAlert["alert_type"]) => {
    switch (type) {
      case "low_stock":
        return <TrendingDown className="h-5 w-5 text-orange-400" />;
      case "variance":
        return <Zap className="h-5 w-5 text-yellow-400" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getAlertColor = (type: StockAlert["alert_type"]) => {
    switch (type) {
      case "low_stock":
        return "border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800";
      case "variance":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800";
      case "critical":
        return "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800";
    }
  };

  const getAlertBadgeColor = (type: StockAlert["alert_type"]) => {
    switch (type) {
      case "low_stock":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "variance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
  };

  return (
    <Card className="col-span-full bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Stock Alerts
          {alerts.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
              {alerts.length}
            </span>
          )}
        </CardTitle>
        <Button
          onClick={fetchAlerts}
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Loading alerts...</div>
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-white font-semibold">No Active Alerts</p>
            <p className="text-gray-400 text-sm mt-1">All stock levels are healthy!</p>
          </motion.div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.alert_type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1">
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {alert.products?.name || "Unknown Product"}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getAlertBadgeColor(
                            alert.alert_type
                          )}`}
                        >
                          {alert.alert_type === "low_stock" && "Low Stock"}
                          {alert.alert_type === "variance" && "Variance"}
                          {alert.alert_type === "critical" && "Critical"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {alert.products?.code} • {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                  >
                    {resolving === alert.id ? "Resolving..." : "Resolve"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockAlertsPanel;
