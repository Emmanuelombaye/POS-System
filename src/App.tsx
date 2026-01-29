import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { CashierDashboard } from "@/pages/cashier/CashierDashboard";
import { ManagerDashboard } from "@/pages/manager/ManagerDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
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
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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
    </ThemeProvider>
  );
};

