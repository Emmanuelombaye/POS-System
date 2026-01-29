import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore, Product } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";
import { Receipt, Trash2, ShoppingCart, Plus, Minus, Search } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredProducts = products
    .filter((p) => p.isActive)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-80px)] gap-6 p-4 lg:p-8 bg-brand-offwhite max-w-[1920px] mx-auto">
      {/* LEFT: Product Grid */}
      <div className="flex-1 lg:flex-[1.6] flex flex-col gap-6 min-h-[500px]">

        {/* Search & Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-[20px] shadow-sm border-none">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-gray-50 rounded-xl text-brand-burgundy">
              <Search className="h-5 w-5" />
            </div>
            <Input
              placeholder="Search cuts..."
              className="max-w-xs border-none bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto text-base placeholder:text-[hsl(var(--text-muted))] font-bold text-brand-charcoal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            Live Stock: <span className="font-bold text-brand-charcoal">{products.reduce((sum, p) => sum + p.stockKg, 0).toFixed(0)} kg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-2">
          {filteredProducts.map((product) => {
            const low = product.stockKg <= product.lowStockThresholdKg;
            const isSelected = selectedProduct?.id === product.id;
            return (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(product)}
                className={`flex flex-col items-start justify-between rounded-[20px] p-5 text-left transition-all duration-200 h-36 relative overflow-hidden group ${isSelected
                  ? "bg-brand-burgundy text-white shadow-xl shadow-brand-burgundy/30 ring-0"
                  : "bg-white text-brand-charcoal shadow-sm hover:shadow-card hover:-translate-y-1"
                  }`}
              >
                <div className="relative z-10 w-full">
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                    {product.category}
                  </span>
                  <h3 className={`mt-1 text-sm font-bold leading-tight ${isSelected ? "text-white" : "text-brand-charcoal"}`}>
                    {product.name}
                  </h3>
                </div>

                <div className="relative z-10 w-full flex items-end justify-between mt-auto">
                  <span className={`text-sm font-bold ${isSelected ? "text-white/90" : "text-[hsl(var(--text-secondary))]"}`}>
                    {formatCurrency(product.pricePerKg, settings)} <span className="text-[10px] opacity-70">/kg</span>
                  </span>
                  <Badge variant={low ? "warning" : isSelected ? "default" : "outline"} className={`text-[9px] px-2 h-5 rounded-md ${isSelected ? "bg-white/20 text-white backdrop-blur-sm" : "bg-gray-100 text-gray-600"}`}>
                    {product.stockKg.toFixed(1)}kg
                  </Badge>
                </div>

                {/* Decorative background element for luxury feel */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.08] ${isSelected ? "bg-white" : "bg-brand-burgundy"}`} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="flex w-full lg:w-[480px] flex-col gap-6">

        {/* 1. Weight & Add Control */}
        <Card className="shadow-sm border-none rounded-[20px]">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure Item</span>
              {selectedProduct ? (
                <Badge className="bg-brand-burgundy text-white px-3 py-1 rounded-lg text-xs">{selectedProduct.name}</Badge>
              ) : (
                <span className="text-xs text-gray-400 italic font-medium">Select a product first</span>
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="relative bg-gray-50 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-brand-burgundy transition-colors">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="h-16 text-3xl font-bold text-brand-charcoal pl-6 pr-12 border-none bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">kg</span>
                </div>
              </div>
              <div className="flex gap-2">
                {QUICK_WEIGHTS.map((w) => (
                  <Button
                    key={w}
                    type="button"
                    variant="outline"
                    onClick={() => handleQuickWeight(w)}
                    className="h-16 w-14 flex flex-col items-center justify-center gap-0.5 border-gray-100 rounded-2xl bg-white hover:border-brand-burgundy/30 hover:bg-gray-50"
                  >
                    <span className="text-lg font-bold text-brand-charcoal">{w}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-bold">kg</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base font-bold shadow-lg shadow-brand-burgundy/20 rounded-xl bg-brand-burgundy hover:bg-red-900"
              disabled={!selectedProduct || weightKg <= 0}
              onClick={handleAddToCart}
            >
              <Plus className="mr-2 h-5 w-5" /> Add to Order
            </Button>
          </CardContent>
        </Card>

        {/* 2. Current Order List */}
        <Card className="flex-1 min-h-[300px] flex flex-col shadow-sm border-none overflow-hidden rounded-[20px]">
          <CardHeader className="bg-white p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-brand-charcoal text-lg font-bold">
              <div className="p-2 bg-gray-50 rounded-xl text-brand-burgundy">
                <ShoppingCart className="h-5 w-5" />
              </div>
              Current Order
              <Badge className="ml-auto bg-brand-charcoal text-white rounded-lg px-2.5 py-0.5">{cashierCart.length}</Badge>
            </CardTitle>
          </CardHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
            {cashierCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 opacity-60">
                <div className="p-6 bg-gray-50 rounded-full">
                  <ShoppingCart className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-sm font-medium">Cart is empty</p>
              </div>
            ) : (
              cashierCart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-colors group">
                  <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center font-bold text-brand-burgundy shadow-sm text-lg">
                    {item.productName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-brand-charcoal text-sm truncate">{item.productName}</h4>
                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))] mt-1 font-bold">
                      <span>{formatCurrency(item.pricePerKg, settings)}/kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 h-9 px-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.weightKg}
                        onChange={(e) => updateCartItemWeight(item.id, parseFloat(e.target.value) || 0)}
                        className="w-12 h-full border-none text-center text-xs p-0 focus-visible:ring-0 font-bold text-brand-charcoal"
                      />
                      <span className="text-[9px] text-gray-400 pr-2 font-medium">kg</span>
                    </div>
                    <div className="text-right w-16">
                      <p className="font-bold text-brand-charcoal">{formatCurrency(item.pricePerKg * item.weightKg, settings)}</p>
                    </div>
                    <button
                      onClick={() => removeCartItem(item.id)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. Totals & Checkout */}
          <div className="bg-gray-50/50 p-6 border-t border-gray-100 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-[hsl(var(--text-muted))]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, settings)}</span>
              </div>
              {cashierDiscount && (
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Discount</span>
                  <span>
                    {cashierDiscount.type === "amount"
                      ? `- ${formatCurrency(cashierDiscount.value, settings)}`
                      : `- ${cashierDiscount.value.toFixed(1)}%`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-brand-charcoal pt-4 border-t border-gray-200 dashed">
                <span>Total</span>
                <span>{formatCurrency(total, settings)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={cashierPaymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className={`h-12 rounded-xl border-gray-200 font-bold ${cashierPaymentMethod === "cash" ? "bg-brand-charcoal text-white hover:bg-black" : "bg-white text-gray-600"}`}
              >
                Cash
              </Button>
              <Button
                variant={cashierPaymentMethod === "mpesa" ? "default" : "outline"}
                onClick={() => setPaymentMethod("mpesa")}
                className={`h-12 rounded-xl border-gray-200 font-bold ${cashierPaymentMethod === "mpesa" ? "bg-green-600 text-white hover:bg-green-700 border-none" : "bg-white text-gray-600"}`}
              >
                M-Pesa
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold shadow-xl shadow-brand-burgundy/25 rounded-xl bg-brand-burgundy hover:bg-red-900"
              disabled={cashierCart.length === 0}
              onClick={handleCompleteSale}
            >
              <Receipt className="mr-2 h-5 w-5" />
              Pay {formatCurrency(total, settings)}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

