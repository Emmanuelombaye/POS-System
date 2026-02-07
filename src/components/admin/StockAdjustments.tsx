import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { api } from "@/utils/api";
import { useAppStore } from "@/store/appStore";

interface StockAdjustment {
  product_id: string;
  product_name: string;
  adjustment_type: "increase" | "decrease";
  quantity: number;
  reason: string;
  notes: string;
}

export const StockAdjustments = () => {
  const { products } = useAppStore();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [newAdjustment, setNewAdjustment] = useState<Partial<StockAdjustment>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const reasons = ["Damaged goods", "Theft/Loss", "Manual correction", "Inventory count mismatch", "Other"];

  const handleAdd = () => {
    if (!newAdjustment.product_id || !newAdjustment.quantity) {
      alert("Please select product and enter quantity");
      return;
    }

    setAdjustments([...adjustments, newAdjustment as StockAdjustment]);
    setNewAdjustment({});
  };

  const handleRemove = (index: number) => {
    setAdjustments(adjustments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (adjustments.length === 0) {
      alert("No adjustments to submit");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/stock/adjustments", { adjustments });
      if (response?.success) {
        setSuccessMessage("✓ All adjustments submitted successfully!");
        setAdjustments([]);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      alert("Error submitting adjustments: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">🔧 Stock Adjustments</h2>
        <p className="text-sm text-gray-500">Correct inventory discrepancies</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-50 border-2 border-green-200 text-green-700 font-bold flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </motion.div>
      )}

      {/* Add Adjustment Form */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Product</label>
              <select
                value={newAdjustment.product_id || ""}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, product_id: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-semibold bg-white"
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewAdjustment({ ...newAdjustment, adjustment_type: "increase" })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                    newAdjustment.adjustment_type === "increase"
                      ? "bg-green-600 text-white"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-green-600"
                  }`}
                >
                  📈 Increase
                </button>
                <button
                  onClick={() => setNewAdjustment({ ...newAdjustment, adjustment_type: "decrease" })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                    newAdjustment.adjustment_type === "decrease"
                      ? "bg-red-600 text-white"
                      : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-600"
                  }`}
                >
                  📉 Decrease
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Quantity</label>
              <Input
                type="number"
                step="0.01"
                value={newAdjustment.quantity || ""}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, quantity: Number(e.target.value) })}
                placeholder="0.00"
                className="px-3 py-2 border-2 border-gray-300 rounded-lg font-semibold"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Reason</label>
              <select
                value={newAdjustment.reason || ""}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg font-semibold bg-white"
              >
                <option value="">Select reason...</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Notes</label>
              <Input
                value={newAdjustment.notes || ""}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, notes: e.target.value })}
                placeholder="Optional notes..."
                className="px-3 py-2 border-2 border-gray-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Adjustment
          </Button>
        </CardContent>
      </Card>

      {/* Adjustments Queue */}
      {adjustments.length > 0 && (
        <>
          <div className="space-y-3">
            {adjustments.map((adj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                  adj.adjustment_type === "increase"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{adj.product_name}</p>
                  <div className="text-sm text-gray-700 mt-1">
                    <span className={`font-black ${adj.adjustment_type === "increase" ? "text-green-600" : "text-red-600"}`}>
                      {adj.adjustment_type === "increase" ? "+" : "-"}{adj.quantity}
                    </span>
                    <span className="ml-2">• {adj.reason}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(i)}
                  className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </motion.div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : `✓ Submit ${adjustments.length} Adjustment(s)`}
          </Button>
        </>
      )}
    </div>
  );
};
