import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { api } from "@/utils/api";

interface ReconciliationData {
  shift_date: string;
  expected_total: number;
  actual_cash: number;
  actual_mpesa: number;
  difference: number;
  cashier_name: string;
  notes: string;
}

export const DailyReconciliation = () => {
  const [reconciliations, setReconciliations] = useState<ReconciliationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/reports/reconciliation");
      setReconciliations(response?.data || []);
    } catch (err) {
      console.error("Error fetching reconciliation:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalExpected = reconciliations.reduce((sum, r) => sum + r.expected_total, 0);
  const totalReceived = reconciliations.reduce((sum, r) => sum + (r.actual_cash + r.actual_mpesa), 0);
  const netDifference = totalReceived - totalExpected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-black text-gray-900">💰 Daily Cash Reconciliation</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Expected Total</p>
            <p className="text-3xl font-black text-blue-900">KES {totalExpected.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Actual Received</p>
            <p className="text-3xl font-black text-emerald-900">KES {totalReceived.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className={netDifference >= 0 ? "bg-gradient-to-br from-green-50 to-green-100" : "bg-gradient-to-br from-red-50 to-red-100"}>
          <CardContent className="pt-6">
            <p className={`text-xs font-semibold uppercase mb-1 ${netDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              Difference
            </p>
            <p className={`text-3xl font-black ${netDifference >= 0 ? "text-green-900" : "text-red-900"}`}>
              {netDifference >= 0 ? "+" : ""}KES {netDifference.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Details */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {reconciliations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {rec.difference === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-bold text-gray-900">{rec.cashier_name}</span>
                    <span className="text-xs text-gray-500">{new Date(rec.shift_date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Expected</p>
                      <p className="font-black text-gray-900">KES {rec.expected_total.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Cash</p>
                      <p className="font-black text-gray-900">KES {rec.actual_cash.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">M-Pesa</p>
                      <p className="font-black text-gray-900">KES {rec.actual_mpesa.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Variance</p>
                      <p className={`font-black ${rec.difference === 0 ? "text-green-600" : "text-red-600"}`}>
                        {rec.difference >= 0 ? "+" : ""}KES {rec.difference.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
