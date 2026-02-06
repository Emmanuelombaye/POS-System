import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  PieChart,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ExpenseSummary {
  totalExpenses: number;
  cashExpenses: number;
  mpesaExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  expenseCount: number;
  averageExpense: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

interface DailyData {
  date: string;
  amount: number;
  count: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  approved: boolean;
  created_at: string;
  cashier?: { name: string };
}

const COLORS = ["#8B1538", "#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

export const ExpenseAnalytics = () => {
  const { token, currentBranch, settings } = useAppStore();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("week");

  const loadExpenseAnalytics = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      if (dateRange === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setDate(endDate.getDate() - 30);
      }

      const params = new URLSearchParams({
        branch_id: currentBranch || "",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      const response = await fetch(
        `http://localhost:4000/api/expenses/analytics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch expense analytics");

      const data = await response.json();
      
      setSummary(data.summary);
      setCategoryData(data.categoryData || []);
      setDailyData(data.dailyData || []);
      setRecentExpenses(data.recentExpenses || []);
      
      console.log("[EXPENSE_ANALYTICS] Data loaded:", data);
    } catch (error) {
      console.error("[EXPENSE_ANALYTICS] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenseAnalytics();
  }, [token, dateRange, currentBranch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <Wallet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No expense data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Expense Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Track and analyze business expenses
          </p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {(["today", "week", "month"] as const).map((range) => (
            <Button
              key={range}
              onClick={() => setDateRange(range)}
              variant={dateRange === range ? "default" : "ghost"}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg ${
                dateRange === range
                  ? "bg-brand-burgundy text-white"
                  : "text-gray-600"
              }`}
            >
              {range === "today" ? "Today" : range === "week" ? "7 Days" : "30 Days"}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-brand-burgundy" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">
                {formatCurrency(summary.totalExpenses, settings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.expenseCount} transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Cash Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">
                {formatCurrency(summary.cashExpenses, settings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {((summary.cashExpenses / summary.totalExpenses) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">
                {formatCurrency(summary.approvedExpenses, settings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Verified expenses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-lg border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-amber-600">
                {formatCurrency(summary.pendingExpenses, settings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
              <PieChart className="h-5 w-5 text-brand-burgundy" />
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }: any) => 
                      `${category}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value, settings)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No category data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
              <TrendingUp className="h-5 w-5 text-brand-burgundy" />
              Daily Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, settings)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8B1538"
                    strokeWidth={3}
                    dot={{ fill: "#8B1538", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No daily data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses Table */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
            <Receipt className="h-5 w-5 text-brand-burgundy" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Cashier
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Payment
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      {expense.cashier?.name || "Unknown"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {expense.description || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        expense.payment_method === "cash"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {expense.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(expense.amount, settings)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {expense.approved ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentExpenses.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No recent expenses
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
