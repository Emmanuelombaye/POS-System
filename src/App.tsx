import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { supabase } from "@/utils/supabase";
import { LoginPage } from "@/pages/auth/LoginPage";
import { CashierDashboard } from "@/pages/cashier/CashierDashboard";
import { ShiftStock } from "@/pages/cashier/ShiftStock";
import { ManagerDashboard } from "@/pages/manager/ManagerDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ShiftReconciliation } from "@/pages/admin/ShiftReconciliation";
import { WholesaleDesk } from "@/components/wholesale/WholesaleDesk";
import { useAppStore } from "@/store/appStore";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const RequireRole = ({
  role,
  children,
}: {
  role: "cashier" | "manager" | "admin";
  children: JSX.Element;
}) => {
  const user = useAppStore((s) => s.currentUser);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Basic protection: send them to their own dashboard
    if (user.role === "cashier") return <Navigate to="/cashier" replace />;
    if (user.role === "manager") return <Navigate to="/manager" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RootLayout />}>
            <Route
              path="/cashier"
              element={
                <RequireRole role="cashier">
                  <CashierDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/cashier/shift"
              element={
                <RequireRole role="cashier">
                  <ShiftStock />
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
              path="/admin/reconciliation"
              element={
                <RequireRole role="admin">
                  <ShiftReconciliation />
                </RequireRole>
              }
            />
            <Route
              path="/admin/wholesale"
              element={
                <RequireRole role="admin">
                  <WholesaleDesk />
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
