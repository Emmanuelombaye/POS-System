import { useState } from "react";
import { BarChart3, ShoppingCart, TrendingUp, Sparkles, Wallet } from "lucide-react";
import { ShiftStockDashboard } from "./ShiftStockDashboard";
import { SalesRealTimeMonitor } from "@/components/admin/SalesRealTimeMonitor";
import { AnalyticsDashboard } from "@/pages/analytics/AnalyticsDashboard";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";
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
        <div className="max-w-[1920px] mx-auto">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === "dashboard"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">DASHBOARD</span>
              <span className="sm:hidden">DASH</span>
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === "sales"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden md:inline">SALES & TRANSACTIONS</span>
              <span className="md:hidden">SALES</span>
            </button>
            <button
              onClick={() => setActiveTab("pro-analytics")}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === "pro-analytics"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden lg:inline">PRO ANALYTICS</span>
              <span className="lg:hidden">ANALYTICS</span>
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-4 font-bold text-xs md:text-sm border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === "expenses"
                  ? "border-brand-burgundy text-brand-burgundy bg-gradient-to-b from-brand-burgundy/5 to-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Wallet className="h-4 w-4 md:h-5 md:w-5" />
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
          <AdminAnalyticsDashboard />
        </div>
        <div style={{ display: activeTab === "expenses" ? "block" : "none" }}>
          <AdminExpensesDashboard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
