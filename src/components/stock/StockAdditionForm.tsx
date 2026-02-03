import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, CheckCircle } from "lucide-react";

interface StockAdditionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdditionForm = ({ onClose, onSuccess }: StockAdditionFormProps) => {
  const products = useAppStore((s) => s.products);
  const currentBranch = useAppStore((s) => s.currentBranch);
  const token = useAppStore((s) => s.token);

  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedProduct || !quantity || parseFloat(quantity) <= 0) {
      setError("Please select a product and enter a valid quantity");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:4000/stock/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: selectedProduct,
          branch_id: currentBranch,
          added_stock_kg: parseFloat(quantity),
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add stock");
      }

      setSuccess(true);
      setSelectedProduct("");
      setQuantity("");
      setNotes("");

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryColors: Record<string, string> = {
    beef: "border-red-200 bg-red-50",
    goat: "border-green-200 bg-green-50",
    offal: "border-amber-200 bg-amber-50",
    processed: "border-blue-200 bg-blue-50",
  };

  const categoryEmojis: Record<string, string> = {
    beef: "🥩",
    goat: "🐐",
    offal: "🦴",
    processed: "📦",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-lg bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-copper" />
            Add Stock
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">Stock Added Successfully!</p>
              <p className="text-gray-400 text-sm mt-2">Stock entry has been recorded.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Select Product
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <motion.button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProduct(product.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedProduct === product.id
                          ? "border-brand-copper bg-brand-copper/10"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {categoryEmojis[product.category as keyof typeof categoryEmojis]}
                      </div>
                      <div className="font-semibold text-white text-sm">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.code}</div>
                    </motion.button>
                  ))}
                </div>
                {!selectedProduct && (
                  <p className="text-red-400 text-sm mt-2">Please select a product</p>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Quantity (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter quantity in kilograms"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setError("");
                  }}
                  className="bg-slate-800 border-slate-700 text-white text-lg h-14 font-semibold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Batch number, supplier, or any other notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-brand-copper"
                  rows={3}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/50"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !selectedProduct || !quantity}
                  className="flex-1 bg-gradient-to-r from-brand-burgundy to-brand-copper hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Stock"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StockAdditionForm;
