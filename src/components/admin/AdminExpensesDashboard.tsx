import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabase";
import { api } from "@/utils/api";
import { TrendingDown, CheckCircle, Clock, XCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { formatCurrency } from "@/utils/format";

interface ExpenseSummary {
  id: string;
  shift_id: string;
  cashier_id: string;
  cashier_name?: string;
  cashier?: { name?: string; email?: string };
  shift?: { id?: string; shift_date?: string; status?: string };
  branch_id: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  approved?: boolean;
  approved_by_admin?: boolean;
  created_at: string;
}

export const AdminExpensesDashboard = () => {
  const { currentBranch, settings } = useAppStore();
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState<"day" | "week" | "month" | "custom">("week");
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDay, setSelectedDay] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [actionLoading, setActionLoading] = useState<Record<string, "approve" | "reject" | null>>({});
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("eden-drop-rejected-expenses");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch (_err) {
      return new Set<string>();
    }
  });

  const persistRejectedIds = (next: Set<string>) => {
    try {
      localStorage.setItem("eden-drop-rejected-expenses", JSON.stringify(Array.from(next)));
    } catch (_err) {
      // ignore storage errors
    }
  };

  const range = useMemo(() => {
    if (dateFilter === "day") {
      return { start: selectedDay, end: selectedDay };
    }
    if (dateFilter === "custom") {
      const start = customStart || today;
      const end = customEnd || start;
      return { start, end };
    }
    const end = today;
    const startDate = new Date();
    if (dateFilter === "week") startDate.setDate(startDate.getDate() - 6);
    if (dateFilter === "month") startDate.setDate(startDate.getDate() - 29);
    const start = startDate.toISOString().split("T")[0];
    return { start, end };
  }, [dateFilter, selectedDay, customStart, customEnd, today]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get("/api/expenses", {
        branch_id: currentBranch || undefined,
        start_date: range.start,
        end_date: range.end,
        page,
        limit,
      });

      setExpenses(data.expenses || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      const message = (err as Error).message || "Failed to load expenses";
      setError(message);
      console.error("[AdminExpensesDashboard] Error fetching:", err);
    } finally {
      setLoading(false);
    }
  }, [currentBranch, range.end, range.start, page, limit]);

  // Fetch when filters/pagination change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Subscribe to real-time updates
  useEffect(() => {

    const channel = supabase
      .channel("admin-expenses")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload) => {
          console.log("[AdminExpensesDashboard] Real-time update:", payload.eventType);
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchExpenses]);

  const approveExpense = async (id: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "approve" }));
      await api.patch(`/api/expenses/${id}`, { approved: true });
      setRejectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        persistRejectedIds(next);
        return next;
      });
      fetchExpenses();
    } catch (error) {
      alert("Failed to approve expense: " + (error as Error).message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const rejectExpense = async (id: string) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "reject" }));
      await api.patch(`/api/expenses/${id}`, { approved: false });
      setRejectedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        persistRejectedIds(next);
        return next;
      });
      fetchExpenses();
    } catch (error) {
      alert("Failed to reject expense: " + (error as Error).message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingDown className="text-red-500" size={32} />
          Expenses Management
        </h1>
        <p className="text-gray-600 mt-2">Track and manage shift expenses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {(["day", "week", "month", "custom"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setDateFilter(filter);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  dateFilter === filter
                    ? "bg-brand-burgundy text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dateFilter === "day" && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => {
                    setSelectedDay(e.target.value || today);
                    setPage(1);
                  }}
                  max={today}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            )}
            {dateFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value || today);
                    setPage(1);
                  }}
                  max={today}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value || today);
                    setPage(1);
                  }}
                  max={today}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Rows</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Showing {range.start} to {range.end}
        </div>
      </div>

      {/* Expenses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Expenses</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading expenses...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : expenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No expenses found for this range</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cashier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount (Cash / MPESA)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Shift ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  (() => {
                    const isApproved = expense.approved ?? expense.approved_by_admin ?? false;
                    const isRejected = rejectedIds.has(expense.id);
                    const status = isApproved ? "approved" : isRejected ? "rejected" : "pending";
                    const cashierName = expense.cashier?.name || expense.cashier_name || expense.cashier_id;
                    return (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(expense.created_at).toLocaleDateString()} {new Date(expense.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cashierName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 min-w-[240px]">
                      <div className="font-semibold text-gray-900">{expense.category}</div>
                      <div className="text-xs text-gray-500">{expense.description || "No description"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatCurrency(expense.amount, settings)}
                      <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        expense.payment_method === "cash" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {expense.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {expense.shift_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status === "approved" && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle size={14} /> Approved
                        </span>
                      )}
                      {status === "pending" && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                      {status === "rejected" && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1 w-fit">
                          <XCircle size={14} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {status !== "approved" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveExpense(expense.id)}
                            disabled={actionLoading[expense.id] === "approve"}
                            className="text-xs px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-60"
                          >
                            {actionLoading[expense.id] === "approve" ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => rejectExpense(expense.id)}
                            disabled={actionLoading[expense.id] === "reject"}
                            className="text-xs px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-60"
                          >
                            {actionLoading[expense.id] === "reject" ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          Page {page} of {totalPages} • {totalCount} records
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
