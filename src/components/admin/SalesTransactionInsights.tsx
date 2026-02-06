import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { motion } from "framer-motion";
import {
  Download,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface Transaction {
  id: string;
  transaction_id: string;
  branch_id: string;
  branch_name?: string;
  cashier_id: string;
  cashier_name?: string;
  payment_type: string; // Matches payment_method in DB
  total?: number; // Use 'total' from DB
  total_amount?: number; // Fallback
  discount_amount?: number;
  refund_flag?: boolean;
  void_flag?: boolean;
  created_at: string;
  items_count?: number;
}

interface FilterState {
  branch: string;
  cashier: string;
  paymentType: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

const COLORS = {
  cash: "#10b981",
  mpesa: "#f59e0b",
  card: "#3b82f6",
  completed: "#10b981",
  refund: "#f97316",
  void: "#9ca3af",
  suspicious: "#ef4444",
};

export const SalesTransactionInsights = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    branch: "all",
    cashier: "all",
    paymentType: "all",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    searchTerm: "",
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeView, setActiveView] = useState<"table" | "cards">(isMobile ? "cards" : "table");

  // Fetch data
  useEffect(() => {
    fetchData();
    window.addEventListener("resize", () => setIsMobile(window.innerWidth < 768));
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, (payload: any) => {
        if (payload.eventType === "INSERT") {
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setTransactions((prev) =>
            prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
          );
        } else if (payload.eventType === "DELETE") {
          setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    if (filters.branch !== "all") {
      filtered = filtered.filter((t) => t.branch_id === filters.branch);
    }
    if (filters.cashier !== "all") {
      filtered = filtered.filter((t) => t.cashier_id === filters.cashier);
    }
    if (filters.paymentType !== "all") {
      filtered = filtered.filter((t) => t.payment_type === filters.paymentType);
    }

    const startDate = new Date(filters.startDate).getTime();
    const endDate = new Date(filters.endDate).getTime() + 24 * 60 * 60 * 1000;

    filtered = filtered.filter((t) => {
      const txDate = new Date(t.created_at).getTime();
      return txDate >= startDate && txDate <= endDate;
    });

    if (filters.searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.transaction_id.includes(filters.searchTerm) ||
          t.cashier_name?.includes(filters.searchTerm) ||
          t.branch_name?.includes(filters.searchTerm)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (txError) throw txError;

      // Fetch branches (handle 404 gracefully if table doesn't exist)
      let branchData: any[] = [];
      try {
        const { data } = await supabase.from("branches").select("*");
        branchData = data || [];
      } catch (branchError) {
        console.warn("[SalesTransactionInsights] Branches table not found, using branch_id as fallback");
      }

      // Fetch cashiers
      let userdata: any[] = [];
      try {
        const { data } = await supabase.from("users").select("*").eq("role", "cashier");
        userdata = data || [];
      } catch (userError) {
        console.warn("[SalesTransactionInsights] Error fetching cashiers");
      }

      setBranches(branchData);
      setCashiers(userdata);

      // Enrich transaction data
      const enriched = (txData || []).map((tx: any) => ({
        ...tx,
        total_amount: tx.total || tx.total_amount || 0, // Use 'total' from DB
        payment_type: tx.payment_method || tx.payment_type || "cash", // Match DB column
        branch_name: branchData?.find((b: any) => b.id === tx.branch_id)?.name || tx.branch_id || "Unknown",
        cashier_name: userdata?.find((u: any) => u.id === tx.cashier_id)?.full_name || tx.cashier_id || "Unknown",
      }));

      setTransactions(enriched);
      console.log(`[SalesTransactionInsights] Loaded ${enriched.length} transactions with enriched data`);
    } catch (error) {
      console.error("[SalesTransactionInsights] Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const analytics = {
    totalSales: filteredTransactions.reduce((sum, t) => sum + (t.refund_flag ? 0 : (t.total_amount || 0)), 0),
    totalRefunds: filteredTransactions.filter((t) => t.refund_flag).length,
    totalVoids: filteredTransactions.filter((t) => t.void_flag).length,
    totalTransactions: filteredTransactions.length,
    completedCount: filteredTransactions.filter((t) => !t.refund_flag && !t.void_flag).length,
    suspiciousCount: filteredTransactions.filter((t) => (t.discount_amount || 0) > (t.total_amount || 0) * 0.5).length,
  };

  // Chart data - Daily sales
  const dailySalesData = Object.entries(
    filteredTransactions.reduce(
      (acc, t) => {
        const date = new Date(t.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + (t.refund_flag ? 0 : (t.total_amount || 0));
        return acc;
      },
      {} as Record<string, number>
    )
  )
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, amount]) => ({ date, amount }));

  // Chart data - Payment methods
  const paymentMethodData = [
    { name: "Cash", value: filteredTransactions.filter((t) => t.payment_type === "cash" && !t.refund_flag).length },
    { name: "M-Pesa", value: filteredTransactions.filter((t) => t.payment_type === "mpesa" && !t.refund_flag).length },
    { name: "Card", value: filteredTransactions.filter((t) => t.payment_type === "card" && !t.refund_flag).length },
  ].filter((item) => item.value > 0);

  // Export to Excel
  const exportToExcel = () => {
    // Simple CSV export using built-in string methods
    const headers = ["Transaction ID", "Branch", "Cashier", "Payment Type", "Amount", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.transaction_id,
      t.branch_name,
      t.cashier_name,
      (t.payment_type || "cash").toUpperCase(),
      `KES ${(t.total_amount || 0).toFixed(2)}`,
      t.void_flag ? "Voided" : t.refund_flag ? "Refunded" : "Completed",
      new Date(t.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = () => {
    const csv = [
      ["Transaction Report"],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ["Summary"],
      [`Total Sales: KES ${analytics.totalSales.toFixed(2)}`],
      [`Total Transactions: ${analytics.totalTransactions}`],
      [`Refunds: ${analytics.totalRefunds} | Voided: ${analytics.totalVoids}`],
      [],
      ["Transaction Details"],
      [
        "Transaction ID",
        "Branch",
        "Cashier",
        "Payment Type",
        "Amount",
        "Status",
        "Date & Time",
      ],
      ...filteredTransactions.slice(0, 100).map((t) => [
        t.transaction_id,
        t.branch_name,
        t.cashier_name,
        (t.payment_type || "cash").toUpperCase(),
        `KES ${(t.total_amount || 0).toFixed(2)}`,
        t.void_flag ? "Voided" : t.refund_flag ? "Refunded" : "Completed",
        new Date(t.created_at).toLocaleString(),
      ]),
    ];

    let csvContent = csv.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTransactionStatusBadge = (tx: Transaction) => {
    if (tx.void_flag) {
      return { color: COLORS.void, label: "Voided", icon: XCircle };
    }
    if (tx.refund_flag) {
      return { color: COLORS.refund, label: "Refunded", icon: RefreshCw };
    }
    const isSuspicious = (tx.discount_amount || 0) > tx.total_amount * 0.5;
    if (isSuspicious) {
      return { color: COLORS.suspicious, label: "Suspicious", icon: AlertCircle };
    }
    return { color: COLORS.completed, label: "Completed", icon: CheckCircle2 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-burgundy/10 animate-spin">
            <div className="h-8 w-8 rounded-full border-2 border-brand-burgundy border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  console.log('[SalesTransactionInsights] Loaded:', { transactionCount: transactions.length, filteredCount: filteredTransactions.length });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-3xl font-black text-gray-900">💳 Sales & Transaction Insights</h2>
        <p className="text-gray-600 font-semibold mt-2">Real-time transaction tracking with analytics and export</p>
      </motion.div>

      {/* Top Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: `KES ${(analytics.totalSales / 1000).toFixed(1)}K`, color: "bg-emerald-50" },
          { label: "Transactions", value: analytics.totalTransactions, color: "bg-blue-50" },
          { label: "Refunds", value: analytics.totalRefunds, color: "bg-orange-50" },
          { label: "Suspicious", value: analytics.suspiciousCount, color: "bg-red-50" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-xl p-4 border border-gray-200`}>
            <p className="text-xs font-semibold text-gray-600">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Sales Chart */}
        {dailySalesData.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Daily Sales Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => `KES ${(typeof value === 'number' ? value : 0).toFixed(0)}`} />
                <Line type="monotone" dataKey="amount" stroke={COLORS.cash} strokeWidth={2} dot={{ fill: COLORS.cash }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Methods Pie */}
        {paymentMethodData.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentMethodData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Filters & Controls */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="sticky top-24 z-30 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </h3>
            <button onClick={fetchData} className="text-xs font-bold text-brand-burgundy hover:bg-brand-burgundy/10 px-3 py-1.5 rounded-lg transition">
              <RefreshCw className="h-4 w-4 inline mr-1" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transaction..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy outline-none"
              />
            </div>

            {/* Branch */}
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy outline-none bg-white"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Cashier */}
            <select
              value={filters.cashier}
              onChange={(e) => setFilters({ ...filters, cashier: e.target.value })}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy outline-none bg-white"
            >
              <option value="all">All Cashiers</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>

            {/* Payment Type */}
            <select
              value={filters.paymentType}
              onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy outline-none bg-white"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy outline-none"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-burgundy outline-none"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={exportToExcel}
              className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> CSV Report
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transactions Display */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {isMobile ? (
          // Mobile Card View
          <div className="space-y-3">
            {filteredTransactions.map((tx, i) => {
              const status = getTransactionStatusBadge(tx);
              const Icon = status.icon;
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{tx.transaction_id}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                      <Icon className="h-3.5 w-3.5" style={{ color: status.color }} />
                      <span className="text-xs font-semibold text-gray-700">{status.label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="text-xs font-bold text-gray-900">{tx.branch_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cashier</p>
                      <p className="text-xs font-bold text-gray-900">{tx.cashier_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment</p>
                      <p className="text-xs font-bold text-gray-900 uppercase">{tx.payment_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-black text-gray-900">KES {tx.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Desktop Table View
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Transaction ID</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Branch</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Cashier</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Payment</th>
                    <th className="px-6 py-3 text-right font-bold text-gray-900">Amount</th>
                    <th className="px-6 py-3 text-center font-bold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((tx, i) => {
                    const status = getTransactionStatusBadge(tx);
                    const Icon = status.icon;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">#{tx.transaction_id}</td>
                        <td className="px-6 py-4 text-gray-700">{tx.branch_name}</td>
                        <td className="px-6 py-4 text-gray-700">{tx.cashier_name}</td>
                        <td className="px-6 py-4 text-xs font-bold uppercase">{tx.payment_type || "cash"}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">KES {(tx.total_amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-full bg-gray-100 w-fit mx-auto">
                            <Icon className="h-3.5 w-3.5" style={{ color: status.color }} />
                            <span className="text-xs font-semibold text-gray-700">{status.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 font-semibold">No transactions found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or check back after processing sales</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
