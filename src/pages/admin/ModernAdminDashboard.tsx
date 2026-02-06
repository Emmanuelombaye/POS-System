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

type Tab =
  | "overview"
  | "users"
  | "branches"
  | "products"
  | "sales"
  | "analytics"
  | "expenses"
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-burgundy to-red-600 shadow-lg flex-shrink-0">
                <span className="text-white font-black text-lg md:text-xl">E</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-black text-gray-900 truncate">Eden Drop 001 Admin</h1>
                <p className="text-xs font-semibold text-gray-500 hidden sm:block">Control Panel</p>
              </div>
            </div>

            {/* System Status & Menu */}
            <div className="flex items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 md:px-4 py-2 rounded-xl">
                <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-xs md:text-sm font-bold text-emerald-700">Online</span>
              </div>

              {/* No menu needed - all tabs visible */}
            </div>
          </div>

          {/* Desktop Tab Navigation - Always Visible, Wrapping */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 mt-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-lg font-bold text-xs transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-brand-burgundy to-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={tab.label}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate text-center text-xs">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-brand-burgundy to-red-600 rounded-lg -z-10"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Mobile Menu Button - Only for visual indicator */}
          {/* Removed - tabs are now always visible in grid */}
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
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">Analytics & Reports</h2>
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
        <p className="text-gray-500 font-semibold">Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
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
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">Audit & Security Logs</h2>
      <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
        <p className="text-gray-500 font-semibold">Audit logs coming soon...</p>
      </div>
    </div>
  );
};
