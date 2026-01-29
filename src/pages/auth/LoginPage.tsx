import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const LoginPage = () => {
  const users = useAppStore((s) => s.users);
  const login = useAppStore((s) => s.login);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedUserId) return;
    // In a real backend this would validate PIN; here it's just a UI placeholder
    login(selectedUserId);
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;
    if (user.role === "cashier") navigate("/cashier");
    if (user.role === "manager") navigate("/manager");
    if (user.role === "admin") navigate("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-3 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full max-w-4xl gap-6 sm:gap-8 md:grid-cols-[1.1fr,0.9fr] items-center"
      >
        <div className="space-y-6 hidden sm:block">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Eden Top
            </h1>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Fast, focused point-of-sale for busy butcheries. Optimised for quick weights,
              clean receipts, and clear roles for your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <Badge>Cashier-first workflow</Badge>
            <Badge variant="outline">Live stock tracking</Badge>
            <Badge variant="success">Manager approvals</Badge>
            <Badge variant="warning">Audit ready</Badge>
          </div>
        </div>

        <Card className="border-red-900/40 bg-slate-950/90 shadow-2xl shadow-red-900/30 w-full">
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            <div className="mb-2">
              <h2 className="text-sm sm:text-base font-semibold text-slate-50">
                Sign in to start selling
              </h2>
              <p className="text-xs text-slate-400">
                Tap your user and enter PIN. Roles control what you can see and do.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex flex-col items-start rounded-lg border px-2 sm:px-3 py-2 text-left text-[10px] sm:text-xs transition ${
                    selectedUserId === user.id
                      ? "border-red-500 bg-red-900/40"
                      : "border-slate-700 bg-slate-900/60 hover:border-red-600 hover:bg-slate-900"
                  }`}
                >
                  <span className="font-medium text-slate-50 text-[11px] sm:text-sm">{user.name}</span>
                  <span className="mt-0.5 text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] sm:text-xs font-medium text-slate-300">
                PIN (demo only, not validated)
              </label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-base sm:text-lg tracking-[0.4em] h-10 sm:h-11"
                placeholder="••••"
              />
            </div>

            <Button
              className="mt-2 h-10 sm:h-11 w-full text-xs sm:text-sm font-semibold tracking-wide"
              disabled={!selectedUserId}
              onClick={handleLogin}
            >
              Enter POS
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

