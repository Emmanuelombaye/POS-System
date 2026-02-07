import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Menu,
  X,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { api } from "@/utils/api";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { BranchManagement } from "@/components/admin/BranchManagement";
import { ProductManager } from "@/components/admin/ProductManager";
import { StockManagement } from "@/components/stock/StockManagement";
import { ClosedShiftsView } from "@/components/admin/ClosedShiftsView";
import { AdminAIAssistant } from "@/components/admin/AdminAIAssistant";
import { SalesTransactionInsights } from "@/components/admin/SalesTransactionInsights";
import { AdminExpensesDashboard } from "@/components/admin/AdminExpensesDashboard";
import { WastageReport } from "@/components/admin/WastageReport";
import { DailyReconciliation } from "@/components/admin/DailyReconciliation";
import { CashierKPIs } from "@/components/admin/CashierKPIs";
import { StockAlerts } from "@/components/admin/StockAlerts";
import { StockAdjustments } from "@/components/admin/StockAdjustments";

type Tab =
  | "overview"
  | "users"
  | "branches"
  | "products"
  | "sales"
  | "analytics"
  | "expenses"
  | "wastage"
  | "reconciliation"
  | "cashier-kpis"
  | "stock-alerts"
  | "stock-adjustments"
  | "settings"
  | "audit";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "branches", label: "Branches", icon: Building2 },
  { id: "products", label: "Products", icon: Package },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "expenses", label: "Expenses", icon: TrendingDown },
  { id: "wastage", label: "Wastage", icon: AlertTriangle },
  { id: "reconciliation", label: "Reconciliation", icon: CheckCircle },
  { id: "cashier-kpis", label: "Cashier KPIs", icon: Users },
  { id: "stock-alerts", label: "Alerts", icon: AlertCircle },
  { id: "stock-adjustments", label: "Adjustments", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "audit", label: "Audit Logs", icon: Shield },
] as const;

