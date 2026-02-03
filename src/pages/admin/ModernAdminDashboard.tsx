import { useState } from "react";
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
} from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { BranchManagement } from "@/components/admin/BranchManagement";
import { ProductManager } from "@/components/admin/ProductManager";
import { StockManagement } from "@/components/stock/StockManagement";
import { AdminAIAssistant } from "@/components/admin/AdminAIAssistant";

type Tab =
  | "overview"
  | "users"
  | "branches"
  | "products"
  | "sales"
  | "analytics"
  | "settings"
  | "audit";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "branches", label: "Branches", icon: Building2 },
  { id: "products", label: "Products", icon: Package },
  { id: "sales", label: "Sales", icon: ShoppingCart },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "audit", label: "Audit Logs", icon: Shield },
] as const;

export const ModernAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 relative">
      {/* AI Assistant */}
      <AdminAIAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-burgundy to-red-600 shadow-lg">
                <span className="text-white font-black text-xl">E</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">Eden Top Admin</h1>
                <p className="text-xs font-semibold text-gray-500">Control Panel</p>
              </div>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-sm font-bold text-emerald-700">System Online</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-brand-burgundy to-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-brand-burgundy to-red-600 rounded-xl -z-10"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
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
          {activeTab === "users" && <UserManagement />}
          {activeTab === "branches" && <BranchManagement />}
          {activeTab === "products" && <ProductManager />}
          {activeTab === "sales" && <SalesTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "audit" && <AuditTab />}
        </motion.div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">System Overview</h2>
        <p className="text-gray-500 font-semibold">Welcome to your admin control panel</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Revenue (MTD)",
            value: "KES 7,500,000",
            change: "+12.5%",
            icon: <FileText className="h-6 w-6" />,
            color: "emerald",
          },
          {
            label: "Active Branches",
            value: "3",
            change: "All operational",
            icon: <Building2 className="h-6 w-6" />,
            color: "blue",
          },
          {
            label: "System Users",
            value: "15",
            change: "5 Cashiers, 3 Managers",
            icon: <Users className="h-6 w-6" />,
            color: "purple",
          },
          {
            label: "Products",
            value: "135",
            change: "12 Low Stock",
            icon: <Package className="h-6 w-6" />,
            color: "amber",
          },
        ].map((stat, idx) => (
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
            <div className="text-sm">
              <p className="font-bold text-gray-900">New user added</p>
              <p className="text-gray-500 font-semibold">5 minutes ago</p>
            </div>
            <div className="text-sm">
              <p className="font-bold text-gray-900">Product updated</p>
              <p className="text-gray-500 font-semibold">1 hour ago</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <h3 className="font-black text-xl text-amber-900 mb-2">Alerts</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-bold text-amber-900">12 Products Low Stock</p>
              <p className="text-amber-700 font-semibold">Requires attention</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sales Tab Component
const SalesTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-gray-900">Sales & Transactions</h2>
        <p className="text-gray-500 font-semibold">
          Stock management integrated for real-time opening, added, sold, and closing stock tracking.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
        <StockManagement />
      </div>
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
