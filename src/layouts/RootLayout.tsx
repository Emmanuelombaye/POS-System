import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Moon, SunMedium } from "lucide-react";

export const RootLayout = () => {
  const user = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const logout = useAppStore((s) => s.logout);
  const location = useLocation();

  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  const toggleTheme = () => {
    updateSettings(
      { theme: settings.theme === "dark" ? "light" : "dark" },
      user?.id ?? "system"
    );
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="flex flex-col gap-2 items-start sm:items-center sm:justify-between border-b border-slate-800 bg-slate-950/95 px-3 py-2 sm:flex-row sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700 text-sm sm:text-lg font-bold">
            <span>B</span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold tracking-wide">
              Eden Top
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400">
              {user ? `${user.name} • ${user.role.toUpperCase()}` : "Not signed in"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="icon"
            variant="outline"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            {settings.theme === "dark" ? (
              <SunMedium className="h-3 w-3 sm:h-4 sm:w-4 text-amber-300" />
            ) : (
              <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-200" />
            )}
          </Button>
          {user && (
            <Button size="sm" variant="ghost" onClick={logout} className="text-[11px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
              Logout
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