export const ModernAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 relative">
      {/* AI Assistant */}
      <AdminAIAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />

      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-brand-burgundy to-red-600 border-b-4 border-brand-burgundy sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 md:gap-3 flex-1">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-white shadow-lg flex-shrink-0">
                <span className="text-brand-burgundy font-black text-lg md:text-xl">ED</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-black text-white truncate">Admin Center</h1>
                <p className="text-xs font-semibold text-white/80 hidden sm:block">System Control</p>
              </div>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTabClick(tab.id as Tab)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-white text-brand-burgundy shadow-lg"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* System Status */}
            <div className="hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl mx-4">
              <div className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </div>
              <span className="text-xs font-bold text-white">Online</span>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-white/20 transition-colors"
              title={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </motion.button>
          </div>

          {/* Mobile Menu - Slides Down */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isMobileMenuOpen ? 1 : 0,
              height: isMobileMenuOpen ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden mt-4 border-t border-white/20"
          >
            <div className="pt-3 pb-2 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabClick(tab.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                      isActive
                        ? "bg-white text-brand-burgundy shadow-lg"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-left flex-1">{tab.label}</span>
                    {isActive && (
                      <div className="h-2.5 w-2.5 rounded-full bg-white" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1920px] mx-auto p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <AdminUserManagement />}
          {activeTab === "branches" && <BranchManagement />}
          {activeTab === "products" && <ProductManager />}
          {activeTab === "sales" && <SalesTransactionInsights />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "expenses" && <AdminExpensesDashboard />}
          {activeTab === "wastage" && <WastageReport />}
          {activeTab === "reconciliation" && <DailyReconciliation />}
          {activeTab === "cashier-kpis" && <CashierKPIs />}
          {activeTab === "stock-alerts" && <StockAlerts />}
          {activeTab === "stock-adjustments" && <StockAdjustments />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "audit" && <AuditTab />}
        </motion.div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => {
  const { users, products, transactions } = useAppStore();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeBranches: 0,
    systemUsers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    const calculateStats = () => {
      // Calculate total revenue (MTD)
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthTransactions = transactions.filter((t: any) => {
        const transDate = new Date(t.created_at || new Date());
        return transDate >= monthStart;
      });
      const totalRevenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      // Get user counts by role
      const usersByRole = users.reduce((acc: any, u: any) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});

      // Count low stock products (assuming low stock threshold is 5kg or less)
      const lowStockCount = products.filter((p: any) => p.stock_kg <= 5).length;

      setStats({
        totalRevenue: Math.round(totalRevenue),
        activeBranches: 3, // Fixed - would need separate API call
        systemUsers: users.length,
        totalProducts: products.length,
        lowStockProducts: lowStockCount,
      });
    };

    calculateStats();
  }, [users, products, transactions]);

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const statCards = [
    {
      label: "Total Revenue (MTD)",
      value: formatCurrency(stats.totalRevenue),
      change: stats.totalRevenue > 0 ? "This month" : "No sales yet",
      icon: <FileText className="h-6 w-6" />,
      color: "emerald",
    },
    {
      label: "Active Branches",
      value: stats.activeBranches.toString(),
      change: "All operational",
      icon: <Building2 className="h-6 w-6" />,
      color: "blue",
    },
    {
      label: "System Users",
      value: stats.systemUsers.toString(),
      change: `${users.filter((u: any) => u.role === "cashier").length} Cashiers`,
      icon: <Users className="h-6 w-6" />,
      color: "purple",
    },
    {
      label: "Products",
      value: stats.totalProducts.toString(),
      change: `${stats.lowStockProducts} Low Stock`,
      icon: <Package className="h-6 w-6" />,
      color: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">System Overview</h2>
        <p className="text-gray-500 font-semibold">Real-time system metrics and analytics</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-${stat.color}-100 rounded-xl`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            <p className="text-sm font-semibold text-gray-600 mt-2">{stat.change}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <h3 className="font-black text-xl text-gray-900 mb-2">Recent Activity</h3>
          <div className="space-y-3">
            {transactions.slice(-2).map((t: any, idx: number) => (
              <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <p className="font-bold text-gray-900">
                  {t.type === "sale" ? "Sale recorded" : "Transaction"}
                </p>
                <p className="text-gray-500 font-semibold">
                  {new Date(t.created_at || new Date()).toLocaleDateString()}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-sm">No recent transactions</p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <h3 className="font-black text-xl text-amber-900 mb-2">Alerts</h3>
          <div className="space-y-3">
            {stats.lowStockProducts > 0 ? (
              <div className="text-sm">
                <p className="font-bold text-amber-900">
                  {stats.lowStockProducts} Products Low Stock
                </p>
                <p className="text-amber-700 font-semibold">Requires attention</p>
              </div>
            ) : (
              <p className="text-amber-700 font-semibold">All products well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sales Tab Component
const SalesTab = () => {
  const [viewMode, setViewMode] = useState<"transactions" | "stock">("transactions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-gray-900">📊 Sales & Transactions</h2>
        <p className="text-gray-600 font-semibold mt-2">
          Real-time stock tracking from opening to closing with variance analysis
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode("transactions")}
          className={`px-6 py-3 font-bold border-b-2 transition-all ${
            viewMode === "transactions"
              ? "text-brand-burgundy border-brand-burgundy"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          💳 Closed Shifts & Variance
        </button>
        <button
          onClick={() => setViewMode("stock")}
          className={`px-6 py-3 font-bold border-b-2 transition-all ${
            viewMode === "stock"
              ? "text-brand-burgundy border-brand-burgundy"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          📦 Stock Management
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {viewMode === "transactions" ? (
          <ClosedShiftsView />
        ) : (
          <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
            <StockManagement />
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Analytics Tab Component  
const AnalyticsTab = () => {
  return <AdminAnalyticsDashboard />;
};

// Settings Tab Component
const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">System Settings</h2>
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
        <p className="text-gray-500 font-semibold">Settings panel coming soon...</p>
      </div>
    </div>
  );
};

// Audit Tab Component
const AuditTab = () => {
  const { auditLog } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900">Audit & Security Logs</h2>
        <p className="text-gray-500 font-semibold">System activity tracking and security events</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actor</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Role</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.length > 0 ? (
                auditLog.slice(-20).map((log: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.actorName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        log.role === "admin" ? "bg-red-100 text-red-700" :
                        log.role === "manager" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {log.role}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-semibold">
                    No audit logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
