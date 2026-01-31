import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore, Role, User, Transaction, AuditLogEntry } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, summarizeTransactionsByDay } from "@/utils/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Scale,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Settings,
  ShoppingCart,
  FileText,
  DollarSign,
  PlusCircle,
  Trash2,
  Award
} from "lucide-react";
import { ProductManager } from "@/components/admin/ProductManager";

// --- Types & Interfaces ---

interface DashboardStat {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

// --- Components ---

interface SummaryCardProps {
  stat: DashboardStat;
  variant: "mint" | "blue" | "lavender" | "peach" | "white";
}

const VARIANTS = {
  mint: "bg-pastel-mint text-emerald-900",
  blue: "bg-pastel-blue text-blue-900",
  lavender: "bg-pastel-lavender text-purple-900",
  peach: "bg-pastel-peach text-orange-900",
  white: "bg-white border border-gray-100 text-brand-charcoal",
};

const ICON_VARIANTS = {
  mint: "bg-emerald-100/50 text-emerald-700",
  blue: "bg-blue-100/50 text-blue-700",
  lavender: "bg-purple-100/50 text-purple-700",
  peach: "bg-orange-100/50 text-orange-700",
  white: "bg-gray-50 text-brand-charcoal",
};

const SummaryCard = ({ stat, variant = "white" }: SummaryCardProps) => (
  <Card className={`border-none shadow-sm rounded-[20px] ${VARIANTS[variant]} transition-transform hover:scale-[1.02] duration-200`}>
    <CardContent className="p-6 flex items-start justify-between">
      <div className="space-y-1">
        <p className={`text-sm font-bold opacity-80 uppercase tracking-wide`}>{stat.label}</p>
        <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
        {stat.subtext && <p className="text-xs font-bold opacity-80 mt-1">{stat.subtext}</p>}
      </div>
      <div className={`p-3 rounded-full ${ICON_VARIANTS[variant]}`}>
        {stat.icon}
      </div>
    </CardContent>
  </Card>
);

export const AdminDashboard = () => {
  const {
    transactions,
    products,
    users,
    settings,
    auditLog,
    addUser,
    updateUserRole,
    deleteUser,
    updateSettings,
    currentUser,
  } = useAppStore();

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("cashier");
  const [newUserPassword, setNewUserPassword] = useState("");
  // --- Data Calculations ---
  // (Preserved existing logic)
  const today = new Date();
  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const dashboardData = useMemo(() => {
    const todayTxs = transactions.filter((tx) => isToday(tx.createdAt));

    const todaySales = todayTxs.reduce((sum, tx) => sum + tx.total, 0);
    const todayWeight = todayTxs.reduce((sum, tx) =>
      sum + tx.items.reduce((w, item) => w + item.weightKg, 0), 0
    );

    const availableStock = products
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + p.stockKg, 0);

    const lowStockItems = products.filter(
      (p) => p.isActive && p.stockKg <= p.lowStockThresholdKg
    );

    // Best selling cut today
    const salesByCut = new Map<string, number>();
    todayTxs.flatMap(tx => tx.items).forEach(item => {
      salesByCut.set(item.productName, (salesByCut.get(item.productName) || 0) + (item.pricePerKg * item.weightKg));
    });
    const bestSelling = [...salesByCut.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      todaySales,
      todayWeight,
      availableStock,
      lowStockCount: lowStockItems.length,
      txCount: todayTxs.length,
      bestSellingCut: bestSelling ? bestSelling[0] : "N/A",
      lowStockItems // Pass full list for potential display
    };
  }, [transactions, products]);

  // Charts
  const revenueByDay = useMemo(
    () => summarizeTransactionsByDay(transactions),
    [transactions]
  );

