import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, Zap } from "lucide-react";

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
    <div className="flex min-h-screen bg-brand-offwhite font-sans text-brand-charcoal">

      {/* Left: Brand Presentation */}
      <div className="hidden lg:flex w-5/12 relative bg-brand-charcoal flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-charcoal to-[#000000] z-0" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-burgundy rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-gold rounded-full blur-3xl opacity-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-burgundy to-red-900 shadow-xl text-white font-bold text-2xl">
              E
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">EDEN TOP</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Everything<br />
            <span className="text-brand-burgundy">Premium</span>.
          </h1>
          <p className="text-gray-400 text-lg max-w-sm">
            The professional point-of-sale system designed for high-volume, quality-focused butcheries.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-white/90">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
              <Zap className="h-5 w-5 text-brand-gold" />
            </div>
            <div>
              <p className="font-semibold">Fast Workflows</p>
              <p className="text-sm text-gray-400">Optimized for quick weight entry</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-brand-gold" />
            </div>
            <div>
              <p className="font-semibold">Total Control</p>
              <p className="text-sm text-gray-400">Live inventory & audit trails</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500">
          © 2026 Eden Top Butchery Systems. v2.0
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative bg-brand-offwhite">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-brand-charcoal">Welcome back</h2>
            <p className="mt-2 text-gray-500">Please select your profile to sign in.</p>
          </div>

          <Card className="border-none shadow-xl bg-white p-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 mb-6">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${selectedUserId === user.id
                        ? "border-brand-burgundy bg-brand-burgundy/5 ring-1 ring-brand-burgundy"
                        : "border-gray-100 hover:border-brand-burgundy/30 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${selectedUserId === user.id ? "bg-brand-burgundy text-white" : "bg-gray-100 text-gray-600 group-hover:bg-white"
                        }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold text-sm ${selectedUserId === user.id ? "text-brand-burgundy" : "text-brand-charcoal"}`}>
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">{user.role}</div>
                      </div>
                    </div>
                    {selectedUserId === user.id && <Check className="h-5 w-5 text-brand-burgundy" />}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                    Security PIN
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="text-center text-2xl tracking-[0.5em] h-14 font-mono text-brand-charcoal placeholder:text-gray-200 bg-gray-50 focus:bg-white"
                    placeholder="••••"
                    maxLength={4}
                  />
                </div>

                <Button
                  className="w-full h-12 text-base shadow-lg shadow-brand-burgundy/20"
                  disabled={!selectedUserId}
                  onClick={handleLogin}
                >
                  Enter POS Terminal
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              System Online
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-brand-gold"></div>
              Database Synced
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

