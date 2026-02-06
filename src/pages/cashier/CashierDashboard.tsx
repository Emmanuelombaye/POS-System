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
    activeShift,
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

  // Block POS if shift not opened
  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gradient-to-br from-brand-charcoal via-slate-950 to-black p-8">
        <Card className="max-w-md bg-slate-900 border-amber-600/30">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-500 flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Shift Not Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              You must open your shift before using the POS system.
            </p>
            <p className="text-sm text-gray-400">
              Go to <strong className="text-white">Shift & Stock</strong> tab and click <strong className="text-white">Open Shift</strong> to begin.
            </p>
            <Badge variant="outline" className="border-amber-600 text-amber-500 font-mono">
              Opening shift loads yesterday's closing stock automatically
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-80px)] gap-6 p-4 lg:p-8 bg-brand-offwhite max-w-[1920px] mx-auto overflow-hidden">
      {/* LEFT: Product Grid */}
      <div className="flex-1 lg:flex-[1.6] flex flex-col gap-6 min-h-0 pb-20 lg:pb-0">

        {/* Search & Header - Premium Floating Style */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-[24px] shadow-premium border-none sticky top-0 z-20">
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
          <div className="hidden sm:flex items-center gap-3 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            Live Stock: <span className="font-bold text-brand-charcoal">{products.reduce((sum, p) => sum + p.stockKg, 0).toFixed(0)} kg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-y-auto scrollbar-thin pr-2 pb-4 fade-in">
          {filteredProducts.map((product, idx) => {
            const low = product.stockKg <= product.lowStockThresholdKg;
            const isSelected = selectedProduct?.id === product.id;
            return (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedProduct(product)}
                className={`flex flex-col items-start justify-between rounded-[22px] p-5 text-left transition-all duration-300 h-40 relative overflow-hidden group border-2 ${isSelected
                  ? "bg-brand-burgundy text-white shadow-premium-xl border-brand-burgundy"
                  : "bg-white text-brand-charcoal shadow-premium border-transparent hover:border-brand-burgundy/10"
                  }`}
              >
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase tracking-[0.15em] font-black ${isSelected ? "text-white/60" : "text-gray-400"}`}>
                      {product.category}
                    </span>
                    {low && !isSelected && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <h3 className={`mt-1.5 text-sm font-black leading-tight tracking-tight ${isSelected ? "text-white" : "text-brand-charcoal"}`}>
                    {product.name}
                  </h3>
                </div>

                <div className="relative z-10 w-full flex flex-col mt-auto">
                  <div className={`text-[10px] font-bold ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                    {formatCurrency(product.pricePerKg, settings)} <span className="opacity-70">/kg</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-black">
                      {product.stockKg.toFixed(1)}kg
                    </span>
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/20" : "bg-gray-50 group-hover:bg-brand-burgundy/5"}`}>
                      <Plus className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-brand-burgundy"}`} />
                    </div>
                  </div>
                </div>

                {/* Decorative mesh background for premium fintech feel */}
                <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-[0.15] ${isSelected ? "bg-white" : "bg-brand-burgundy/40"}`} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout - Responsive Sidebar/Drawer */}
      <div className="fixed lg:relative inset-x-0 bottom-0 z-30 lg:z-0 lg:flex w-full lg:w-[460px] flex-col lg:h-full bg-white lg:bg-transparent shadow-[0_-12px_40px_rgba(0,0,0,0.08)] lg:shadow-none rounded-t-[32px] lg:rounded-none overflow-hidden transition-all duration-500">

        {/* Mobile Header / Drag Handle */}
        <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-3 mb-1 lg:hidden" />

        <div className="flex flex-col h-full overflow-hidden p-6 lg:p-0 gap-6">
          {/* 1. Item Config - Collapsible on Mobile or always visible on Desktop */}
          <Card className="shadow-premium border-none rounded-[24px] hidden lg:block overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</span>
                {selectedProduct && (
                  <div className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-[10px] font-black uppercase tracking-wider">
                    {selectedProduct.name}
                  </div>
                )}
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="relative bg-gray-50 rounded-2xl border-2 border-transparent focus-within:bg-white focus-within:border-brand-burgundy transition-all duration-300">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className="h-16 text-3xl font-black text-brand-charcoal pl-6 pr-12 border-none bg-transparent shadow-none focus-visible:ring-0"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase">kg</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {QUICK_WEIGHTS.map((w) => (
                    <Button
                      key={w}
                      type="button"
                      variant="outline"
                      onClick={() => handleQuickWeight(w)}
                      className="h-16 w-14 flex flex-col items-center justify-center gap-0.5 border-gray-100 rounded-2xl bg-white hover:border-brand-burgundy/30 hover:bg-gray-50 transition-all font-black group"
                    >
                      <span className="text-lg text-brand-charcoal group-hover:scale-110 transition-transform">{w}</span>
                      <span className="text-[8px] text-gray-400 uppercase">kg</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-15 text-sm font-black uppercase tracking-wider shadow-premium-xl rounded-2xl bg-brand-burgundy hover:bg-red-900 transition-all active:scale-95"
                disabled={!selectedProduct || weightKg <= 0}
                onClick={handleAddToCart}
              >
                <Plus className="mr-2 h-4 w-4" /> Add to Order
              </Button>
            </CardContent>
          </Card>

          {/* 2. Order List & Checkout Combined */}
          <Card className="flex-1 flex flex-col shadow-premium border-none overflow-hidden rounded-[28px] bg-white">
            <CardHeader className="p-6 pb-2 hidden lg:block">
              <CardTitle className="flex items-center gap-3 text-brand-charcoal text-base font-black uppercase tracking-tight">
                <div className="p-2.5 bg-brand-burgundy/5 rounded-xl text-brand-burgundy">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                Order Summary
                <div className="ml-auto bg-brand-charcoal h-6 min-w-[24px] px-1.5 flex items-center justify-center text-white text-[10px] font-black rounded-lg">
                  {cashierCart.length}
                </div>
              </CardTitle>
            </CardHeader>

            {/* Cart Area */}
            <div className={`flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 ${cashierCart.length === 0 ? 'hidden lg:flex' : 'flex'} flex-col`}>
              {cashierCart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 space-y-4 opacity-40">
                  <div className="p-8 bg-gray-50 rounded-full border-2 border-dashed border-gray-200">
                    <ShoppingCart className="h-10 w-10" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest">Order is empty</p>
                </div>
              ) : (
                cashierCart.map((item) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-burgundy/20 transition-all group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-brand-burgundy shadow-sm text-lg">
                      {item.productName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-brand-charcoal text-sm truncate uppercase tracking-tight">{item.productName}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-black">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-100">{item.weightKg}kg</span>
                        <span className="opacity-50">×</span>
                        <span>{formatCurrency(item.pricePerKg, settings)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black text-brand-charcoal text-sm leading-none">{formatCurrency(item.pricePerKg * item.weightKg, settings)}</p>
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Totals & Sticky Action */}
            <div className="p-4 lg:p-6 bg-white lg:bg-gray-50/30 border-t border-gray-100 space-y-4">
              <div className="space-y-2 hidden lg:block">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter text-gray-400">
                  <span>Items Subtotal</span>
                  <span>{formatCurrency(subtotal, settings)}</span>
                </div>
                {cashierDiscount && (
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter text-emerald-500">
                    <span>Special Discount</span>
                    <span>{cashierDiscount.type === "amount" ? `- ${formatCurrency(cashierDiscount.value, settings)}` : `- ${cashierDiscount.value.toFixed(1)}%`}</span>
                  </div>
                )}
              </div>

              <div className="flex lg:grid lg:grid-cols-2 gap-3 items-center">
                {/* Summary for Mobile */}
                <div className="flex-1 lg:hidden">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Amount</div>
                  <div className="text-2xl font-black text-brand-charcoal leading-none">
                    {formatCurrency(total, settings)}
                  </div>
                </div>

                {/* Payment Selection - Hidden or side-by-side */}
                <div className="hidden lg:grid grid-cols-2 gap-2 col-span-2 mb-4">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cashierPaymentMethod === "cash" ? "bg-brand-charcoal text-white shadow-lg" : "bg-white text-gray-400 border border-gray-100 hover:border-gray-200"}`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cashierPaymentMethod === "mpesa" ? "bg-emerald-500 text-white shadow-lg" : "bg-white text-gray-400 border border-gray-100 hover:border-gray-200"}`}
                  >
                    M-Pesa
                  </button>
                </div>

                <Button
                  size="lg"
                  className="flex-1 lg:col-span-2 h-16 lg:h-14 text-sm font-black uppercase tracking-[0.1em] shadow-premium-xl rounded-2xl bg-brand-burgundy hover:bg-red-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                  disabled={cashierCart.length === 0}
                  onClick={handleCompleteSale}
                >
                  <Receipt className="h-5 w-5 hidden lg:block" />
                  <span>Pay Now</span>
                  <span className="lg:hidden"> — {formatCurrency(total, settings)}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Configuration Overlay - Shown when product selected but not added */}
      {selectedProduct && selectedProduct.id && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] fade-in" onClick={() => setSelectedProduct(null)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-white rounded-t-[32px] p-8 space-y-8 shadow-premium-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Adding to order</span>
                <h2 className="text-2xl font-black text-brand-charcoal tracking-tighter mt-1">{selectedProduct.name}</h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Price per kg</div>
                <div className="text-xl font-black text-brand-burgundy mt-1">{formatCurrency(selectedProduct.pricePerKg, settings)}</div>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <div className="relative bg-gray-50 rounded-2xl p-2 border-2 border-transparent focus-within:bg-white focus-within:border-brand-burgundy transition-all">
                  <Input
                    type="number"
                    autoFocus
                    step="0.01"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="h-16 text-4xl font-black text-brand-charcoal pl-6 pr-12 border-none bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg uppercase">kg</span>
                </div>
                <div className="flex justify-around mt-4">
                  {QUICK_WEIGHTS.map((w) => (
                    <button
                      key={w}
                      onClick={() => handleQuickWeight(w)}
                      className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${weightKg === w ? 'bg-brand-burgundy text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                    >
                      {w}kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="h-16 px-6 font-black uppercase tracking-widest text-gray-400"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-16 text-lg font-black uppercase tracking-widest shadow-premium-xl rounded-2xl bg-brand-burgundy hover:bg-red-900"
                onClick={handleAddToCart}
              >
                Confirm & Add
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

