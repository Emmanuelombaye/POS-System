import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, Product } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import { AddExpenseModal } from "@/components/cashier/AddExpenseModal";
import {
  Receipt,
  Trash2,
  ShoppingCart,
  Plus,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Check,
  Minus,
  AlertTriangle,
  Wallet,
} from "lucide-react";

const CATEGORY_CONFIG = {
  beef: {
    label: "🥩 Beef",
    gradient: "from-red-500 to-red-600",
    bg: "bg-category-beef",
    light: "bg-category-beef-light",
    border: "border-category-beef",
    text: "text-category-beef",
  },
  goat: {
    label: "🐐 Goat",
    gradient: "from-green-500 to-green-600",
    bg: "bg-category-goat",
    light: "bg-category-goat-light",
    border: "border-category-goat",
    text: "text-category-goat",
  },
  offal: {
    label: "🫀 Offal",
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-category-offal",
    light: "bg-category-offal-light",
    border: "border-category-offal",
    text: "text-category-offal",
  },
  processed: {
    label: "🌭 Processed",
    gradient: "from-purple-500 to-purple-600",
    bg: "bg-category-processed",
    light: "bg-category-processed-light",
    border: "border-category-processed",
    text: "text-category-processed",
  },
} as const;

export const ModernCashierDashboard = () => {
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
    clearCart,
    currentUser,
    activeShift,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [weightInput, setWeightInput] = useState("1.00");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const subtotal = useMemo(
    () => cashierCart.reduce((sum, item) => sum + item.pricePerKg * item.weightKg, 0),
    [cashierCart]
  );

  const total = useMemo(() => {
    if (!cashierDiscount) return subtotal;
    if (cashierDiscount.type === "amount") {
      return Math.max(subtotal - cashierDiscount.value, 0);
    }
    return subtotal * (1 - cashierDiscount.value / 100);
  }, [subtotal, cashierDiscount]);

  const filteredProducts = products
    .filter((p) => p.isActive)
    .filter((p) => selectedCategory === "all" || p.category === selectedCategory)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddToCart = (product: Product) => {
    const weight = parseFloat(weightInput) || 1;
    addProductToCart(product, weight);
    setWeightInput("1.00");
    setSelectedProduct(null);
  };

  const handleCompleteSale = () => {
    if (cashierCart.length === 0) return;
    const tx = completeSale();
    if (tx) {
      setShowCheckout(false);
      // Show success notification
      alert(`✅ Sale completed!\nTotal: ${formatCurrency(tx.total, settings)}\nPayment: ${cashierPaymentMethod.toUpperCase()}`);
    }
  };

  const handleWeightButton = (digit: string) => {
    if (digit === "C") {
      setWeightInput("1.00");
    } else if (digit === "←") {
      setWeightInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else {
      setWeightInput((prev) => {
        if (prev === "0" || prev === "1.00") return digit;
        if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
        return prev + digit;
      });
    }
  };

  const totalItems = cashierCart.reduce((sum, item) => sum + item.weightKg, 0);

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 overflow-hidden">
      {/* LEFT PANEL - Products */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-hidden pb-[55vh] lg:pb-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-gray-900">POS Terminal</h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              Welcome, <span className="text-brand-burgundy">{currentUser?.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => setShowExpenseModal(true)}
              disabled={!activeShift}
              className="h-12 px-3 sm:px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title={activeShift ? "Add an expense entry" : "Open shift first"}
            >
              <Wallet className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline text-sm">Expense</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 whitespace-nowrap">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-sm font-bold text-gray-700">Online</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative sticky top-0 z-20 bg-slate-50/95 backdrop-blur rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 text-base font-semibold bg-white border-2 border-gray-200 focus:border-brand-burgundy rounded-2xl shadow-sm"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-brand-burgundy to-red-600 text-white shadow-lg shadow-brand-burgundy/30"
                : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
            }`}
          >
            All Products
          </motion.button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(key)}
              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                  : `bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200`
              }`}
            >
              {config.label}
            </motion.button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 overflow-y-auto pb-4 auto-rows-min">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => {
              const config = CATEGORY_CONFIG[product.category as keyof typeof CATEGORY_CONFIG];
              const lowStock = product.stockKg <= product.lowStockThresholdKg;
              const outOfStock = product.stockKg <= 0;

              return (
                <motion.button
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !outOfStock && setSelectedProduct(product)}
                  disabled={outOfStock}
                  className={`relative flex flex-col items-start p-5 rounded-2xl h-44 text-left overflow-hidden group transition-all ${
                    outOfStock
                      ? "bg-gray-100 border-2 border-gray-200 opacity-50 cursor-not-allowed"
                      : `bg-white border-2 ${config.border} border-opacity-0 hover:border-opacity-100 shadow-lg hover:shadow-xl`
                  }`}
                >
                  {/* Stock Warning Badge */}
                  {lowStock && !outOfStock && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      LOW
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-[1px]">
                      <span className="text-gray-600 font-black text-sm uppercase tracking-wider">Out of Stock</span>
                    </div>
                  )}

                  {/* Category Icon */}
                  <div className={`${config.light} ${config.text} p-2.5 rounded-xl mb-3`}>
                    <span className="text-2xl">{config.label.split(" ")[0]}</span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 w-full">
                    <h3 className="font-black text-sm text-gray-900 leading-tight mb-1">{product.name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{product.code}</p>
                  </div>

                  {/* Price & Stock */}
                  <div className="w-full mt-auto">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-2xl font-black ${config.text}`}>
                          {formatCurrency(product.pricePerKg, settings).split(".")[0]}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold">/kg</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">{product.stockKg.toFixed(1)}</p>
                        <p className="text-[10px] text-gray-500 font-bold">kg available</p>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL - Cart & Checkout */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col shadow-2xl fixed bottom-0 left-0 right-0 z-40 max-h-[55vh] lg:static lg:max-h-none rounded-t-3xl lg:rounded-none">
        {/* Cart Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-brand-burgundy to-red-600 rounded-t-3xl lg:rounded-none">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Cart</h2>
                <p className="text-sm text-white/80 font-semibold">{cashierCart.length} items • {totalItems.toFixed(2)} kg</p>
              </div>
            </div>
            {cashierCart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          <AnimatePresence>
            {cashierCart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="p-6 bg-gray-100 rounded-full mb-4">
                  <ShoppingCart className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-900 font-black text-lg mb-2">Cart is Empty</p>
                <p className="text-gray-500 text-sm font-semibold">Select products to add</p>
              </motion.div>
            ) : (
              cashierCart.map((item) => {
                const config = CATEGORY_CONFIG[products.find((p) => p.id === item.productId)?.category as keyof typeof CATEGORY_CONFIG];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 hover:border-brand-burgundy/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-black text-sm text-gray-900">{item.productName}</h4>
                        <p className="text-xs text-gray-500 font-semibold mt-1">
                          {formatCurrency(item.pricePerKg, settings)}/kg
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCartItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg -mr-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemWeight(item.id, Math.max(0.1, item.weightKg - 0.1))}
                          className="h-8 w-8 p-0 rounded-lg border-2"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-black text-base min-w-[60px] text-center">
                          {item.weightKg.toFixed(2)} kg
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemWeight(item.id, item.weightKg + 0.1)}
                          className="h-8 w-8 p-0 rounded-lg border-2"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className={`text-right ${config?.text}`}>
                        <p className="text-xl font-black">
                          {formatCurrency(item.pricePerKg * item.weightKg, settings)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Checkout Summary */}
        {cashierCart.length > 0 && (
          <div className="border-t border-gray-200 p-4 sm:p-6 space-y-5 bg-gray-50 sticky bottom-0">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, settings)}</span>
              </div>
              {cashierDiscount && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(subtotal - total, settings)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t-2 border-gray-300">
                <span>Total</span>
                <span>{formatCurrency(total, settings)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-600">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { method: "cash", icon: Banknote, label: "Cash" },
                  { method: "mpesa", icon: Smartphone, label: "M-Pesa" },
                  { method: "card", icon: CreditCard, label: "Card" },
                ].map(({ method, icon: Icon, label }) => (
                  <motion.button
                    key={method}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`p-3 rounded-xl font-bold text-sm flex flex-col items-center gap-2 transition-all ${
                      cashierPaymentMethod === method
                        ? "bg-brand-burgundy text-white shadow-lg"
                        : "bg-white text-gray-700 border-2 border-gray-200 hover:border-brand-burgundy/30"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCompleteSale}
              className="w-full h-14 text-lg font-black bg-gradient-to-r from-brand-burgundy to-red-600 hover:from-red-700 hover:to-red-800 shadow-xl shadow-brand-burgundy/30 rounded-xl"
            >
              <Check className="mr-2 h-5 w-5" />
              Complete Sale
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button - New Sale */}
      {cashierCart.length > 0 && (
        <Button
          onClick={clearCart}
          className="fixed bottom-28 right-4 z-50 h-14 w-14 rounded-full bg-brand-burgundy text-white shadow-2xl lg:hidden"
          title="New Sale"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Product Selection Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedProduct.name}</h3>
                  <p className="text-gray-500 font-semibold">
                    {formatCurrency(selectedProduct.pricePerKg, settings)}/kg
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Weight Input */}
              <div className="mb-6">
                <label className="text-xs font-black uppercase tracking-wider text-gray-600 mb-3 block">
                  Enter Weight (kg)
                </label>
                <div className="text-center mb-4">
                  <input
                    type="text"
                    value={weightInput}
                    readOnly
                    className="text-5xl font-black text-center w-full text-brand-burgundy bg-gray-50 rounded-2xl py-4 mb-2"
                  />
                  <p className="text-lg font-bold text-gray-600">
                    Total: {formatCurrency(selectedProduct.pricePerKg * parseFloat(weightInput || "0"), settings)}
                  </p>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"].map((digit) => (
                    <Button
                      key={digit}
                      variant="outline"
                      onClick={() => handleWeightButton(digit)}
                      className="h-16 text-2xl font-black rounded-xl hover:bg-brand-burgundy hover:text-white border-2"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleWeightButton("C")}
                  className="w-full mt-2 h-12 font-black rounded-xl border-2 text-red-600 hover:bg-red-50"
                >
                  Clear
                </Button>
              </div>

              {/* Add Button */}
              <Button
                onClick={() => handleAddToCart(selectedProduct)}
                disabled={!weightInput || parseFloat(weightInput) <= 0}
                className="w-full h-14 text-lg font-black bg-gradient-to-r from-brand-burgundy to-red-600 rounded-xl shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AddExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
      />
    </div>
  );
};
