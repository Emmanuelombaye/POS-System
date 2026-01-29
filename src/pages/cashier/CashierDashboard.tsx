import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore, Product } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { Receipt, Trash2 } from "lucide-react";

const QUICK_WEIGHTS = [0.25, 0.5, 1];

export const CashierDashboard = () => {
  const {
    products,
    settings,
    cashierCart,
    cashierDiscount,
    cashierPaymentMethod,
    addProductToCart,
    updateCartItemWeight,
    removeCartItem,
    setDiscount,
    setPaymentMethod,
    completeSale,
  } = useAppStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [weightKg, setWeightKg] = useState<number>(1);

  const subtotal = useMemo(
    () =>
      cashierCart.reduce(
        (sum, item) => sum + item.pricePerKg * item.weightKg,
        0
      ),
    [cashierCart]
  );

  const total = useMemo(() => {
    if (!cashierDiscount) return subtotal;
    if (cashierDiscount.type === "amount") {
      return Math.max(subtotal - cashierDiscount.value, 0);
    }
    return subtotal * (1 - cashierDiscount.value / 100);
  }, [subtotal, cashierDiscount]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addProductToCart(selectedProduct, weightKg);
    setWeightKg(1);
  };

  const handleQuickWeight = (w: number) => {
    setWeightKg(w);
  };

  const handleDiscountChange = (type: "amount" | "percent", value: number) => {
    if (!value) {
      setDiscount(undefined);
      return;
    }
    setDiscount({ type, value });
  };

  const handleCompleteSale = () => {
    const tx = completeSale();
    if (tx) {
      // basic in-UI feedback; could be extended to a toast system
      alert(`Sale completed. Total: ${formatCurrency(tx.total, settings)}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-56px)] gap-3 bg-slate-950 px-3 py-3 md:gap-4 md:px-4 md:py-4">
      {/* LEFT: product grid */}
      <div className="flex-1 lg:flex-[1.6] rounded-xl border border-slate-800 bg-slate-950/90 p-3 md:p-4 min-h-[400px] lg:min-h-0">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Products
            </h2>
            <p className="text-[11px] text-slate-400">
              Tap a cut, choose weight, hit add. Designed for speed.
            </p>
          </div>
          <Badge variant="outline">
            Live stock •{" "}
            <span className="ml-1 text-emerald-300">
              {products.reduce((sum, p) => sum + p.stockKg, 0)} kg
            </span>
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {products
            .filter((p) => p.isActive)
            .map((product) => {
              const low = product.stockKg <= product.lowStockThresholdKg;
              const isSelected = selectedProduct?.id === product.id;
              return (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedProduct(product)}
                  className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition ${
                    isSelected
                      ? "border-red-500 bg-red-900/40 shadow-sm shadow-red-900/40"
                      : "border-slate-700 bg-slate-900/60 hover:border-red-600 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">
                    {product.category}
                  </span>
                  <span className="mt-0.5 text-[13px] font-semibold text-slate-50">
                    {product.name}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-300">
                    {formatCurrency(product.pricePerKg, settings)}/kg
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{product.stockKg.toFixed(1)} kg</span>
                    {low && (
                      <span className="rounded-full bg-amber-900/60 px-1.5 py-0.5 text-[9px] text-amber-200">
                        Low
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
        </div>
      </div>

      {/* RIGHT: cart / payment / receipt */}
      <div className="flex w-full lg:w-[420px] flex-1 lg:flex-[1] flex-col gap-3 md:lg:w-[460px]">
        <Card className="h-auto lg:h-[52%] lg:min-h-[260px]">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-2">
            {/* Weight controls */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[11px] font-medium text-slate-300">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex gap-1">
                {QUICK_WEIGHTS.map((w) => (
                  <Button
                    key={w}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickWeight(w)}
                    className="px-2 text-[11px]"
                  >
                    {w}kg
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!selectedProduct || weightKg <= 0}
                onClick={handleAddToCart}
              >
                Add
              </Button>
            </div>

            {/* Cart list */}
            <div className="mt-1 flex-1 space-y-1 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/80 p-2 text-xs">
              {cashierCart.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                  Cart is empty. Select a product, set weight, then add.
                </div>
              ) : (
                cashierCart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-slate-900"
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-slate-50">
                        {item.productName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.weightKg.toFixed(2)} kg @{" "}
                        {formatCurrency(item.pricePerKg, settings)}/kg
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.weightKg}
                        onChange={(e) =>
                          updateCartItemWeight(
                            item.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 w-20 text-[11px]"
                      />
                      <span className="w-18 text-right text-[11px] font-semibold text-slate-50">
                        {formatCurrency(
                          item.pricePerKg * item.weightKg,
                          settings
                        )}
                      </span>
                      <button
                        className="ml-1 rounded-full p-1 text-slate-500 hover:bg-red-950 hover:text-red-200"
                        onClick={() => removeCartItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-[48%] min-h-[220px]">
          <CardHeader>
            <CardTitle>Payment & Receipt</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col gap-2">
            <div className="grid grid-cols-[1.1fr,0.9fr] gap-3 text-xs">
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Payment method</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        cashierPaymentMethod === "cash"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setPaymentMethod("cash")}
                      className="flex-1 text-[11px]"
                    >
                      Cash
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        cashierPaymentMethod === "mpesa"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setPaymentMethod("mpesa")}
                      className="flex-1 text-[11px]"
                    >
                      M-Pesa
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="font-medium text-slate-300">
                      Discount
                    </span>
                    <span className="text-slate-500">
                      Manager approval required
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="KES"
                      className="h-9 text-[11px]"
                      onChange={(e) =>
                        handleDiscountChange(
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      className="h-9 w-20 text-[11px]"
                      onChange={(e) =>
                        handleDiscountChange(
                          "percent",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="lg"
                  disabled={cashierCart.length === 0}
                  onClick={handleCompleteSale}
                  className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Receipt className="h-4 w-4" />
                  Complete Sale
                </Button>
              </div>

              <div className="flex flex-col justify-between rounded-md border border-slate-800 bg-slate-950/80 p-2">
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal, settings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discount</span>
                    <span className="font-medium text-emerald-300">
                      {cashierDiscount
                        ? cashierDiscount.type === "amount"
                          ? `- ${formatCurrency(
                              cashierDiscount.value,
                              settings
                            )}`
                          : `- ${cashierDiscount.value.toFixed(1)}%`
                        : "-"}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-slate-800 pt-1 text-[13px] font-semibold text-slate-50">
                    <span>Total</span>
                    <span>{formatCurrency(total, settings)}</span>
                  </div>
                </div>
                <div className="mt-2 border-t border-dashed border-slate-800 pt-1 text-[9px] text-slate-500">
                  Receipt preview only – printing can be wired to your hardware
                  later.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

