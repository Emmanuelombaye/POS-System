import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, ShieldCheck, Zap, Lock, User, AlertCircle } from "lucide-react";
import { BranchSelector, type BranchId } from "@/components/branch/BranchSelector";

// New unique passwords per role
const CREDENTIALS_BY_ROLE = {
  admin: "@Admin001Eden",
  manager: "@Manager001Eden",
} as const;

// Cashier passwords by branch
const CASHIER_PASSWORDS_BY_BRANCH = {
  "eden-drop-tamasha": "@Kenya90!",  // Tamasha - Alice
  "eden-drop-reem": "@Kenya80!",     // Reem - Bob
  "eden-drop-ukunda": "@Kenya70!",   // LungaLunga - Carol
} as const;

// Branch-to-Cashier Exclusive Mappings
const CASHIER_BRANCH_MAPPING = {
  "Alice Cashier": "eden-drop-tamasha",      // Edendrop001 Tamasha
  "Bob Cashier": "eden-drop-reem",           // Edendrop001 Reem
  "Carol Cashier": "eden-drop-ukunda",       // Edendrop001 LungaLunga
} as const;

export const LoginPage = () => {
  const users = useAppStore((s) => s.users);
  const fetchUsers = useAppStore((s) => s.fetchUsers);
  const login = useAppStore((s) => s.login);
  const setBranch = useAppStore((s) => s.setBranch);
  const currentUser = useAppStore((s) => s.currentUser);

  const [selectedBranch, setSelectedBranch] = useState<BranchId>("eden-drop-tamasha");
  const [selectedRole, setSelectedRole] = useState<"admin" | "manager" | "cashier" | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Auto-assign cashier branch when they select their account
  useEffect(() => {
    if (selectedRole === "cashier" && selectedUserId) {
      const cashier = users.find(u => u.id === selectedUserId);
      if (cashier) {
        const assignedBranch = CASHIER_BRANCH_MAPPING[cashier.name as keyof typeof CASHIER_BRANCH_MAPPING];
        if (assignedBranch) {
          console.log(`[AUTO_BRANCH] Cashier ${cashier.name} assigned to branch: ${assignedBranch}`);
          setSelectedBranch(assignedBranch);
        }
      }
    }
  }, [selectedUserId, selectedRole, users]);

  // DEBUG
  console.log("LoginPage rendered. Users:", users.length, "currentUser:", currentUser);

  // Fetch users on mount (doesn't require token)
  useEffect(() => {
    console.log("[LoginPage] Fetching users...");
    fetchUsers();
  }, []); // ← Empty dependency array - only run once on mount

  useEffect(() => {
    if (selectedUserId && !users.some((u) => u.id === selectedUserId)) {
      setSelectedUserId("");
    }
  }, [users, selectedUserId]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      console.log("User already logged in, redirecting to:", currentUser.role);
      if (currentUser.role === "admin") {
        navigate("/admin");
      } else if (currentUser.role === "manager") {
        navigate("/manager");
      } else {
        navigate("/cashier");
      }
    }
  }, [currentUser, navigate]);

  // Get users by selected role
  const roleUsers = selectedRole 
    ? users.filter(u => u.role === selectedRole)
    : [];

  // DEBUG: Log available cashiers and mappings
  if (selectedRole === "cashier") {
    console.log("🔍 Cashier Debug Info:");
    console.log("   Selected Branch:", selectedBranch);
    console.log("   All cashiers:", roleUsers.map(u => u.name));
    console.log("   Mapping:", CASHIER_BRANCH_MAPPING);
    console.log("   Filtered:", roleUsers
      .filter(user => {
        const assignedBranch = CASHIER_BRANCH_MAPPING[user.name as keyof typeof CASHIER_BRANCH_MAPPING];
        console.log(`   - ${user.name}: assigned=${assignedBranch}, selected=${selectedBranch}, match=${assignedBranch === selectedBranch}`);
        return assignedBranch === selectedBranch;
      })
      .map(u => u.name)
    );
  }

  // Filter cashiers based on selected branch
  const filteredCashiers = selectedRole === "cashier" && selectedBranch
    ? roleUsers.filter(user => {
        const assignedBranch = CASHIER_BRANCH_MAPPING[user.name as keyof typeof CASHIER_BRANCH_MAPPING];
        return assignedBranch === selectedBranch;
      })
    : roleUsers;

  const handleLogin = async () => {
    // Validation
    if (!selectedRole || !selectedUserId || !password) {
      const missingField = !selectedRole ? "role" : !selectedUserId ? "user" : "password";
      setError(`❌ Please select ${missingField}`);
      return;
    }

    if (selectedRole === "cashier" && !selectedBranch) {
      setError("❌ Please select a branch");
      return;
    }

    // Verify cashier belongs to selected branch
    if (selectedRole === "cashier") {
      const selectedUser = users.find(u => u.id === selectedUserId);
      const assignedBranch = CASHIER_BRANCH_MAPPING[selectedUser?.name as keyof typeof CASHIER_BRANCH_MAPPING];
      
      if (assignedBranch !== selectedBranch) {
        setError(`❌ This cashier is not assigned to ${selectedBranch}. Integrity check failed.`);
        setPassword("");
        return;
      }
    }

    // Get the correct password for the selected role and branch
    let correctPassword: string;
    if (selectedRole === "cashier") {
      correctPassword = CASHIER_PASSWORDS_BY_BRANCH[selectedBranch];
    } else {
      correctPassword = CREDENTIALS_BY_ROLE[selectedRole];
    }
    
    if (password !== correctPassword) {
      setError(`❌ Invalid password. Password is: ${correctPassword}`);
      setPassword("");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Set branch
      const branchToUse = selectedRole === "cashier" ? selectedBranch : "eden-drop-tamasha";
      setBranch(branchToUse);
      
      // Call backend login
      const response = await login(selectedUserId, password);
      
      if (!response) {
        setError("❌ Login failed. Please ensure the backend is running and users are in the database.");
        setIsLoading(false);
        return;
      }

      const user = users.find((u) => u.id === selectedUserId);
      if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "manager") {
        navigate("/manager");
      } else {
        navigate("/cashier");
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Login failed. Please try again.";
      setError(`❌ ${errorMsg}`);
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-brand-charcoal via-slate-950 to-black font-sans text-brand-charcoal">
      {/* Left: Brand Showcase */}
      <div className="hidden lg:flex w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-charcoal to-[#000000] z-0" />
        
        {/* Animated Gradients */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-brand-burgundy rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 bg-brand-gold rounded-full blur-3xl opacity-15 animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-burgundy via-red-600 to-brand-copper shadow-2xl text-white font-bold text-4xl border-2 border-brand-gold/30">
              E
            </div>
            <div>
              <span className="text-4xl font-display font-black tracking-tight text-white block">EDEN DROP 001</span>
              <span className="text-xs font-semibold text-brand-copper tracking-widest uppercase">Premium Butchery</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-7xl font-display font-black text-white leading-tight mb-6">
              Premium<br />
              <span className="bg-gradient-to-r from-brand-copper via-brand-gold to-yellow-400 bg-clip-text text-transparent">Quality</span><br />
              Management
            </h1>
            <p className="text-lg text-gray-200 max-w-sm leading-relaxed font-light">
              The professional POS system trusted by EDEN DROP 001. Fast, secure, and built for excellence in meat business operations.
            </p>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10 space-y-5"
        >
          <div className="flex items-center gap-4 text-white/95 group cursor-default">
            <div className="p-3 rounded-xl bg-brand-burgundy/20 backdrop-blur-md border border-brand-copper/40 group-hover:border-brand-copper/70 transition-colors">
              <Zap className="h-5 w-5 text-brand-copper" />
            </div>
            <div>
              <p className="font-semibold text-base">Lightning Fast</p>
              <p className="text-sm text-gray-400">Optimized weight entry & transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/95 group cursor-default">
            <div className="p-3 rounded-xl bg-brand-burgundy/20 backdrop-blur-md border border-brand-copper/40 group-hover:border-brand-copper/70 transition-colors">
              <ShieldCheck className="h-5 w-5 text-brand-copper" />
            </div>
            <div>
              <p className="font-semibold text-base">Secure & Audited</p>
              <p className="text-sm text-gray-400">Complete audit trails for compliance</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-white/95 group cursor-default">
            <div className="p-3 rounded-xl bg-brand-burgundy/20 backdrop-blur-md border border-brand-copper/40 group-hover:border-brand-copper/70 transition-colors">
              <User className="h-5 w-5 text-brand-copper" />
            </div>
            <div>
              <p className="font-semibold text-base">Multi-Branch</p>
              <p className="text-sm text-gray-400">Manage all EDENTOP locations seamlessly</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative z-10 text-xs text-gray-500 font-semibold"
        >
          © 2026 Eden Drop Systems • v2.0 • Multi-Branch Edition
        </motion.div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-white mb-2">Welcome</h2>
            <p className="text-gray-400 text-base">Select your branch, role, and authenticate to continue</p>
          </div>

          {/* Branch Selection - ONLY for Admin/Manager (cashiers get auto-assigned) */}
          {selectedRole !== "cashier" && (
            <div className="mb-8">
              <label className="text-xs font-black uppercase tracking-widest text-gray-300 mb-4 block">Select Branch</label>
              <BranchSelector selectedBranch={selectedBranch} onSelect={setSelectedBranch} />
            </div>
          )}

          {/* Show Placeholder for Cashier Branch (auto-assigned) */}
          {selectedRole === "cashier" && !selectedUserId && (
            <div className="mb-8">
              <label className="text-xs font-black uppercase tracking-widest text-gray-300 mb-4 block">Your Branch</label>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 text-sm text-center">
                Select your cashier account to auto-assign your branch
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-8">
            <label className="text-xs font-black uppercase tracking-widest text-gray-300 mb-4 block">User Role</label>
            <div className="grid grid-cols-3 gap-3">
              {["admin", "manager", "cashier"].map((role) => (
                <motion.button
                  key={role}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role as "admin" | "manager" | "cashier");
                    setSelectedUserId("");
                    setError("");
                  }}
                  className={`relative p-4 rounded-xl border-2 font-bold uppercase text-sm transition-all duration-300 ${
                    selectedRole === role
                      ? role === "admin" 
                        ? "border-brand-burgundy bg-brand-burgundy/20 text-brand-burgundy shadow-lg shadow-brand-burgundy/30"
                        : role === "manager"
                        ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/30"
                        : "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/30"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {role === "admin" && "👑"}
                  {role === "manager" && "📊"}
                  {role === "cashier" && "💳"}
                  <br />
                  {role}
                </motion.button>
              ))}
            </div>
          </div>

          {/* User Selection */}
          {selectedRole && filteredCashiers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <label className="text-xs font-black uppercase tracking-widest text-gray-300 mb-3 block">
                {selectedRole === "cashier" ? "Select Assigned Cashier" : "Select Staff Member"}
              </label>
              <Card className="border-gray-700 bg-gray-800/50 shadow-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {filteredCashiers.map((user) => (
                      <motion.button
                        key={user.id}
                        whileHover={{ x: 4 }}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                          selectedUserId === user.id
                            ? "border-brand-burgundy bg-brand-burgundy/15 ring-1 ring-brand-burgundy"
                            : "border-gray-700 hover:border-brand-burgundy/50 hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${
                            selectedUserId === user.id
                              ? "bg-brand-burgundy text-white"
                              : "bg-gray-700 text-gray-300"
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold text-sm ${selectedUserId === user.id ? "text-white" : "text-gray-300"}`}>
                              {user.name}
                            </div>
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <Check className="h-5 w-5 text-brand-burgundy" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* No Cashiers For Selected Branch */}
          {selectedRole === "cashier" && selectedBranch && filteredCashiers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-amber-500/20 border border-amber-500/50"
            >
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-amber-300 text-sm font-medium">
                  No cashiers assigned to this branch. Please select a different branch.
                </div>
              </div>
            </motion.div>
          )}

          {/* Show Selected Branch for Cashier */}
          {selectedRole === "cashier" && selectedUserId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/50"
            >
              <div className="flex gap-3 items-center">
                <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div className="text-emerald-300 text-sm font-bold">
                  ✓ Branch Auto-Assigned: {selectedBranch === "eden-drop-tamasha" ? "Tamasha" : selectedBranch === "eden-drop-reem" ? "Reem" : "LungaLunga"}
                </div>
              </div>
            </motion.div>
          )}

          {/* Password Input */}
          {selectedRole && selectedUserId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <label className="text-xs font-black uppercase tracking-widest text-gray-300 mb-3 block">
                <Lock className="inline h-3.5 w-3.5 mr-2" />
                Security Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="h-12 text-white bg-gray-800 border-brand-copper/30 focus:border-brand-copper focus:bg-gray-900 placeholder:text-gray-600 text-base font-medium"
                placeholder="Enter password"
                disabled={isLoading}
              />
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Login Button */}
          {selectedRole && selectedUserId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                className="w-full h-12 text-base font-bold shadow-xl shadow-brand-copper/40 bg-gradient-to-r from-brand-burgundy to-brand-copper hover:from-brand-burgundy/90 hover:to-brand-copper/90 uppercase tracking-wider border border-brand-copper/30"
                disabled={!password || isLoading}
                onClick={handleLogin}
              >
                {isLoading ? "Authenticating..." : "Access Terminal"}
              </Button>
            </motion.div>
          )}

          {/* Status Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex justify-center gap-4 text-xs font-semibold"
          >
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              System Online
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-2 text-brand-copper">
              <div className="h-2 w-2 rounded-full bg-brand-copper animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              Database Synced
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

