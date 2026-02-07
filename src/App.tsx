import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { supabase } from "@/utils/supabase";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ModernCashierDashboard } from "@/pages/cashier/ModernCashierDashboard";
import { CashierShiftWorkflow } from "@/pages/cashier/CashierShiftWorkflow";
import { ManagerDashboard } from "@/pages/manager/ManagerDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ShiftSummaryDashboard } from "@/pages/admin/ShiftSummaryDashboard";
import { AdminAnalyticsDashboard } from "@/pages/admin/AdminAnalyticsDashboard";
import { useAppStore } from "@/store/appStore";
import { useOfflineStore } from "@/store/offlineStore";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { registerServiceWorker, initInstallPrompt, addNetworkListener } from "@/utils/pwa";
import { syncOfflineQueue } from "@/utils/api";

const RequireRole = ({
  role,
  children,
}: {
  role: "cashier" | "manager" | "admin";
  children: JSX.Element;
}) => {
  const user = useAppStore((s) => s.currentUser);
  const activeShift = useAppStore((s) => s.activeShift);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Basic protection: send them to their own dashboard
    if (user.role === "cashier") return <Navigate to="/cashier" replace />;
    if (user.role === "manager") return <Navigate to="/manager" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
  }
  return children;
};

const RequireShift = ({ children }: { children: JSX.Element }) => {
  const activeShift = useAppStore((s) => s.activeShift);
  const user = useAppStore((s) => s.currentUser);
  
  // Redirect to shift page if cashier has no active shift
  if (user?.role === "cashier" && !activeShift) {
    return <Navigate to="/cashier/shift" replace />;
  }
  
  return children;
};

export const App = () => {
  const initialize = useAppStore((s) => s.initialize);
  const fetchProducts = useAppStore((s) => s.fetchProducts);
  const fetchUsers = useAppStore((s) => s.fetchUsers);
  const fetchTransactions = useAppStore((s) => s.fetchTransactions);
  const fetchShifts = useAppStore((s) => s.fetchShifts);
  const fetchPendingAdditions = useAppStore((s) => s.fetchPendingAdditions);
  const setOnline = useOfflineStore((s) => s.setOnline);

  useEffect(() => {
    // Register PWA Service Worker (production only)
    if (import.meta.env.PROD) {
      registerServiceWorker();
      // Initialize PWA install prompt
      initInstallPrompt();
    } else if ("serviceWorker" in navigator) {
      // Ensure dev HMR isn't interfered by a cached service worker
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }

    // Setup online/offline detection
    const removeListener = addNetworkListener(
      () => {
        console.log('[App] Network: ONLINE');
        setOnline(true);
        // Sync any queued offline requests
        syncOfflineQueue().catch(err => console.error('[App] Offline sync error:', err));
      },
      () => {
        console.log('[App] Network: OFFLINE');
        setOnline(false);
      }
    );

    return removeListener;
  }, [setOnline]);

  useEffect(() => {
    // Initial fetch of all data
    initialize().catch(err => console.error("Initial load failed:", err));

    // Subscribe to products
    const productsChannel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        console.log("Realtime: Products change detected", payload.eventType);
        fetchProducts();
      })
      .subscribe();

    // Subscribe to users
    const usersChannel = supabase
      .channel("users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, (payload) => {
        console.log("Realtime: Users change detected", payload.eventType);
        fetchUsers();
      })
      .subscribe();

    // Subscribe to transactions
    const transactionsChannel = supabase
      .channel("transactions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, (payload) => {
        console.log("Realtime: Transactions change detected", payload.eventType);
        fetchTransactions();
      })
      .subscribe();

    // Subscribe to shifts
    const shiftsChannel = supabase
      .channel("shifts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, (payload) => {
        console.log("Realtime: Shifts change detected", payload.eventType);
        fetchShifts();
      })
      .subscribe();

    // Subscribe to stock additions
    const additionsChannel = supabase
      .channel("additions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_additions" }, (payload) => {
        console.log("Realtime: Stock Additions change detected", payload.eventType);
        fetchPendingAdditions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(additionsChannel);
    };
  }, [initialize, fetchProducts, fetchUsers, fetchTransactions, fetchShifts, fetchPendingAdditions]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="butchery-pos-theme">
      <div className="fade-in">
        {/* PWA Offline Indicator & Install Prompt */}
        <OfflineIndicator />
        
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RootLayout />}>
            <Route
              path="/cashier"
              element={
                <RequireRole role="cashier">
                  <RequireShift>
                    <ModernCashierDashboard />
                  </RequireShift>
                </RequireRole>
              }
            />
            <Route
              path="/cashier/shift"
              element={
                <RequireRole role="cashier">
                  <CashierShiftWorkflow />
                </RequireRole>
              }
            />
            <Route
              path="/manager"
              element={
                <RequireRole role="manager">
                  <ManagerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/summary"
              element={
                <RequireRole role="admin">
                  <ShiftSummaryDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireRole role="admin">
                  <AdminAnalyticsDashboard />
                </RequireRole>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};
