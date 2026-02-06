import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { useCashierShiftSummary } from "@/hooks/useCashierShiftSummary";

interface Transaction {
  id: string;
  transaction_id: string;
  cashier_id: string;
  cashier_name?: string;
  payment_method: string;
  branch_id: string;
  total: number;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
}

interface BranchSummary {
  branch_id: string;
  branch_name: string;
  totalCash: number;
  totalMpesa: number;
  countCash: number;
  countMpesa: number;
  grandTotal: number;
}

interface Summary {
  totalCash: number;
  totalMpesa: number;
  countCash: number;
  countMpesa: number;
  lastUpdate: string;
}

export const SalesRealTimeMonitor = () => {
  const [cashTransactions, setCashTransactions] = useState<Transaction[]>([]);
  const [mpesaTransactions, setMpesaTransactions] = useState<Transaction[]>([]);
  const [branchSummary, setBranchSummary] = useState<BranchSummary[]>([]);
  const [branches, setBranches] = useState<Map<string, string>>(new Map());
  const [summary, setSummary] = useState<Summary>({
    totalCash: 0,
    totalMpesa: 0,
    countCash: 0,
    countMpesa: 0,
    lastUpdate: new Date().toLocaleTimeString(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // State for date selection - use local timezone (YYYY-MM-DD)
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const today = getTodayLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);

  // Hook for cashier shift summaries (with date parameter)
  const { 
    cashierSummaries, 
    loading: summaryLoading, 
    currentDate,
    refetch: refetchSummaries 
  } = useCashierShiftSummary(selectedDate);

  // Fetch branches from database
  const fetchBranches = async () => {
    try {
      const { data } = await supabase.from("branches").select("id, name");
      if (data) {
        const branchMap = new Map<string, string>();
        data.forEach((b: any) => {
          branchMap.set(b.id, b.name);
        });
        setBranches(branchMap);
        console.log("[Monitor] Branches loaded:", branchMap.size);
      }
    } catch (error) {
      console.warn("[Monitor] Could not fetch branches (table may not exist):", error);
    }
  };

  // Get branch name with fallback
  const getBranchName = (branchId: string): string => {
    return branches.get(branchId) || branchId || "Unknown";
  };

  // Fetch latest transactions and calculate summaries
  const fetchTransactions = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[Monitor] Error fetching transactions:", error);
        setIsRefreshing(false);
        return;
      }

      if (!data || data.length === 0) {
        console.log("[Monitor] No transactions found");
        setCashTransactions([]);
        setMpesaTransactions([]);
        setBranchSummary([]);
        setSummary({
          totalCash: 0,
          totalMpesa: 0,
          countCash: 0,
          countMpesa: 0,
          lastUpdate: new Date().toLocaleTimeString(),
        });
        setIsRefreshing(false);
        return;
      }

      console.log("[Monitor] Fetched " + data.length + " transactions");

      // Separate by payment method for top tables
      const cash = data.filter((t: any) => t.payment_method === "cash").slice(0, 10);
      const mpesa = data.filter((t: any) => t.payment_method === "mpesa").slice(0, 10);

      setCashTransactions(cash);
      setMpesaTransactions(mpesa);

      // Calculate branch summaries
      const branchMap = new Map<string, BranchSummary>();

      data.forEach((tx: any) => {
        const branchId = tx.branch_id || "unknown";
        const branchName = getBranchName(branchId);

        if (!branchMap.has(branchId)) {
          branchMap.set(branchId, {
            branch_id: branchId,
            branch_name: branchName,
            totalCash: 0,
            totalMpesa: 0,
            countCash: 0,
            countMpesa: 0,
            grandTotal: 0,
          });
        }

        const summary = branchMap.get(branchId)!;
        const amount = tx.total || 0;

        if (tx.payment_method === "cash") {
          summary.totalCash += amount;
          summary.countCash++;
        } else if (tx.payment_method === "mpesa") {
          summary.totalMpesa += amount;
          summary.countMpesa++;
        }

        summary.grandTotal = summary.totalCash + summary.totalMpesa;
      });

      const branchesArray = Array.from(branchMap.values()).sort((a, b) => b.grandTotal - a.grandTotal);
      setBranchSummary(branchesArray);

      // Calculate overall summary
      const totalCash = cash.reduce((sum, t) => sum + (t.total || 0), 0);
      const totalMpesa = mpesa.reduce((sum, t) => sum + (t.total || 0), 0);

      setSummary({
        totalCash,
        totalMpesa,
        countCash: cash.length,
        countMpesa: mpesa.length,
        lastUpdate: new Date().toLocaleTimeString(),
      });

      setIsRefreshing(false);
    } catch (error) {
      console.error("[Monitor] Error fetching transactions:", error);
      setIsRefreshing(false);
    }
  };

  // Initial setup - fetch branches and transactions
  useEffect(() => {
    fetchBranches();
    fetchTransactions();
  }, []);

  // Subscribe to real-time branch updates
  useEffect(() => {
    console.log("[Monitor] Setting up branch subscription...");
    const branchSubscription = supabase
      .channel("branches-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, (payload) => {
        console.log("[Monitor] Branches changed:", payload);
        setIsConnected(true);
        fetchBranches();
        fetchTransactions(); // Also refresh transactions to update branch names
      })
      .subscribe((status, error) => {
        console.log("[Monitor] Branch subscription status:", status, error);
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      console.log("[Monitor] Unsubscribing from branches...");
      branchSubscription.unsubscribe();
    };
  }, []);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    console.log("[Monitor] Setting up transaction subscription...");
    const txSubscription = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, (payload) => {
        console.log("[Monitor] New transaction detected:", payload);
        setIsConnected(true);
        fetchTransactions();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions" }, (payload) => {
        console.log("[Monitor] Transaction updated:", payload);
        setIsConnected(true);
        fetchTransactions();
      })
      .subscribe((status, error) => {
        console.log("[Monitor] Transaction subscription status:", status, error);
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      console.log("[Monitor] Unsubscribing from transactions...");
      txSubscription.unsubscribe();
    };
  }, []);

  // Polling interval as backup (every 1 second)
  useEffect(() => {
    console.log("[Monitor] Starting polling interval...");
    const interval = setInterval(() => {
      fetchTransactions();
      refetchSummaries();
    }, 1000);
    return () => {
      console.log("[Monitor] Clearing polling interval...");
      clearInterval(interval);
    };
  }, []);

  const TransactionTable = ({ title, transactions, color }: { title: string; transactions: Transaction[]; color: string }) => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
      <div className={`bg-gradient-to-r ${color} px-6 py-4`}>
        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-900">ID</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Cashier</th>
              <th className="px-4 py-3 text-right font-bold text-gray-900">Amount (KES)</th>
              <th className="px-4 py-3 text-right font-bold text-gray-900">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 font-semibold">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 font-bold text-gray-900">#{tx.transaction_id}</td>
                  <td className="px-4 py-3 text-gray-700">{tx.cashier_id}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{(tx.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 text-xs">
                    {new Date(tx.created_at).toLocaleTimeString()}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 font-bold text-gray-900">
        Total: KES {transactions.reduce((sum, t) => sum + (t.total || 0), 0).toFixed(2)} ({transactions.length} transactions)
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900">💳 Real-Time Sales Monitor</h1>
            <p className="text-gray-600 font-semibold mt-2">Live transaction tracking by payment method</p>
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            onClick={fetchTransactions}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-3 bg-brand-burgundy text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Cash Total</p>
                <p className="text-2xl font-black text-emerald-900">KES {summary.totalCash.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">M-Pesa Total</p>
                <p className="text-2xl font-black text-amber-900">KES {summary.totalMpesa.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase">Cash Count</p>
                <p className="text-2xl font-black text-blue-900">{summary.countCash}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-700 uppercase">M-Pesa Count</p>
                <p className="text-2xl font-black text-purple-900">{summary.countMpesa}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Last Update & Connection Status */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
            <div className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            {isConnected ? '🟢 Real-Time Connected' : '🔴 Reconnecting...'}
          </div>
          <div className="text-xs text-gray-500">Last update: {summary.lastUpdate}</div>
        </div>
      </div>

      {/* Two Transaction Tables + Branch Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TransactionTable
          title="💰 Cash Transactions"
          transactions={cashTransactions}
          color="from-emerald-500 to-emerald-600"
        />
        <TransactionTable
          title="📱 M-Pesa Transactions"
          transactions={mpesaTransactions}
          color="from-amber-500 to-orange-600"
        />

        {/* Branch Summary Table */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
            <h3 className="text-lg font-black text-white">🏢 Total by Branch ({branchSummary.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-900">Branch</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-600">💰 Cash</th>
                  <th className="px-4 py-3 text-right font-bold text-amber-600">📱 M-Pesa</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {branchSummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500 font-semibold">
                      No branch data
                    </td>
                  </tr>
                ) : (
                  branchSummary.map((branch, idx) => (
                    <motion.tr
                      key={branch.branch_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">{branch.branch_name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-700">KES {branch.totalCash.toFixed(0)}</span>
                        <span className="text-xs text-gray-500 block">({branch.countCash})</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-amber-700">KES {branch.totalMpesa.toFixed(0)}</span>
                        <span className="text-xs text-gray-500 block">({branch.countMpesa})</span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900 text-lg">
                        KES {branch.grandTotal.toFixed(0)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-indigo-50 px-6 py-3 border-t border-gray-200 font-bold text-gray-900">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-indigo-600">Total Cash</p>
                <p className="text-lg">KES {branchSummary.reduce((sum, b) => sum + b.totalCash, 0).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-indigo-600">Total M-Pesa</p>
                <p className="text-lg">KES {branchSummary.reduce((sum, b) => sum + b.totalMpesa, 0).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-indigo-600">Grand Total</p>
                <p className="text-lg font-black">KES {branchSummary.reduce((sum, b) => sum + b.grandTotal, 0).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cashier Shift Summary Table (NEW) */}
      <div className="mt-8 bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-black text-white">👥 Cashier End-of-Shift Summary</h3>
          
          {/* Date Picker */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-white" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || today)}
              max={today}
              className="px-4 py-2 rounded-lg font-bold text-gray-900 border-2 border-white/20 bg-white/90"
            />
            <motion.button
              whileHover={{ rotate: 180 }}
              onClick={() => refetchSummaries(selectedDate)}
              disabled={summaryLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${summaryLoading ? "animate-spin" : ""}`} />
            </motion.button>
            {selectedDate !== today && (
              <span className="text-white text-sm font-bold px-3 py-1 bg-white/20 rounded-lg">
                Historical
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Cashier</th>
                <th className="px-4 py-3 text-right font-bold text-emerald-600">💰 Cash</th>
                <th className="px-4 py-3 text-right font-bold text-blue-600">📱 M-Pesa</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900">Total Amount</th>
                <th className="px-4 py-3 text-right font-bold text-orange-600">📦 Stock Deficiency</th>
                <th className="px-4 py-3 text-right font-bold text-gray-900">Transactions</th>
                <th className="px-4 py-3 text-center font-bold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cashierSummaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500 font-semibold">
                    {summaryLoading ? "Loading shift summaries..." : `No closed shifts on ${new Date(selectedDate).toLocaleDateString()}`}
                  </td>
                </tr>
              ) : (
                cashierSummaries.map((summary, idx) => {
                  const hasDeficiency = summary.stock_deficiency_kg > 0.5;
                  return (
                    <motion.tr
                      key={summary.shift_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`hover:bg-gray-50 transition ${hasDeficiency ? "bg-orange-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {summary.cashier_name}
                        <span className="text-xs text-gray-500 block">{summary.cashier_id}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-700">KES {summary.cash_recorded.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-blue-700">KES {summary.mpesa_recorded.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900 text-lg">
                        KES {summary.total_recorded.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasDeficiency ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-orange-700">
                              {summary.stock_deficiency_kg.toFixed(1)}kg
                            </span>
                            <span className="text-xs bg-orange-200 text-orange-900 px-2 py-1 rounded font-bold">
                              {summary.deficiency_percent.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <div className="text-emerald-700 font-bold">No deficiency</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-bold">
                        {summary.transaction_count}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {summary.is_recent ? (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="flex justify-center"
                          >
                            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                              <CheckCircle className="h-3 w-3" />
                              Recent
                            </div>
                          </motion.div>
                        ) : (
                          <div className="text-gray-500 text-xs">Closed</div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {cashierSummaries.length > 0 && (
          <div className="bg-rose-50 px-6 py-4 border-t border-gray-200 font-bold text-gray-900">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="text-rose-600">Total Cash</p>
                <p className="text-lg">KES {cashierSummaries.reduce((sum, s) => sum + s.cash_recorded, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-600">Total M-Pesa</p>
                <p className="text-lg">KES {cashierSummaries.reduce((sum, s) => sum + s.mpesa_recorded, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Grand Total</p>
                <p className="text-lg font-black">KES {cashierSummaries.reduce((sum, s) => sum + s.total_recorded, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-orange-600">Total Deficiency</p>
                <p className="text-lg">{cashierSummaries.reduce((sum, s) => sum + s.stock_deficiency_kg, 0).toFixed(1)}kg</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesRealTimeMonitor;
