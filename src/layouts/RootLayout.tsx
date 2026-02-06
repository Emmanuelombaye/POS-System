import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { LogOut, Store, Package, FileText, BarChart3, ShoppingCart, Receipt } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const RootLayout = () => {
  const user = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);

  const logout = useAppStore((s) => s.logout);
  const location = useLocation();

  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }



  return (
    <div className="flex min-h-screen flex-col bg-brand-offwhite text-brand-charcoal font-sans selection:bg-brand-burgundy/20">
      {/* Luxury Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-brand-charcoal px-6 py-4 shadow-md sm:px-8">
        <div className="flex items-center gap-4">
          {/* Brand Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-lg overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Eden Drop Butchery" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white leading-none">
              EDEN DROP 001
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-brand-gold mt-1">
              Premium Butchery
            </div>
          </div>
        </div>

        {/* Dynamic Navigation for Admins */}
        {user?.role === "admin" && (
          <nav className="hidden md:flex items-center gap-6 ml-12">
            <Link
              to="/admin"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/admin"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <Store className="h-4 w-4" />
              DASHBOARD
            </Link>
            <Link
              to="/admin/analytics"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/admin/analytics"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              ANALYTICS
            </Link>
            <Link
              to="/admin/summary"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/admin/summary"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <FileText className="h-4 w-4" />
              SUMMARY
            </Link>
          </nav>
        )}

        {/* Dynamic Navigation for Cashiers */}
        {user?.role === "cashier" && (
          <nav className="hidden md:flex items-center gap-6 ml-12">
            <Link
              to="/cashier"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/cashier"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <Store className="h-4 w-4" />
              SALES
            </Link>
            <Link
              to="/cashier/shift"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/cashier/shift"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <Package className="h-4 w-4" />
              SHIFT STOCK
            </Link>
          </nav>
        )}

        <div className="flex-1"></div>

        <div className="flex items-center gap-4">
          {/* User Profile Capsule */}
          <div className="hidden sm:flex items-center gap-3 rounded-full bg-white/5 px-4 py-1.5 border border-white/10 backdrop-blur-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white">{user?.name}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">{user?.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-brand-burgundy flex items-center justify-center text-xs text-white font-bold border-2 border-brand-charcoal">
              {user?.name.charAt(0)}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>

          <ThemeToggle />

          {user && (
            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              className="text-gray-400 hover:text-red-400 hover:bg-white/5"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-0 sm:p-0 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-[768px] grid-cols-5 px-2 py-2">
            {user.role === "cashier" ? (
              <>
                <Link
                  to="/cashier"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/cashier" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Store className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/cashier"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/cashier" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Cart
                </Link>
                <Link
                  to="/cashier"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/cashier" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Receipt className="h-5 w-5" />
                  Sales
                </Link>
                <Link
                  to="/cashier/shift"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/cashier/shift" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  Inventory
                </Link>
                <Link
                  to="/cashier/shift"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/cashier/shift" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  Reports
                </Link>
              </>
            ) : user.role === "admin" ? (
              <>
                <Link
                  to="/admin"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/admin" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Store className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/admin"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/admin" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Receipt className="h-5 w-5" />
                  Transactions
                </Link>
                <Link
                  to="/admin"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/admin" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Package className="h-5 w-5" />
                  Inventory
                </Link>
                <Link
                  to="/admin/analytics"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/admin/analytics" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  Reports
                </Link>
                <Link
                  to="/admin/summary"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/admin/summary" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  Summary
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/manager"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/manager" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <Store className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/manager"
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider ${
                    location.pathname === "/manager" ? "text-brand-burgundy" : "text-gray-500"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  Reports
                </Link>
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider text-gray-300">
                  <Receipt className="h-5 w-5" />
                  Sales
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider text-gray-300">
                  <Package className="h-5 w-5" />
                  Inventory
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-wider text-gray-300">
                  <FileText className="h-5 w-5" />
                  Summary
                </div>
              </>
            )}
          </div>
        </nav>
      )}
    </div>
  );
};

