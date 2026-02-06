import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import {
  Clock,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  X,
  Loader,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface ShiftData {
  shift_id: string;
  cashier_id: string;
  cashier_name: string;
  branch_id: string;
  status: "OPEN" | "CLOSED" | "open" | "closed";
  opened_at: string;
  closed_at?: string;
  closing_cash: number;
  closing_mpesa: number;
  total_products: number;
  total_sold_kg: number;
  total_added_kg: number;
}

interface CartItem {
  product_id: string;
  product_name: string;
  weight_kg: number;
  unit_price: number;
  category: string;
}

interface StockEntry {
  product_id: string;
  product_name: string;
  category: string;
  unit_price: number;
  opening_stock: number;
  added_stock: number;
  sold_stock: number;
  closing_stock: number;
  expected_closing: number;
  variance: number;
}

const safeJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// ✅ Helper function to safely get shift ID from either shift_id or id field
const getShiftId = (shift: ShiftData | null): string | null => {
  if (!shift) return null;
  return shift.shift_id || (shift as any).id || null;
};

export const CashierShiftWorkflow = () => {
  const { currentUser, settings } = useAppStore();
  const token = useAppStore((s) => s.token);
  const [stage, setStage] = useState<"start" | "active" | "closing">("start");
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Cart state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState("1.0");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");

  // Closing shift state
  const [closingStock, setClosingStock] = useState<Record<string, number>>({});
  const [cashReceived, setCashReceived] = useState(0);
  const [mpesaReceived, setMpesaReceived] = useState(0);

  // Mid-shift expenses state (submitted immediately)
  const [midShiftExpenses, setMidShiftExpenses] = useState<Array<{ id: string; category: string; amount: number; payment_method: "cash" | "mpesa"; status: string }>>([]);
  const [midShiftExpenseCategory, setMidShiftExpenseCategory] = useState("Transport");
  const [midShiftExpenseAmount, setMidShiftExpenseAmount] = useState<number | "">("");
  const [midShiftExpenseMethod, setMidShiftExpenseMethod] = useState<"cash" | "mpesa">("cash");
  const [submittingMidShiftExpense, setSubmittingMidShiftExpense] = useState(false);

  // Closing expenses state
  const [closingExpenses, setClosingExpenses] = useState<Array<{ id: string; category: string; amount: number; payment_method: "cash" | "mpesa" }>>([]);
  const [newExpenseCategory, setNewExpenseCategory] = useState("Transport");
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | "">("");
  const [newExpenseMethod, setNewExpenseMethod] = useState<"cash" | "mpesa">("cash");
  const [showConfirmExpense, setShowConfirmExpense] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<{ category: string; amount: number; payment_method: "cash" | "mpesa" } | null>(null);
  const EXPENSE_CATEGORIES = ["Transport", "Packaging", "Repairs", "Food", "Supplies", "Other"];

  // Add Stock UI state
  const [addStockStep, setAddStockStep] = useState<'closed' | 'category' | 'subcategory' | 'amount' | 'confirm'>('closed');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<{id: string, name: string} | null>(null);
  const [stockAmount, setStockAmount] = useState("");

  // Check for active shift on component mount
  useEffect(() => {
    const checkActiveShift = async () => {
      if (!currentUser?.id) {
        setInitializing(false);
        return;
      }

      try {
        const data = await api.get(`/api/shifts/active/${currentUser.id}`);
        const response = { ok: true };

        if (response.ok) {
          if (data?.shift && (data.shift.status === "open" || data.shift.status === "OPEN")) {
            // ✅ ACTIVE SHIFT FOUND - AUTO-RESUME (NO ERROR, NO BUTTON CLICK NEEDED)
            console.log("[Shift Auto-Resumed] Welcome back! Shift:", data.shift.shift_id);
            setShiftData(data.shift);
            setStockEntries(data.stock_entries || []);
            setStage("active");
            setError(null); // Clear any errors - this is GOOD, not bad!
          } else {
            // ❌ NO ACTIVE SHIFT - SHOW "START SHIFT" BUTTON
            setStage("start");
            setError(null);
          }
        } else if (response.status === 404) {
          // ❌ NO ACTIVE SHIFT FOUND (Expected response)
          setStage("start");
          setError(null);
        } else {
          // Other error - default to start screen (don't show error to user)
          console.error("Error checking active shift:", response.status);
          setStage("start");
          setError(null);
        }
      } catch (err) {
        console.error("Error checking for active shift:", err);
        setStage("start");
        setError(null);
      } finally {
        setInitializing(false);
      }
    };

    checkActiveShift();
  }, [currentUser?.id, token]);

  // Get active shift on mount
  useEffect(() => {
    if (stage === "active" && shiftData) {
      fetchShiftData();
      const interval = setInterval(fetchShiftData, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [stage, getShiftId(shiftData)]);

  const fetchShiftData = async () => {
    if (!shiftData) return;
    try {
      const data = await api.get(`/api/shifts/active/${currentUser?.id}`);
      if (data?.shift) {
        setShiftData(data.shift);
        setStockEntries(data.stock_entries || []);
      }
    } catch (err) {
      // Silently ignore errors during polling
    }
  };

  // ============================================================================
  // STEP 1: START SHIFT (Only if no active shift exists)
  // ============================================================================
  const handleStartShift = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post("/api/shifts/start", {
        cashier_id: currentUser?.id,
        cashier_name: currentUser?.name,
        branch_id: currentUser?.branch_id || "eden-drop-tamasha",
      });
      console.log("[Shift Started]", data.shift);
      setShiftData(data.shift);
      
      // Fetch stock entries immediately after starting shift
      try {
        const shiftDetails = await api.get(`/api/shifts/${data.shift.shift_id}/details`);
        setStockEntries(shiftDetails?.stock_reconciliation?.entries || []);
      } catch (err) {
        console.warn("Could not fetch initial stock details", err);
      }
      
      setStage("active");
    } catch (err) {
      setError((err as Error).message);
      console.error("Error starting shift:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STEP 2: ADD SALE TO CART
  // ============================================================================
  const handleAddToCart = () => {
    if (!selectedProduct || !selectedQuantity) return;

    const product = stockEntries.find((e) => e.product_id === selectedProduct);
    if (!product) return;

    const quantity = parseFloat(selectedQuantity);
    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    const cartItem: CartItem = {
      product_id: selectedProduct,
      product_name: product.product_name,
      weight_kg: quantity,
      unit_price: product.unit_price,
      category: product.category,
    };

    setCart([...cart, cartItem]);
    setSelectedProduct(null);
    setSelectedQuantity("1.0");
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.weight_kg * item.unit_price, 0);

  // ============================================================================
  // STEP 3: CONFIRM SALE
  // ============================================================================
  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shiftId = getShiftId(shiftData);
      if (!shiftId) {
        throw new Error("Shift ID is missing");
      }
      const data = await api.post(
        `/api/shifts/${shiftId}/add-sale`,
        {
          items: cart.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            weight_kg: item.weight_kg,
            unit_price: item.unit_price,
            amount: item.weight_kg * item.unit_price,
          })),
          payment_method: paymentMethod,
          total_amount: cartSubtotal,
        }
      );
      console.log("Sale confirmed:", data);

      // Clear cart and refresh shift data
      setCart([]);
      await fetchShiftData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STEP 4: ADD STOCK MID-SHIFT - HIERARCHICAL MEAT CATEGORIES
  // ============================================================================
  
  // Meat category mapping based on database products
  const meatCategories = {
    Chicken: [
      { id: 'prod-chicken-001', name: 'Chicken Breast' },
      { id: 'prod-chicken-002', name: 'Chicken Thigh' }
    ],
    Goat: [
      { id: 'prod-goat-001', name: 'Goat Meat' }
    ],
    Lamb: [
      { id: 'prod-lamb-001', name: 'Lamb Leg' },
      { id: 'prod-lamb-002', name: 'Lamb Chops' }
    ],
    Cow: [
      { id: 'prod-beef-001', name: 'Beef Chuck (Steak)' },
      { id: 'prod-beef-002', name: 'Beef Ribs' },
      { id: 'prod-beef-003', name: 'Beef Mince' }
    ]
  };

  const handleAddStock = async (productId: string, quantity: number) => {
    setLoading(true);
    setError(null);

    try {
      const shiftId = getShiftId(shiftData);
      if (!shiftId) {
        throw new Error("Shift ID is missing");
      }
      await api.post(
        `/api/shifts/${shiftId}/add-stock`,
        {
          product_id: productId,
          quantity_kg: quantity,
          supplier: "Manual Addition",
        }
      );

      await fetchShiftData();
      
      // Reset add stock flow
      setAddStockStep('closed');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setStockAmount("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddStock = () => {
    if (!selectedSubcategory || !stockAmount) return;
    
    const amount = parseFloat(stockAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    handleAddStock(selectedSubcategory.id, amount);
  };

  const handleAddExpenseToClosing = () => {
    if (!newExpenseAmount || Number(newExpenseAmount) <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }

    setPendingExpense({
      category: newExpenseCategory,
      amount: Number(newExpenseAmount),
      payment_method: newExpenseMethod,
    });
    setShowConfirmExpense(true);
  };

  // ============================================================================
  // Mid-shift expense submission (immediate to API)
  // ============================================================================
  const handleSubmitMidShiftExpense = async () => {
    if (!midShiftExpenseAmount || Number(midShiftExpenseAmount) <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }

    const shiftId = getShiftId(shiftData);
    if (!shiftId) {
      setError("Shift data is missing. Cannot add expense.");
      return;
    }

    setSubmittingMidShiftExpense(true);
    setError(null);

    try {
      console.log(`[MID_SHIFT_EXPENSE] Submitting expense: ${midShiftExpenseCategory} - KES ${midShiftExpenseAmount}`);
      
      const response = await api.post("/api/expenses", {
        shift_id: shiftId,
        cashier_id: currentUser?.id,
        branch_id: shiftData?.branch_id || "unknown",
        amount: Number(midShiftExpenseAmount),
        category: midShiftExpenseCategory,
        payment_method: midShiftExpenseMethod,
        description: `Added during shift (${new Date().toLocaleTimeString()})`,
      });

      if (response?.expense) {
        console.log(`[MID_SHIFT_EXPENSE] Success - Expense saved with ID: ${response.expense.id}`);
        
        // Add to submitted expenses list
        const newExpense = {
          id: response.expense.id,
          category: midShiftExpenseCategory,
          amount: Number(midShiftExpenseAmount),
          payment_method: midShiftExpenseMethod,
          status: "Submitted",
        };
        
        setMidShiftExpenses((prev) => [...prev, newExpense]);
        
        // Clear form for next entry
        setMidShiftExpenseAmount("");
        setMidShiftExpenseCategory("Transport");
        setMidShiftExpenseMethod("cash");
      } else {
        throw new Error("Failed to save expense - no response");
      }
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to submit expense";
      console.error("[MID_SHIFT_EXPENSE_ERROR]", errorMsg);
      setError(`Expense submission failed: ${errorMsg}`);
    } finally {
      setSubmittingMidShiftExpense(false);
    }
  };

  const handleConfirmExpense = () => {
    if (pendingExpense) {
      const expense = {
        id: Date.now().toString(),
        category: pendingExpense.category,
        amount: pendingExpense.amount,
        payment_method: pendingExpense.payment_method,
      };

      setClosingExpenses((prev) => [...prev, expense]);
      setNewExpenseAmount("");
      setNewExpenseCategory("Transport");
      setNewExpenseMethod("cash");
      setPendingExpense(null);
      setShowConfirmExpense(false);
      setError(null);
    }
  };

  const handleCancelExpense = () => {
    setPendingExpense(null);
    setShowConfirmExpense(false);
  };

  const totalClosingExpenses = closingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const closingCashExpenses = closingExpenses.filter((e) => e.payment_method === "cash").reduce((sum, e) => sum + e.amount, 0);
  const closingMpesaExpenses = closingExpenses.filter((e) => e.payment_method === "mpesa").reduce((sum, e) => sum + e.amount, 0);

  // ============================================================================
  // STEP 5: CLOSE SHIFT
  // ============================================================================
  const handleCloseShift = async () => {
    // ✅ Get shift ID with fallback for both id and shift_id fields
    const shiftId = getShiftId(shiftData);
    
    if (!shiftId) {
      setError("Cannot close shift: shift ID is missing. Please refresh and try again.");
      console.error("[SHIFT_CLOSE_ERROR] No shift ID available:", shiftData);
      return;
    }

    if (Object.keys(closingStock).length === 0) {
      setError("Please enter closing stock for all products");
      return;
    }

    if (cashReceived === undefined || mpesaReceived === undefined) {
      setError("Please enter cash and M-Pesa received");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[SHIFT_CLOSE] Closing shift ${shiftId}`);
      
      // Save expenses FIRST before closing shift
      if (closingExpenses.length > 0) {
        for (const expense of closingExpenses) {
          try {
            await api.post("/api/expenses", {
              shift_id: shiftId,
              cashier_id: currentUser?.id,
              branch_id: shiftData?.branch_id || "unknown",
              amount: expense.amount,
              category: expense.category,
              payment_method: expense.payment_method,
              description: "Added during shift closing",
            });
          } catch (err) {
            console.error("[EXPENSE_SAVE_ERROR]", err);
          }
        }
      }
      
      // Then close the shift
      const data = await api.post(
        `/api/shifts/${shiftId}/close`,
        {
          closing_stock_map: closingStock,
          cash_received: cashReceived,
          mpesa_received: mpesaReceived,
        }
      );

      if (!data) {
        throw new Error("Failed to close shift");
      }

      console.log("[SHIFT_CLOSED] Success:", data);

      setClosingExpenses([]);
      setNewExpenseAmount("");
      setNewExpenseCategory("Transport");
      setNewExpenseMethod("cash");
      setStage("closing");
      setShiftData(data?.shift || shiftData);
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to close shift";
      console.error("[SHIFT_CLOSE_ERROR]", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UI: INITIALIZATION - CHECK FOR ACTIVE SHIFT
  // ============================================================================
  if (initializing) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8">
            <Loader className="h-16 w-16 text-white mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-black text-white text-center">
              Checking Shift Status
            </h1>
          </div>

          <div className="p-8">
            <p className="text-center text-slate-600">
              Restoring your shift data...
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ============================================================================
  // UI: STEP 1 - START SHIFT
  // ============================================================================
  if (stage === "start") {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8">
            <Clock className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white text-center">
              Start Your Shift
            </h1>
            <p className="text-emerald-50 text-center mt-2">
              {currentUser?.name} • {currentUser?.branch_id}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>💡 Ready?</strong> Opening stock is automatically loaded from yesterday's closing stock.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              onClick={handleStartShift}
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-lg hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                "Start Shift"
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ============================================================================
  // UI: STEP 2-4 - ACTIVE SHIFT
  // ============================================================================
  if (stage === "active") {
    // Show loading if no stock entries yet
    if (!shiftData || stockEntries.length === 0) {
      return (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="p-8 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Loading Shift Data...
            </h2>
            <p className="text-slate-500">
              {shiftData ? "Fetching products..." : "Initializing shift..."}
            </p>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  Active Shift
                </h1>
                <p className="text-slate-500 mt-1">
                  {shiftData.cashier_name} • Branch: {shiftData.branch_id}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </div>
                  <span className="text-emerald-600 font-semibold text-sm">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Add Sales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add to Cart Section */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6" />
                    Sales
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Product Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Select Product
                    </label>
                    <select
                      value={selectedProduct || ""}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a product...</option>
                      {stockEntries.map((entry) => (
                        <option key={entry.product_id} value={entry.product_id}>
                          {entry.product_name} ({entry.category}) - Current:
                          {entry.closing_stock}kg
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Quantity (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                      placeholder="1.0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Payment Method
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                          paymentMethod === "cash"
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod("mpesa")}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                          paymentMethod === "mpesa"
                            ? "bg-green-500 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        📱 M-Pesa
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedProduct || !selectedQuantity}
                    className="w-full h-12 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </Card>

              {/* Shopping Cart */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                  <h2 className="text-2xl font-black text-white">
                    Shopping Cart ({cart.length})
                  </h2>
                </div>

                <div className="p-6">
                  {cart.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">
                      No items in cart
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {item.weight_kg}kg × {formatCurrency(item.unit_price, settings)}/kg
                            </p>
                          </div>
                          <div className="text-right mr-4">
                            <p className="font-bold text-slate-900">
                              {formatCurrency(
                                item.weight_kg * item.unit_price,
                                settings
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(index)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-all"
                          >
                            <X className="h-5 w-5 text-red-500" />
                          </button>
                        </motion.div>
                      ))}

                      {/* Subtotal */}
                      <div className="border-t border-slate-200 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold text-slate-700">
                            Total:
                          </span>
                          <span className="text-2xl font-black text-slate-900">
                            {formatCurrency(cartSubtotal, settings)}
                          </span>
                        </div>

                        <Button
                          onClick={handleConfirmSale}
                          disabled={loading || cart.length === 0}
                          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                        >
                          {loading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            "Confirm Sale"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Stock Management - Simplified Hierarchical Interface */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
                  <h2 className="text-2xl font-black text-white">
                    Add Stock Mid-Shift
                  </h2>
                </div>

                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                    Received stock during shift? Add it here to update expected stock.
                  </p>

                  {/* Step 1: Button to initiate */}
                  {addStockStep === 'closed' && (
                    <button
                      onClick={() => setAddStockStep('category')}
                      className="w-full px-6 py-4 bg-amber-500 text-white font-bold text-lg rounded-lg hover:bg-amber-600 transition-all shadow-md"
                    >
                      + Add Stock
                    </button>
                  )}

                  {/* Step 2: Select Category (Chicken, Goat, Lamb, Cow) */}
                  {addStockStep === 'category' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="font-bold text-slate-900 mb-3">Select Meat Type:</p>
                      {Object.keys(meatCategories).map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(category);
                            // If only one subcategory (like Goat/Chicken), skip to amount
                            const subcategories = meatCategories[category as keyof typeof meatCategories];
                            if (subcategories.length === 1) {
                              setSelectedSubcategory(subcategories[0]);
                              setAddStockStep('amount');
                            } else {
                              setAddStockStep('subcategory');
                            }
                          }}
                          className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-lg text-left font-bold text-slate-900 hover:border-amber-500 hover:bg-amber-50 transition-all"
                        >
                          {category}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setAddStockStep('closed');
                          setSelectedCategory(null);
                        }}
                        className="w-full px-5 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}

                  {/* Step 3: Select Subcategory (for Cow/Lamb with multiple cuts) */}
                  {addStockStep === 'subcategory' && selectedCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="font-bold text-slate-900 mb-3">Select {selectedCategory} Cut:</p>
                      {meatCategories[selectedCategory as keyof typeof meatCategories].map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => {
                            setSelectedSubcategory(subcategory);
                            setAddStockStep('amount');
                          }}
                          className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-lg text-left font-bold text-slate-900 hover:border-amber-500 hover:bg-amber-50 transition-all"
                        >
                          {subcategory.name}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setAddStockStep('category');
                          setSelectedSubcategory(null);
                        }}
                        className="w-full px-5 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                      >
                        Back
                      </button>
                    </motion.div>
                  )}

                  {/* Step 4: Enter Amount */}
                  {addStockStep === 'amount' && selectedSubcategory && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-slate-600">Adding stock for:</p>
                        <p className="font-bold text-lg text-slate-900">{selectedSubcategory.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Enter Amount (kg):
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={stockAmount}
                          onChange={(e) => setStockAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-lg focus:border-amber-500"
                          autoFocus
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!stockAmount || parseFloat(stockAmount) <= 0) {
                            setError("Please enter a valid amount");
                            return;
                          }
                          setAddStockStep('confirm');
                        }}
                        disabled={!stockAmount || parseFloat(stockAmount) <= 0}
                        className="w-full px-5 py-4 bg-amber-500 text-white font-bold text-lg rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                      >
                        Continue
                      </button>
                      
                      <button
                        onClick={() => {
                          setAddStockStep(selectedCategory && meatCategories[selectedCategory as keyof typeof meatCategories].length > 1 ? 'subcategory' : 'category');
                          setStockAmount("");
                        }}
                        className="w-full px-5 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                      >
                        Back
                      </button>
                    </motion.div>
                  )}

                  {/* Step 5: Confirmation */}
                  {addStockStep === 'confirm' && selectedSubcategory && stockAmount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                        <p className="text-sm text-slate-600 mb-2">Confirm Stock Addition:</p>
                        <p className="font-black text-2xl text-slate-900 mb-1">{selectedSubcategory.name}</p>
                        <p className="font-bold text-3xl text-green-600">{parseFloat(stockAmount).toFixed(1)} kg</p>
                      </div>

                      <p className="text-sm text-slate-600 text-center">
                        Are you sure about this amount?
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setAddStockStep('amount')}
                          className="px-5 py-4 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleConfirmAddStock}
                          disabled={loading}
                          className="px-5 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader className="h-5 w-5 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5" />
                              Submit
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setAddStockStep('closed');
                          setSelectedCategory(null);
                          setSelectedSubcategory(null);
                          setStockAmount("");
                        }}
                        className="w-full px-5 py-3 text-slate-500 font-bold hover:text-slate-700 transition-all"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Shift Summary & Close Shift */}
            <div className="space-y-6">
              {/* Shift Summary */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-6">
                  <h2 className="text-xl font-black text-white">Shift Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Opening Stock:</span>
                    <span className="font-bold text-slate-900">
                      {shiftData.total_products} products
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Sold:
                    </span>
                    <span className="font-bold text-slate-900">
                      {shiftData.total_sold_kg.toFixed(1)}kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Added:
                    </span>
                    <span className="font-bold text-slate-900">
                      {shiftData.total_added_kg.toFixed(1)}kg
                    </span>
                  </div>
                </div>
              </Card>

              {/* Mid-Shift Expenses */}
              <Card className="rounded-xl shadow-sm overflow-hidden border-2 border-orange-200">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                  <h2 className="text-xl font-black text-white">💰 Expenses (During Shift)</h2>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-600">
                    Add expenses anytime during the shift. They are submitted immediately to the system.
                  </p>

                  {/* Expense Input Form */}
                  <div className="space-y-3 bg-orange-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">
                        Category
                      </label>
                      <select
                        value={midShiftExpenseCategory}
                        onChange={(e) => setMidShiftExpenseCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">
                        Amount (KES)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={midShiftExpenseAmount}
                        onChange={(e) => setMidShiftExpenseAmount(e.target.value ? Number(e.target.value) : "")}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMidShiftExpenseMethod("cash")}
                        className={`h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                          midShiftExpenseMethod === "cash"
                            ? "bg-green-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-green-600"
                        }`}
                      >
                        💰 Cash
                      </button>
                      <button
                        onClick={() => setMidShiftExpenseMethod("mpesa")}
                        className={`h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                          midShiftExpenseMethod === "mpesa"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-blue-600"
                        }`}
                      >
                        📱 M-Pesa
                      </button>
                    </div>

                    <Button
                      onClick={handleSubmitMidShiftExpense}
                      disabled={submittingMidShiftExpense || !midShiftExpenseAmount}
                      className="w-full h-10 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                      {submittingMidShiftExpense ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Submit Expense
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Submitted Expenses List */}
                  {midShiftExpenses.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        ✓ Submitted ({midShiftExpenses.length})
                      </div>
                      {midShiftExpenses.map((exp) => (
                        <motion.div
                          key={exp.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-white border-2 border-orange-200 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-900">{exp.category}</div>
                            <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider flex items-center gap-1">
                              <span>✓ Saved</span>
                              {exp.payment_method === "cash" ? "💰" : "📱"}
                            </div>
                          </div>
                          <div className="text-sm font-black text-slate-900">KES {exp.amount.toFixed(2)}</div>
                        </motion.div>
                      ))}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs font-bold text-orange-900 mt-2">
                        Shift Total: KES {midShiftExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Close Shift Form */}
              <Card className="rounded-xl shadow-sm overflow-hidden border-2 border-red-200">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                  <h2 className="text-xl font-black text-white">Close Shift</h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Cash & Mpesa */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Cash Received (KES)
                      </label>
                      <Input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        M-Pesa Received (KES)
                      </label>
                      <Input
                        type="number"
                        value={mpesaReceived}
                        onChange={(e) => setMpesaReceived(parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Expenses Section (Below M-Pesa) */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                      Add Expenses
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">
                          Category
                        </label>
                        <select
                          value={newExpenseCategory}
                          onChange={(e) => setNewExpenseCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">
                          Amount (KES)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value ? Number(e.target.value) : "")}
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setNewExpenseMethod("cash")}
                        className={`h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                          newExpenseMethod === "cash"
                            ? "bg-green-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-green-600"
                        }`}
                      >
                        💰 Cash
                      </button>
                      <button
                        onClick={() => setNewExpenseMethod("mpesa")}
                        className={`h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                          newExpenseMethod === "mpesa"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-blue-600"
                        }`}
                      >
                        📱 M-Pesa
                      </button>
                    </div>

                    <Button
                      onClick={handleAddExpenseToClosing}
                      className="w-full h-10 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                    >
                      + Add Expense
                    </Button>

                    {/* Expense Confirmation Dialog */}
                    {showConfirmExpense && pendingExpense && (
                      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4"
                        >
                          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Confirm Expense</h2>
                          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-600 uppercase">Category</span>
                              <span className="font-black text-slate-900">{pendingExpense.category}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-600 uppercase">Amount</span>
                              <span className="font-black text-slate-900">KES {pendingExpense.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-600 uppercase">Payment Method</span>
                              <span className="font-black text-slate-900">
                                {pendingExpense.payment_method === "cash" ? "💰 Cash" : "📱 M-Pesa"}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 font-bold">⚠️ Once confirmed, this expense will be saved to the database when you close the shift.</p>
                          <div className="flex gap-3 pt-2">
                            <Button
                              onClick={handleCancelExpense}
                              variant="ghost"
                              className="flex-1 h-10 text-slate-600 font-bold uppercase border border-slate-300 hover:bg-slate-100 rounded-lg"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleConfirmExpense}
                              className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-lg"
                            >
                              ✓ Confirm
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {closingExpenses.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {closingExpenses.map((exp) => (
                          <div key={exp.id} className="flex items-center justify-between bg-green-50 border-2 border-green-200 p-3 rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-slate-900">{exp.category}</div>
                              <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span>🔒 Locked</span>
                                {exp.payment_method === "cash" ? "💰 Cash" : "📱 M-Pesa"}
                              </div>
                            </div>
                            <div className="text-sm font-black text-slate-900">KES {exp.amount.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {closingExpenses.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs font-bold text-amber-900">
                        Total Expenses: KES {totalClosingExpenses.toFixed(2)}
                        <div className="mt-1 text-[10px] font-bold text-amber-800">
                          Cash: -KES {closingCashExpenses.toFixed(2)} · M-Pesa: -KES {closingMpesaExpenses.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Closing Stock Entries */}
                  <div className="max-h-96 overflow-y-auto">
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Closing Stock for Each Product
                    </label>
                    <div className="space-y-3">
                      {stockEntries.map((entry) => (
                        <div key={entry.product_id}>
                          <p className="text-xs text-slate-600 mb-1">
                            {entry.product_name}
                          </p>
                          <Input
                            type="number"
                            step="0.1"
                            value={closingStock[entry.product_id] || 0}
                            onChange={(e) =>
                              setClosingStock({
                                ...closingStock,
                                [entry.product_id]: parseFloat(e.target.value),
                              })
                            }
                            placeholder="0.0"
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Close Button */}
                  <Button
                    onClick={handleCloseShift}
                    disabled={loading}
                    className="w-full h-12 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all"
                  >
                    {loading ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      "Close Shift"
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================================================
  // UI: STEP 5 - SHIFT CLOSED
  // ============================================================================
  if (stage === "closing") {
    // Show closing confirmation if we have shift data or if we just closed
    if (!shiftData) {
      return (
        <motion.div
          className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8">
              <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-black text-white text-center">
                Shift Closed
              </h1>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-center text-slate-600">
                Your shift has been closed successfully. Admin is reviewing the data.
              </p>

              <Button
                onClick={() => {
                  setStage("start");
                  setShiftData(null);
                  setCart([]);
                  setClosingStock({});
                  setCashReceived(0);
                  setMpesaReceived(0);
                }}
                className="w-full h-12 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-all"
              >
                Start New Shift
              </Button>
            </div>
          </Card>
        </motion.div>
      );
    }

    // If stage is closing but no shift data, show the simple success message
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8">
            <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-black text-white text-center">
              Shift Closed
            </h1>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-700">Shift ID:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {getShiftId(shiftData)?.slice(0, 8) || "N/A"}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Status:</span>
                <span className="font-bold text-emerald-600">CLOSED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Cash Closed:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(shiftData?.closing_cash || 0, settings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">M-Pesa Closed:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(shiftData?.closing_mpesa || 0, settings)}
                </span>
              </div>
            </div>

            <p className="text-center text-slate-600 text-sm">
              Admin is reviewing your shift data in real-time.
            </p>

            <Button
              onClick={() => {
                setStage("start");
                setShiftData(null);
                setCart([]);
                setClosingStock({});
                setCashReceived(0);
                setMpesaReceived(0);
              }}
              className="w-full h-12 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-all"
            >
              Start New Shift
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
};
