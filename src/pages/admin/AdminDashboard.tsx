import { useState } from "react";
import { BarChart3, ShoppingCart, TrendingUp, Sparkles, Wallet } from "lucide-react";
import { ShiftStockDashboard } from "./ShiftStockDashboard";
import { SalesRealTimeMonitor } from "@/components/admin/SalesRealTimeMonitor";
import { AnalyticsDashboard } from "@/pages/analytics/AnalyticsDashboard";
import { ProAnalyticsDashboard } from "@/pages/analytics/ProAnalyticsDashboard";
import { AdminExpensesDashboard } from "@/components/admin/AdminExpensesDashboard";

/**
 * Admin Dashboard - Main admin page with tabbed navigation
 */
export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "sales" | "analytics" | "pro-analytics" | "expenses">("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-0">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              DASHBOARD
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                activeTab === "sales"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              SALES & TRANSACTIONS
            </button>
            <button
              onClick={() => setActiveTab("pro-analytics")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                activeTab === "pro-analytics"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              PRO ANALYTICS
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                activeTab === "expenses"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wallet className="h-5 w-5" />
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <ShiftStockDashboard />
        </div>
        <div style={{ display: activeTab === "sales" ? "block" : "none" }}>
          <SalesRealTimeMonitor />
        </div>
        <div style={{ display: activeTab === "analytics" ? "block" : "none" }}>
          <AnalyticsDashboard />
        </div>
        <div style={{ display: activeTab === "pro-analytics" ? "block" : "none" }}>
          <ProAnalyticsDashboard />
        </div>
        <div style={{ display: activeTab === "expenses" ? "block" : "none" }}>
          <AdminExpensesDashboard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