  const meatPerformance = useMemo(() => {
    const map = new Map<string, number>();
    // Aggregate by category for better high-level view
    transactions.flatMap(tx => tx.items).forEach(item => {
      // Find product to get category
      const product = products.find(p => p.id === item.productId);
      const category = product?.category || "Other";
      map.set(category, (map.get(category) || 0) + item.weightKg);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, products]);

  const stockDistribution = useMemo(() => {
    const map = new Map<string, number>();
    products.filter(p => p.isActive).forEach(p => {
      map.set(p.category, (map.get(p.category) || 0) + p.stockKg);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [products]);

  // Activity Feed (Merged & Sorted)
  const activityFeed = useMemo(() => {
    // Transform transactions to specific format
    const txActivities = transactions.map(tx => ({
      id: tx.id,
      type: 'sale',
      title: `Sale: ${formatCurrency(tx.total, settings)}`,
      desc: `${tx.items.length} items sold`,
      time: tx.createdAt,
      icon: <CreditCard className="h-3 w-3 text-emerald-400" />
    }));

    // Transform audit logs
    const logActivities = auditLog.map(log => ({
      id: log.id,
      type: 'system',
      title: log.action,
      desc: `by ${log.actorName}`,
      time: log.createdAt,
      icon: <Settings className="h-3 w-3 text-amber-400" />
    }));

    return [...txActivities, ...logActivities]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10); // Show recent 10
  }, [transactions, auditLog, settings]);

  const COLORS = ['#7A1E1E', '#C9A24D', '#1C1C1C', '#1E7F4E', '#E08A1E', '#8B0000'];

  // --- Handlers from Original Code ---
  const handleCreateUser = () => {
    if (!newUserName.trim() || !newUserPassword.trim()) {
      alert("Name and password are required.");
      return;
    }
    const user: User = {
      id: crypto.randomUUID(),
      name: newUserName.trim(),
      role: newUserRole,
    };
    addUser(user, currentUser?.id || "a1", newUserPassword);
    setNewUserName("");
    setNewUserPassword("");
  };

  const handleSettingsChange = (field: keyof typeof settings, value: any) => {
    updateSettings({ [field]: value }, "a1");
  };

  return (
    <div className="space-y-8 px-4 lg:px-8 py-6 lg:py-8 max-w-[1920px] mx-auto bg-brand-offwhite min-h-screen slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-brand-charcoal tracking-tighter">
            Business Overview
          </h1>
          <p className="mt-1 text-sm lg:text-base text-gray-500 font-medium">
            Real-time performance & administration
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-premium border border-gray-100">
          <Link to="/admin/wholesale">
            <Button variant="outline" className="rounded-xl border-none shadow-none hover:bg-gray-50 font-black text-[10px] uppercase tracking-widest px-4">
              Wholesale Desk
            </Button>
          </Link>
          <div className="h-4 w-[1px] bg-gray-200" />
          <Button variant="ghost" className="rounded-xl text-brand-burgundy font-black text-[10px] uppercase tracking-widest px-4">
            Custom Report
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          {
            label: "Today's Sales",
            value: formatCurrency(dashboardData.todaySales, settings),
            subtext: "+12.4% vs yesterday",
            icon: <TrendingUp className="h-6 w-6" />,
            variant: "mint" as const
          },
          {
            label: "Weight Sold",
            value: `${dashboardData.todayWeight.toFixed(1)} kg`,
            subtext: "Last 7 days volume",
            icon: <Scale className="h-6 w-6" />,
            variant: "blue" as const
          },
          {
            label: "Avg Transaction",
            value: formatCurrency(dashboardData.txCount > 0 ? dashboardData.todaySales / dashboardData.txCount : 0, settings),
            subtext: `${dashboardData.txCount} transactions`,
            icon: <CreditCard className="h-6 w-6" />,
            variant: "lavender" as const
          },
          {
            label: "Best Branch",
            value: "Shop 3",
            subtext: "Top performer",
            icon: <Award className="h-6 w-6" />,
            variant: "peach" as const
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
          >
            <SummaryCard stat={stat} variant={stat.variant} />
          </motion.div>
        ))}
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart: Sales Over Time */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[20px]">
          <CardHeader className="pt-8 px-8 pb-4">
            <CardTitle className="text-xl flex items-center gap-2 font-bold text-brand-charcoal">
              <TrendingUp className="h-5 w-5 text-brand-burgundy" />
              Sales Performance
            </CardTitle>
            <p className="text-sm font-medium text-gray-400">Revenue trend over time</p>
          </CardHeader>
          <CardContent className="h-96 px-6 pb-6">
            {revenueByDay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                No sales data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="hsl(var(--text-muted))" fontSize={12} tickLine={false} axisLine={false} dy={10} tick={{ fontWeight: 'bold' }} />
                  <YAxis stroke="hsl(var(--text-muted))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${settings.currency} ${v}`} dx={-10} tick={{ fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    formatter={(v) => [formatCurrency(Number(v), settings), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--brand-burgundy))" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: "#C9A24D", stroke: "#fff", strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Side Charts Group */}
        <div className="space-y-8">
          {/* Meat Cut Performance */}
          <Card className="border-none shadow-sm rounded-[20px]">
            <CardHeader className="pt-8 px-8 pb-2">
              <CardTitle className="text-lg font-bold text-brand-charcoal">Meat Cut Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-48 px-6 pb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={meatPerformance}>
                  <XAxis dataKey="name" stroke="hsl(var(--text-muted))" fontSize={11} tickLine={false} axisLine={false} dy={5} tick={{ fontWeight: 'bold' }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', radius: 8 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--brand-burgundy))" radius={[6, 6, 6, 6]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stock Distribution */}
          <Card className="border-none shadow-sm rounded-[20px]">
            <CardHeader className="pt-8 px-8 pb-2">
              <CardTitle className="text-lg font-bold text-brand-charcoal">Stock Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-48 px-6 pb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                  >
                    {stockDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Activity & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <Card className="md:col-span-2 border-none shadow-sm rounded-[20px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-xl flex items-center gap-2 font-bold text-brand-charcoal">
              <Activity className="h-5 w-5 text-brand-gold" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4">
              {activityFeed.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No recent activity recorded.</p>
              ) : (
                activityFeed.map((item, i) => (
                  <div key={`${item.type}-${item.id}-${i}`} className="flex items-start gap-5">
                    <div className="mt-1 p-3 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-brand-charcoal">{item.title}</p>
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-400 whitespace-nowrap ml-4">
                          {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & System Links */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-[20px]">
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-lg font-bold text-brand-charcoal">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-brand-burgundy/30 transition-all bg-white shadow-sm">
                <PlusCircle className="h-6 w-6 text-brand-burgundy" />
                <span className="text-xs font-bold text-[hsl(var(--text-secondary))]">Add Stock</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-brand-burgundy/30 transition-all bg-white shadow-sm">
                <DollarSign className="h-6 w-6 text-brand-gold" />
                <span className="text-xs font-bold text-[hsl(var(--text-secondary))]">Prices</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-brand-burgundy/30 transition-all bg-white shadow-sm">
                <FileText className="h-6 w-6 text-brand-charcoal" />
                <span className="text-xs font-bold text-[hsl(var(--text-secondary))]">Reports</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-brand-burgundy/30 transition-all bg-white shadow-sm">
                <Users className="h-6 w-6 text-brand-charcoal" />
                <span className="text-xs font-bold text-[hsl(var(--text-secondary))]">Staff</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[20px] bg-brand-charcoal text-white">
            <CardHeader className="pt-6 px-6 pb-2">
              <CardTitle className="text-base font-medium text-gray-200">System Health</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Products Active</span>
                <span className="font-bold text-white">{products.filter(p => p.isActive).length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Registered Users</span>
                <span className="font-bold text-white">{users.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">System Status</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-emerald-400 text-xs">Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 5. Legacy / Administration Sections */}
      <div className="mt-12 pt-8 border-t border-gray-200/60">
        <h2 className="text-2xl font-bold text-brand-charcoal mb-8 flex items-center gap-3">
          <Settings className="h-6 w-6 text-brand-burgundy" />
          System Administration
        </h2>

        <div className="mb-8">
          <ProductManager />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* User Management */}
          <Card className="border-none shadow-sm rounded-[20px]">
            <CardHeader className="pt-8 px-8">
              <CardTitle className="flex items-center gap-2 text-brand-charcoal font-bold">
                <Users className="h-5 w-5 text-gray-400" />
                User Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-8">
              {/* Add User Form - Improved Space & Responsiveness */}
              <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add New Staff Member</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Full Name</label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="h-12 text-sm bg-white border-gray-200 focus:border-brand-burgundy rounded-xl font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Security Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="h-12 text-sm bg-white border-gray-200 focus:border-brand-burgundy rounded-xl font-bold"
                    />
                  </div>
                  <div className="col-span-1 lg:col-span-3">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Role</label>
                    <select
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-brand-charcoal focus:border-brand-burgundy outline-none cursor-pointer"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as Role)}
                    >
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-span-1 lg:col-span-2 flex items-end">
                    <Button onClick={handleCreateUser} className="h-12 w-full rounded-xl bg-brand-burgundy hover:bg-red-900 text-white font-bold shadow-lg shadow-brand-burgundy/20">
                      <PlusCircle className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Staff Accounts</h3>
                <div className="max-h-[400px] overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-brand-charcoal">{u.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono tracking-wide">ID: {u.id.substring(0, 6)}...</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 focus:text-brand-charcoal focus:border-brand-burgundy outline-none cursor-pointer hover:border-gray-300"
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as Role, "a1")}
                          disabled={u.id === users.find(cu => cu.id === "a1")?.id /* In real app, check against auth context */}
                        >
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete user "${u.name}"? This action cannot be undone.`)) {
                              deleteUser(u.id, "a1");
                            }
                          }}
                          disabled={u.role === "admin" || u.id === "a1"} // Prevent deleting admins or self (hardcoded "a1" for demo context, ideally currentUser.id)
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          title={u.role === "admin" ? "Cannot delete admins" : "Delete user"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card className="border-none shadow-sm rounded-[20px]">
            <CardHeader className="pt-8 px-8">
              <CardTitle className="flex items-center gap-2 text-brand-charcoal font-bold">
                <Settings className="h-5 w-5 text-gray-400" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2 px-8 pb-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Currency Symbol</label>
                  <Input
                    className="h-12 w-32 bg-gray-50 border-transparent focus:bg-white focus:border-brand-burgundy rounded-xl text-center font-bold text-brand-charcoal"
                    value={settings.currency}
                    onChange={(e) => handleSettingsChange("currency", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Receipt Header</label>
                  <textarea
                    className="w-full h-28 rounded-xl border border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-brand-charcoal focus:bg-white focus:border-brand-burgundy outline-none resize-none transition-all"
                    value={settings.receiptHeader}
                    onChange={(e) => handleSettingsChange("receiptHeader", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <input
                    id="tax-enabled"
                    type="checkbox"
                    checked={settings.taxEnabled}
                    onChange={(e) => handleSettingsChange("taxEnabled", e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-brand-burgundy focus:ring-brand-burgundy cursor-pointer"
                  />
                  <label htmlFor="tax-enabled" className="text-sm font-bold text-brand-charcoal flex-1 cursor-pointer select-none">
                    Enable Tax Calculation
                  </label>
                  {settings.taxEnabled && (
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                      <Input
                        type="number"
                        className="h-8 w-16 text-xs bg-transparent border-none text-right font-bold focus-visible:ring-0 px-1"
                        value={settings.taxRatePercent}
                        onChange={(e) => handleSettingsChange("taxRatePercent", Number(e.target.value) || 0)}
                      />
                      <span className="text-xs text-gray-500 font-bold pr-1">%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Simplified Audit Log View within Settings */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">System Audit Trail</label>
                <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/30">
                  {auditLog.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      System logs will appear here.
                    </div>
                  ) : (
                    auditLog
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map((entry) => (
                        <div key={entry.id} className="border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-brand-charcoal">{entry.actorName}</span>
                            <Badge variant="outline" className="text-[9px] py-0 h-4 border-gray-200 text-gray-500">{entry.role}</Badge>
                          </div>
                          <div className="text-[11px] text-gray-600 mt-1 truncate font-medium" title={entry.action}>{entry.action}</div>
                          <div className="text-[9px] text-gray-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
};



