import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Moon, SunMedium, LogOut, Store, Package, ClipboardList } from "lucide-react";
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-burgundy to-red-900 shadow-lg text-white font-bold text-xl shadow-red-900/20">
            <span>E</span>
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white leading-none">
              EDEN TOP
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
              to="/admin/wholesale"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/admin/wholesale"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <Package className="h-4 w-4" />
              WHOLESALE
            </Link>
            <Link
              to="/admin/reconciliation"
              className={`text-sm font-black tracking-widest transition-colors flex items-center gap-2 ${location.pathname === "/admin/reconciliation"
                ? "text-brand-gold"
                : "text-gray-400 hover:text-white"
                }`}
            >
              <ClipboardList className="h-4 w-4" />
              RECONCILIATION
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
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-0 sm:p-0">
        <Outlet />
      </main>
    </div>
  );
};

