import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import shiftsRouter from "./shifts";
import shiftSummaryRouter from "./shiftSummary";
import adminAnalyticsRouter from "./adminAnalytics";
import proAnalyticsRouter from "./proAnalytics";
import expensesRouter from "./expenses";
import userManagementRouter from "./userManagement";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(cors({
  origin: function(origin, callback) {
    const whitelist = [
      'http://localhost:5173',
      'http://localhost:4000'
    ];
    
    // Allow all *.vercel.app domains (production and preview URLs)
    if (origin && origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mount shift workflow router
app.use("/api/shifts", shiftsRouter);
// Mount shift summary router
app.use("/api/shift-summary", shiftSummaryRouter);
// Mount admin analytics router
app.use("/api/admin/analytics", adminAnalyticsRouter);
// Mount pro analytics router
app.use("/api/analytics", proAnalyticsRouter);
// Mount expenses router
app.use("/api/expenses", expensesRouter);
// Mount user management router
app.use("/api/admin/users", userManagementRouter);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
const JWT_SECRET = process.env.JWT_SECRET || "eden-drop-001-secret-key-2026";

const supabase = createClient(supabaseUrl, supabaseKey);

const ANALYTICS_TIMEZONE = "Africa/Nairobi";

const formatDateInTZ = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getWeekStart = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // Monday start
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().split("T")[0];
};

const getMonthStart = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00+03:00`);
  date.setUTCDate(1);
  return date.toISOString().split("T")[0];
};

const upsertSalesSummary = async (
  table: "sales_daily" | "sales_weekly" | "sales_monthly",
  key: string,
  keyValue: string,
  amount: number
) => {
  if (!Number.isFinite(amount)) return;

  const { data, error } = await supabase.from(table).select("*").eq(key, keyValue).single();
  if (error && error.code === "42P01") {
    console.warn(`[ANALYTICS] Missing table ${table}. Run migration 002_create_sales_summaries.sql`);
    return;
  }

  const currentTotal = Number(data?.total_sales || 0);
  const currentCount = Number(data?.transaction_count || 0);
  const totalSales = currentTotal + amount;
  const transactionCount = currentCount + 1;
  const avgBasketValue = transactionCount > 0 ? totalSales / transactionCount : 0;

  const payload: Record<string, any> = {
    [key]: keyValue,
    total_sales: totalSales,
    transaction_count: transactionCount,
    avg_basket_value: avgBasketValue,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from(table)
    .upsert(payload, { onConflict: key });

  if (upsertError) {
    console.error(`[ANALYTICS] Upsert failed for ${table}:`, upsertError);
  }
};

const updateSalesSummaries = async (transaction: any) => {
  const amount = Number(transaction?.total ?? transaction?.amount ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return;

  const createdAt = transaction?.created_at ? new Date(transaction.created_at) : new Date();
  const dateStr = formatDateInTZ(createdAt, ANALYTICS_TIMEZONE);
  const weekStart = getWeekStart(dateStr);
  const monthStart = getMonthStart(dateStr);

  await Promise.all([
    upsertSalesSummary("sales_daily", "date", dateStr, amount),
    upsertSalesSummary("sales_weekly", "week_start", weekStart, amount),
    upsertSalesSummary("sales_monthly", "month_start", monthStart, amount),
  ]);
};

// Migration: Ensure shift_stock_entries table exists
const ensureShiftStockEntriesTable = async () => {
  try {
    // Try to query the table to check if it exists
    const { error: checkError } = await supabase
      .from("shift_stock_entries")
      .select("id")
      .limit(1);

    if (checkError && checkError.code === "PGRST116") {
      // Table doesn't exist, we need to create it
      console.log("[MIGRATION] Creating shift_stock_entries table...");
      
      // Use Supabase HTTP API to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
        },
      });

      // Since direct SQL execution isn't available, we'll use a workaround:
      // Create a temporary function that can be called via RPC
      // For now, log that the table is missing
      if (checkError) {
        console.warn("[MIGRATION] shift_stock_entries table not found. Creating via fallback...");
        
        // Attempt to create the table using individual insert operations
        // This is a workaround since Supabase JS client doesn't support raw SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.shift_stock_entries (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            shift_id TEXT NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
            cashier_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
            branch_id TEXT NOT NULL DEFAULT 'branch1',
            product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
            opening_stock DECIMAL(10, 2) DEFAULT 0,
            added_stock DECIMAL(10, 2) DEFAULT 0,
            sold_stock DECIMAL(10, 2) DEFAULT 0,
            closing_stock DECIMAL(10, 2) DEFAULT 0,
            variance DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(shift_id, product_id)
          );
          CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_branch_date
          ON public.shift_stock_entries(branch_id, shift_date DESC);
          CREATE INDEX IF NOT EXISTS idx_shift_stock_entries_cashier
          ON public.shift_stock_entries(cashier_id, shift_date DESC);
        `;
        
        console.log("[MIGRATION] Please run the following SQL in Supabase dashboard:");
        console.log(createTableSQL);
        console.warn("[MIGRATION] Shift-based stock tracking requires manual table creation.");
        console.log("[MIGRATION] Go to: https://supabase.com/dashboard → SQL Editor → Paste the SQL above");
      }
    } else if (!checkError) {
      console.log("[MIGRATION] ✓ shift_stock_entries table exists and is accessible");
    }
  } catch (error) {
    console.error("[MIGRATION] Error checking shift_stock_entries table:", error);
  }
};

// Initialize AI client (OpenAI or Ollama)
const aiProvider = (process.env.AI_PROVIDER || "openai").toLowerCase();
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const openRouter = openRouterApiKey
  ? new OpenAI({ apiKey: openRouterApiKey, baseURL: "https://openrouter.ai/api/v1" })
  : null;
const openRouterModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";

// Middleware to authenticate JWT
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    (req as any).user = user;
    next();
  });
};

// Middleware for Role-Based Access Control
const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "eden-drop-001-backend", database: "supabase" });
});

// Debug endpoint - check database connection
app.get("/debug/users", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, role").limit(10);
    if (error) {
      return res.status(500).json({ error: "Database error", details: error.message });
    }
    res.json({ 
      totalUsers: data?.length || 0,
      users: data || [],
      message: data && data.length > 0 ? "✅ Users found in database" : "❌ No users in database"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to query users", details: (error as Error).message });
  }
});

// Login attempt tracking (in-memory, resets on server restart)
const loginAttemptMap = new Map<string, number>();
// Clear old attempts every hour
setInterval(() => loginAttemptMap.clear(), 3600000);

// Auth Login endpoint
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { userId, password } = req.body;

  console.log(`[LOGIN] Attempting login for userId: ${userId}`);

  // Input validation
  if (!userId || !password) {
    console.log(`[LOGIN] Missing credentials`);
    return res.status(400).json({ error: "User ID and password are required." });
  }

  if (typeof userId !== "string" || typeof password !== "string") {
    console.log(`[LOGIN] Invalid input format`);
    return res.status(400).json({ error: "Invalid input format." });
  }

  // Rate limiting check (basic)
  const loginAttempts = loginAttemptMap.get(userId) || 0;
  if (loginAttempts > 5) {
    console.log(`[LOGIN] Too many login attempts for ${userId}`);
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  }

  try {
    console.log(`[LOGIN] Querying user from database...`);

    // Query user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.log(`[LOGIN] Database error:`, error);
      loginAttemptMap.set(userId, loginAttempts + 1);
      return res.status(500).json({ error: `Database error: ${error.message}` });
    }

    if (!user) {
      console.log(`[LOGIN] User not found in database: ${userId}`);
      loginAttemptMap.set(userId, loginAttempts + 1);
      // Return generic error - don't reveal user doesn't exist
      return res.status(401).json({ error: "Invalid credentials. Please try again." });
    }

    console.log(`[LOGIN] ✅ User found:`, { id: user.id, name: user.name, role: user.role });

    const passwordHash = (user as any).password_hash as string | undefined;
    const legacyPassword = (user as any).password as string | undefined;

    console.log(`[LOGIN] 🔐 Password Debug:`, {
      receivedPassword: password,
      storedHash: passwordHash ? passwordHash.substring(0, 30) + '...' : 'NO HASH',
      legacyPassword: legacyPassword ? '***SET***' : 'NOT SET'
    });

    let passwordValid = false;
    
    // Check bcrypt hash first (primary method)
    if (passwordHash) {
      try {
        passwordValid = await bcrypt.compare(password, passwordHash);
        console.log(`[LOGIN] 🔍 bcrypt.compare result:`, passwordValid);
      } catch (err) {
        console.log(`[LOGIN] Error comparing password hash:`, err);
      }
    }
    
    // Fall back to plain text password comparison (for legacy/empty passwords)
    if (!passwordValid && legacyPassword) {
      passwordValid = password === legacyPassword;
      console.log(`[LOGIN] 🔍 Legacy password match:`, passwordValid);
    }

    if (!passwordValid) {
      console.log(`[LOGIN] Invalid password for ${userId}`);
      loginAttemptMap.set(userId, loginAttempts + 1);
      // Return generic error - don't reveal password was wrong vs user not found
      return res.status(401).json({ error: "Invalid credentials. Please try again." });
    }

    // Reset login attempts on success
    loginAttemptMap.delete(userId);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`[LOGIN] ✅ Token generated, login successful for ${userId}`);

    // Log successful login (optional - wrap in try-catch to not break login if it fails)
    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "login",
        description: `Logged in as ${user.role}`,
      });
    } catch (logError) {
      console.log("Audit log warning:", logError);
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LOGIN] Unexpected error:", error);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
});

// --- Products Endpoints ---

app.get("/api/products", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/products", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("products").upsert([req.body]).select();
    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch("/api/products/:id", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(req.body)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    res.json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/products/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Users Endpoints ---

app.get("/api/users", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, role");
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/users", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { password, ...userData } = req.body;
    let finalUserData = { ...userData };

    if (password) {
      finalUserData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase.from("users").upsert([finalUserData]).select();
    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch("/api/users/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { password, ...updates } = req.body;
    let finalUpdates = { ...updates };

    if (password) {
      finalUpdates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(finalUpdates)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    res.json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/users/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Transactions Endpoints ---

app.get("/api/transactions", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("transactions").select("*");

    if (req.query.shift_id) query = query.eq("shift_id", req.query.shift_id);
    if (req.query.cashier_id) query = query.eq("cashier_id", req.query.cashier_id);
    if (req.query.payment_method) query = query.eq("payment_method", req.query.payment_method);

    const { data, error } = await query.order("transaction_date", { ascending: false });

    if (error) {
      console.error("[TRANSACTIONS] Database error:", error);
      // Return empty array instead of error - transactions table might be empty
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.error("[TRANSACTIONS] Catch error:", error);
    // Return empty array on any error - allows app to continue
    res.json([]);
  }
});

app.post("/api/transactions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const transaction = req.body;
    
    // Validate shift is open
    if (!transaction.shift_id) {
      return res.status(400).json({ error: "Shift must be opened before making sales" });
    }
    
    const { data: shift } = await supabase
      .from("shifts")
      .select("status")
      .eq("id", transaction.shift_id)
      .single();
    
    if (!shift || shift.status !== "OPEN") {
      return res.status(400).json({ error: "No active shift found. Please open shift first." });
    }
    let txResponse = await supabase.from("transactions").insert([transaction]).select().single();

    if (txResponse.error && String(txResponse.error.message || "").includes("branch_id")) {
      const { branch_id, ...fallbackTransaction } = transaction;
      txResponse = await supabase.from("transactions").insert([fallbackTransaction]).select().single();
    }

    if (txResponse.error) throw txResponse.error;
    const tx = txResponse.data;

    // Log to inventory_ledger for each item
    if (tx && transaction.items) {
      const ledgerEntries = transaction.items.map((item: any) => ({
        item_id: item.productId,
        event_type: 'SALE',
        quantity_kg: -item.weightKg, // Sale reduces stock
        shift_id: transaction.shift_id,
        user_id: transaction.cashier_id,
        reference_id: tx.id
      }));

      const { error: ledgerError } = await supabase.from("inventory_ledger").insert(ledgerEntries);
      if (ledgerError) console.error("Ledger logging failed for transaction:", ledgerError);
    }

    // Update shift-based stock entries and product stock in real-time
    if (tx && transaction.items && transaction.shift_id) {
      for (const item of transaction.items) {
        const { data: entry } = await supabase
          .from("shift_stock_entries")
          .select("id, opening_stock, added_stock, sold_stock")
          .eq("shift_id", transaction.shift_id)
          .eq("product_id", item.productId)
          .single();

        if (entry) {
          const newSold = Number(entry.sold_stock || 0) + Number(item.weightKg || 0);
          const newClosing = Number(entry.opening_stock || 0) + Number(entry.added_stock || 0) - newSold;

          await supabase
            .from("shift_stock_entries")
            .update({ sold_stock: newSold, closing_stock: newClosing, updated_at: new Date().toISOString() })
            .eq("id", entry.id);
        }

        const { data: product } = await supabase
          .from("products")
          .select("stock_kg")
          .eq("id", item.productId)
          .single();

        if (product) {
          const updatedStock = Number(product.stock_kg || 0) - Number(item.weightKg || 0);
          await supabase.from("products").update({ stock_kg: updatedStock }).eq("id", item.productId);
        }
      }
    }

    if (tx) {
      await updateSalesSummaries(tx);
    }

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- SSR Endpoints (Shifts & Stock Reconciliation) ---

// 1. Shifts
app.get("/api/shifts", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("shifts").select("*");
    
    // Filter by status if provided
    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }
    
    // Filter by cashier_id if provided
    if (req.query.cashier_id) {
      query = query.eq("cashier_id", req.query.cashier_id);
    }
    
    // IMPORTANT: If looking for "active" shifts, only return TODAY's shifts
    // This prevents showing stale open shifts from previous days
    if (req.query.status === "open") {
      const today = new Date().toISOString().split("T")[0];
      query = query.eq("shift_date", today);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[SHIFTS] Database error:", error);
      return res.json([]); // Return empty array if table doesn't exist
    }
    res.json(data || []);
  } catch (error) {
    console.error("[SHIFTS] Catch error:", error);
    res.json([]); // Return empty array on any error
  }
});

app.post("/api/shifts/open", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cashier_id, branch_id, cashier_name } = req.body;
    // Check if cashier already has an open shift
    const { data: existing } = await supabase.from("shifts").select("id").eq("cashier_id", cashier_id).eq("status", "open").single();
    if (existing) return res.status(400).json({ error: "Cashier already has an open shift." });

    const { data: shift, error } = await supabase.from("shifts").insert([{ 
      cashier_id, 
      cashier_name: cashier_name || "Cashier",
      branch_id: branch_id || "branch1",
      shift_date: new Date().toISOString().split('T')[0],
      opening_time: new Date().toISOString(),
      status: 'open' 
    }]).select().single();
    if (error) throw error;

    // Log opening snapshot to ledger for each active product
    const { data: products } = await supabase.from("products").select("id, stock_kg").eq("is_active", true);
    if (products && shift) {
      const ledgerEntries = products.map(p => ({
        item_id: p.id,
        event_type: 'OPENING_SNAPSHOT',
        quantity_kg: p.stock_kg,
        shift_id: shift.id,
        user_id: cashier_id
      }));
      await supabase.from("inventory_ledger").insert(ledgerEntries);

      const snapshots = products.map(p => ({
        shift_id: shift.id,
        item_id: p.id,
        opening_kg: p.stock_kg
      }));
      await supabase.from("shift_stock_snapshots").insert(snapshots);

      const shiftDate = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split("T")[0];

      // Fetch yesterday's closing stock for each product
      const { data: yesterdayEntries } = await supabase
        .from("shift_stock_entries")
        .select("product_id, closing_stock")
        .eq("branch_id", branch_id || "branch1")
        .eq("shift_date", yesterdayDate);

      const yesterdayClosingMap = new Map();
      if (yesterdayEntries) {
        yesterdayEntries.forEach(e => yesterdayClosingMap.set(e.product_id, e.closing_stock));
      }

      const entries = products.map(p => {
        const openingStock = yesterdayClosingMap.get(p.id) ?? Number(p.stock_kg || 0);
        return {
          shift_id: shift.id,
          cashier_id,
          branch_id: branch_id || "branch1",
          product_id: p.id,
          shift_date: shiftDate,
          opening_stock: Number(openingStock || 0),
          added_stock: 0,
          sold_stock: 0,
          closing_stock: Number(openingStock || 0),
          variance: 0
        };
      });
      
      console.log(`[SHIFT_OPEN] Inserting ${entries.length} stock entries for shift ${shift.id}`);
      const { error: insertError } = await supabase.from("shift_stock_entries").insert(entries);
      if (insertError) {
        console.error(`[SHIFT_OPEN] Error inserting shift_stock_entries:`, insertError);
      } else {
        console.log(`[SHIFT_OPEN] ✓ Successfully inserted stock entries`);
      }
    }

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/shifts/:id/close", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { actual_counts, closing_cash, closing_mpesa } = req.body; // Map item_id -> actual_kg
    const shiftId = req.params.id;

    console.log(`[SHIFT_CLOSE] Closing shift ${shiftId} with actual_counts:`, actual_counts);

    if (!actual_counts || typeof actual_counts !== "object" || Object.keys(actual_counts).length === 0) {
      return res.status(400).json({ error: "Actual closing stock is required for all items." });
    }

    if (closing_cash === undefined || closing_mpesa === undefined) {
      return res.status(400).json({ error: "Cash and M-Pesa totals are required to close the shift." });
    }

    // 1. Update shift status
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .update({
        status: 'PENDING_REVIEW',
        closed_at: new Date().toISOString(),
        closing_cash: closing_cash ?? 0,
        closing_mpesa: closing_mpesa ?? 0
      })
      .eq("id", shiftId)
      .select().single();

    if (shiftError) throw shiftError;
    console.log(`[SHIFT_CLOSE] Shift status updated:`, shift);

    // 2. Update snapshots with actual counts and calculate expected
    for (const [itemId, actualKg] of Object.entries(actual_counts)) {
      // Calculate expected closing from ledger
      const { data: ledger } = await supabase
        .from("inventory_ledger")
        .select("quantity_kg")
        .eq("shift_id", shiftId)
        .eq("item_id", itemId);

      const expectedKg = (ledger || []).reduce((sum, entry) => sum + Number(entry.quantity_kg), 0);
      const variance = Number(actualKg) - expectedKg;

      const { data: shiftEntry } = await supabase
        .from("shift_stock_entries")
        .select("opening_stock, added_stock, sold_stock")
        .eq("shift_id", shiftId)
        .eq("product_id", itemId)
        .single();

      const expectedFromShift = shiftEntry
        ? Number(shiftEntry.opening_stock || 0) + Number(shiftEntry.added_stock || 0) - Number(shiftEntry.sold_stock || 0)
        : expectedKg;
      const varianceFromShift = Number(actualKg) - expectedFromShift;

      await supabase
        .from("shift_stock_snapshots")
        .update({
          actual_closing_kg: actualKg,
          expected_closing_kg: expectedKg,
          variance_kg: variance
        })
        .eq("shift_id", shiftId)
        .eq("item_id", itemId);

      await supabase
        .from("shift_stock_entries")
        .update({
          closing_stock: Number(actualKg),
          variance: varianceFromShift,
          updated_at: new Date().toISOString()
        })
        .eq("shift_id", shiftId)
        .eq("product_id", itemId);

      console.log(`[SHIFT_CLOSE] Updated shift_stock_entries for product ${itemId}: closing=${actualKg}, variance=${varianceFromShift}`);

      // Log SHIFT_CLOSE to ledger (the delta to match actual)
      await supabase.from("inventory_ledger").insert([{
        item_id: itemId,
        event_type: 'SHIFT_CLOSE',
        quantity_kg: variance, // This makes the ledger total match the physical count
        shift_id: shiftId,
        user_id: shift.cashier_id
      }]);
    }

    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 1. Shift-based stock entries (real-time)
app.get("/api/shift-stock", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id } = req.query as { shift_id?: string };
    if (!shift_id) return res.status(400).json({ error: "shift_id is required" });

    const { data, error } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, category, code, low_stock_threshold_kg)")
      .eq("shift_id", shift_id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    console.log("[SHIFT-STOCK] Returning", data?.length, "entries for shift", shift_id);
    res.json({ entries: data || [] });
  } catch (error) {
    console.error("[SHIFT-STOCK] Error:", (error as Error).message);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/shift-stock/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const branch_id = (req.query.branch_id as string) || "branch1";
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, category, code, low_stock_threshold_kg)")
      .eq("branch_id", branch_id)
      .eq("shift_date", date);

    if (error) throw error;

    const entries = data || [];
    const aggregatedMap = new Map<string, any>();

    entries.forEach((entry: any) => {
      const key = entry.product_id;
      const existing = aggregatedMap.get(key);
      const opening = Number(entry.opening_stock || 0);
      const added = Number(entry.added_stock || 0);
      const sold = Number(entry.sold_stock || 0);
      const closing = Number(entry.closing_stock || 0);
      const variance = Number(entry.variance || 0);

      if (!existing) {
        aggregatedMap.set(key, {
          id: entry.id,
          product_id: entry.product_id,
          branch_id: entry.branch_id,
          shift_date: entry.shift_date,
          opening_stock: opening,
          added_stock: added,
          sold_stock: sold,
          closing_stock: closing,
          variance,
          products: entry.products
        });
      } else {
        existing.opening_stock += opening;
        existing.added_stock += added;
        existing.sold_stock += sold;
        existing.closing_stock += closing;
        existing.variance += variance;
      }
    });

    const aggregatedEntries = Array.from(aggregatedMap.values());
    const total_opening = aggregatedEntries.reduce((sum, e) => sum + Number(e.opening_stock || 0), 0);
    const total_added = aggregatedEntries.reduce((sum, e) => sum + Number(e.added_stock || 0), 0);
    const total_sold = aggregatedEntries.reduce((sum, e) => sum + Number(e.sold_stock || 0), 0);
    const total_closing = aggregatedEntries.reduce((sum, e) => sum + Number(e.closing_stock || 0), 0);

    const low_stock_count = aggregatedEntries.filter((e) => {
      const threshold = Number(e.products?.low_stock_threshold_kg || 0);
      return Number(e.closing_stock || 0) < threshold;
    }).length;

    res.json({
      total_opening,
      total_added,
      total_sold,
      total_closing,
      low_stock_count,
      entries: aggregatedEntries
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all closed shifts with variance and stock details (for admin)
app.get("/api/shift-stock/closed-shifts", authenticateToken, async (req: Request, res: Response) => {
  try {
    const branch_id = (req.query.branch_id as string) || undefined;
    const date = (req.query.date as string) || undefined;

    console.log(`[CLOSED_SHIFTS] Fetching with branch_id=${branch_id}, date=${date}`);

    // Query closed shifts with their stock entries
    let query = supabase
      .from("shift_stock_entries")
      .select(`
        *,
        products(name, category),
        shifts(id, opened_at, closed_at, status, cashier_id)
      `)
      .not("shifts", "is", null);

    if (branch_id) query = query.eq("branch_id", branch_id);
    if (date) query = query.eq("shift_date", date);

    const { data, error } = await query.order("shift_date", { ascending: false });

    if (error) throw error;

    console.log(`[CLOSED_SHIFTS] Raw query returned ${data?.length || 0} entries`);

    // Filter for closed shifts only
    const filteredData = (data || []).filter((entry: any) => 
      entry.shifts && ["PENDING_REVIEW", "APPROVED"].includes(entry.shifts.status)
    );

    console.log(`[CLOSED_SHIFTS] After filtering for closed shifts: ${filteredData.length} entries`);

    // Collect all unique cashier IDs
    const cashierIds = new Set<string>();
    filteredData.forEach((entry: any) => {
      if (entry.shifts?.cashier_id) {
        cashierIds.add(entry.shifts.cashier_id);
      }
    });

    // Fetch cashier details
    const { data: cashiers } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", Array.from(cashierIds));

    const cashierMap = new Map<string, any>();
    (cashiers || []).forEach(c => cashierMap.set(c.id, c));

    // Group by shift
    const shiftMap = new Map<string, any>();

    filteredData.forEach((entry: any) => {
      const shiftId = entry.shifts.id;
      if (!shiftMap.has(shiftId)) {
        const cashier = cashierMap.get(entry.shifts.cashier_id) || {};
        shiftMap.set(shiftId, {
          shift_id: shiftId,
          cashier_id: entry.shifts.cashier_id,
          cashier_name: cashier.name || "Unknown",
          cashier_email: cashier.email || "",
          status: entry.shifts.status,
          opened_at: entry.shifts.opened_at,
          closed_at: entry.shifts.closed_at,
          branch_id: entry.branch_id,
          shift_date: entry.shift_date,
          total_opening: 0,
          total_added: 0,
          total_sold: 0,
          total_closing: 0,
          total_variance: 0,
          products: []
        });
      }

      const shift = shiftMap.get(shiftId);
      const opening = Number(entry.opening_stock || 0);
      const added = Number(entry.added_stock || 0);
      const sold = Number(entry.sold_stock || 0);
      const closing = Number(entry.closing_stock || 0);
      const variance = Number(entry.variance || 0);

      shift.total_opening += opening;
      shift.total_added += added;
      shift.total_sold += sold;
      shift.total_closing += closing;
      shift.total_variance += variance;

      shift.products.push({
        product_id: entry.product_id,
        product_name: entry.products?.name || "Unknown",
        category: entry.products?.category || "",
        opening_stock: opening,
        added_stock: added,
        sold_stock: sold,
        closing_stock: closing,
        variance: variance
      });
    });

    const closedShifts = Array.from(shiftMap.values());

    console.log(`[CLOSED_SHIFTS] Returning ${closedShifts.length} closed shifts`);

    res.json({
      closedShifts,
      branch_id,
      date: date || new Date().toISOString().split("T")[0]
    });
  } catch (error) {
    console.error("Error fetching closed shifts:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/shift-stock/by-cashier", authenticateToken, async (req: Request, res: Response) => {
  try {
    const branch_id = (req.query.branch_id as string) || "branch1";
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    // Get all shift stock entries with cashier and product info
    const { data, error } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, category, code), users!shift_stock_entries_cashier_id_fkey(name, email)")
      .eq("branch_id", branch_id)
      .eq("shift_date", date);

    if (error) throw error;

    // Group by cashier
    const cashierMap = new Map<string, any>();

    (data || []).forEach((entry: any) => {
      const cashierId = entry.cashier_id;
      if (!cashierMap.has(cashierId)) {
        cashierMap.set(cashierId, {
          cashier_id: cashierId,
          cashier_name: entry.users?.name || "Unknown",
          cashier_email: entry.users?.email || "",
          shift_id: entry.shift_id,
          products: []
        });
      }

      cashierMap.get(cashierId).products.push({
        product_id: entry.product_id,
        product_name: entry.products?.name || "Unknown",
        category: entry.products?.category || "",
        opening_stock: Number(entry.opening_stock || 0),
        added_stock: Number(entry.added_stock || 0),
        sold_stock: Number(entry.sold_stock || 0),
        closing_stock: Number(entry.closing_stock || 0),
        variance: Number(entry.variance || 0)
      });
    });

    const cashiers = Array.from(cashierMap.values());

    res.json({ cashiers, date, branch_id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/shift/add-stock", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id, product_id, quantity_kg, supplier, notes, batch } = req.body;
    const user = (req as any).user;

    const { data: entry } = await supabase
      .from("shift_stock_entries")
      .select("id, opening_stock, added_stock, sold_stock, closing_stock")
      .eq("shift_id", shift_id)
      .eq("product_id", product_id)
      .single();

    if (!entry) {
      return res.status(404).json({ error: "Shift stock entry not found" });
    }

    const newAdded = Number(entry.added_stock || 0) + Number(quantity_kg || 0);
    const newClosing = Number(entry.opening_stock || 0) + newAdded - Number(entry.sold_stock || 0);

    const { data: updated, error } = await supabase
      .from("shift_stock_entries")
      .update({
        added_stock: newAdded,
        closing_stock: newClosing,
        updated_at: new Date().toISOString()
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("inventory_ledger").insert([{
      item_id: product_id,
      event_type: 'SHIFT_STOCK_ADDED',
      quantity_kg: Number(quantity_kg || 0),
      shift_id,
      user_id: user.id,
      reference_id: null
    }]);

    const { data: product } = await supabase.from("products").select("stock_kg").eq("id", product_id).single();
    if (product) {
      await supabase
        .from("products")
        .update({ stock_kg: Number(product.stock_kg || 0) + Number(quantity_kg || 0) })
        .eq("id", product_id);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 2. Stock Additions
app.get("/api/stock-additions", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("stock_additions").select("*");
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.shift_id) query = query.eq("shift_id", req.query.shift_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[STOCK-ADDITIONS] Database error:", error);
      return res.json([]); // Return empty array if table doesn't exist
    }
    res.json(data || []);
  } catch (error) {
    console.error("[STOCK-ADDITIONS] Catch error:", error);
    res.json([]); // Return empty array on any error
  }
});

app.post("/api/stock-additions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { shift_id, item_id, quantity_kg, supplier, notes } = req.body;
    const user = (req as any).user;

    const { data, error } = await supabase.from("stock_additions").insert([{
      shift_id,
      item_id,
      quantity_kg,
      supplier,
      notes,
      status: 'PENDING',
      created_by: user.id
    }]).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch("/api/stock-additions/:id/approve", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body; // APPROVED or REJECTED

    const { data: addition, error: fetchError } = await supabase.from("stock_additions").select("*").eq("id", req.params.id).single();
    if (fetchError || !addition) throw new Error("Stock addition not found");

    if (addition.status !== 'PENDING') return res.status(400).json({ error: "Addition already processed" });

    const { data, error } = await supabase
      .from("stock_additions")
      .update({ status, approved_by: user.id })
      .eq("id", req.params.id)
      .select().single();

    if (error) throw error;

    if (status === 'APPROVED') {
      // 1. Log to ledger
      await supabase.from("inventory_ledger").insert([{
        item_id: addition.item_id,
        event_type: 'STOCK_ADDED',
        quantity_kg: addition.quantity_kg,
        shift_id: addition.shift_id,
        user_id: user.id,
        reference_id: addition.id
      }]);

      // 2. Real-time update product stock
      const { data: product } = await supabase.from("products").select("stock_kg").eq("id", addition.item_id).single();
      if (product) {
        await supabase.from("products").update({ stock_kg: Number(product.stock_kg) + Number(addition.quantity_kg) }).eq("id", addition.item_id);
      }
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Wholesale Summaries Endpoints ---

// Get real-time aggregated summaries (from transactions + manual entries)
app.get("/api/wholesale-summaries/realtime", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get transactions for the date and aggregate by branch and payment method
    const startDateTime = `${targetDate}T00:00:00`;
    const endDateTime = `${targetDate}T23:59:59`;

    let txResponse = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", startDateTime)
      .lt("created_at", endDateTime);

    if (txResponse.error && txResponse.error.code === "42703") {
      txResponse = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", startDateTime)
        .lt("transaction_date", endDateTime);
    }

    if (txResponse.error) throw txResponse.error;
    const transactions = txResponse.data;

    // Build shift -> branch map (fallback when transactions lack branch_id)
    const shiftIds = Array.from(new Set((transactions || []).map((t: any) => t.shift_id).filter(Boolean)));
    let shiftBranchMap: Record<string, string> = {};

    if (shiftIds.length > 0) {
      const { data: shiftEntries, error: shiftEntriesError } = await supabase
        .from("shift_stock_entries")
        .select("shift_id, branch_id")
        .in("shift_id", shiftIds);

      if (!shiftEntriesError && shiftEntries) {
        shiftBranchMap = shiftEntries.reduce((acc: Record<string, string>, entry: any) => {
          if (!acc[entry.shift_id] && entry.branch_id) {
            acc[entry.shift_id] = entry.branch_id;
          }
          return acc;
        }, {});
      }
    }

    // Aggregate transactions by branch and payment method
    const branchTotals: Record<string, { cash: number; mpesa: number }> = {
      "Branch 1": { cash: 0, mpesa: 0 },
      "Branch 2": { cash: 0, mpesa: 0 },
      "Branch 3": { cash: 0, mpesa: 0 },
    };

    transactions?.forEach((tx: any) => {
      const rawBranch = tx.branch_id ?? shiftBranchMap[tx.shift_id] ?? tx.branch ?? tx.branchId ?? "";
      const branchStr = String(rawBranch).toLowerCase();

      let branchKey: "Branch 1" | "Branch 2" | "Branch 3" = "Branch 1";
      if (branchStr.includes("2")) branchKey = "Branch 2";
      else if (branchStr.includes("3")) branchKey = "Branch 3";

      if (branchTotals[branchKey]) {
        const amount = Number(tx.total) || 0;
        if (tx.payment_method === "cash") {
          branchTotals[branchKey].cash += amount;
        } else if (tx.payment_method === "mpesa") {
          branchTotals[branchKey].mpesa += amount;
        }
      }
    });

    // Get manual wholesale entries
    const { data: manualEntries, error: manualError } = await supabase
      .from("wholesale_summaries")
      .select("*")
      .eq("date", targetDate);

    if (manualError) throw manualError;

    // Merge manual entries with transaction aggregates
    const result = Object.keys(branchTotals).map((branch) => {
      const manual = manualEntries?.find((e: any) => e.branch === branch);
      const txData = branchTotals[branch];
      
      return {
        id: manual?.id || `auto-${branch}-${targetDate}`,
        date: targetDate,
        branch,
        cash_received: (manual?.cash_received || 0) + Math.round(txData.cash),
        mpesa_received: (manual?.mpesa_received || 0) + Math.round(txData.mpesa),
        is_aggregated: true,
        manual_cash: manual?.cash_received || 0,
        manual_mpesa: manual?.mpesa_received || 0,
        transaction_cash: Math.round(txData.cash),
        transaction_mpesa: Math.round(txData.mpesa),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching real-time summaries:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/wholesale-summaries", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("wholesale_summaries").select("*");
    if (req.query.branch) query = query.eq("branch", req.query.branch);
    if (req.query.date) query = query.eq("date", req.query.date as string);
    const { data, error } = await query.order("date", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/wholesale-summaries", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("wholesale_summaries").upsert([req.body]).select();
    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/wholesale-summaries/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("wholesale_summaries")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Summary not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/wholesale-summaries/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("wholesale_summaries").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Summary deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- STOCK MANAGEMENT ENDPOINTS ---

// 1. Get daily stock entries for a branch
app.get("/api/stock/daily", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { branch_id, date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    let query = supabase.from("shift_stock_entries").select("*, products(name, category, code)");
    if (branch_id) query = query.eq("branch_id", branch_id);
    query = query.eq("entry_date", queryDate);

    const { data, error } = await query.order("products(category)", { ascending: true });
    if (error) {
      console.error("[STOCK/DAILY] Error:", error);
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.error("[STOCK/DAILY] Catch error:", error);
    res.json([]);
  }
});

// 2. Add stock for a product
app.post("/api/stock/add", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { product_id, branch_id, added_stock_kg, notes } = req.body;
    const user = (req as any).user;

    if (!product_id || !added_stock_kg || added_stock_kg <= 0) {
      return res.status(400).json({ error: "Product ID and positive added_stock_kg required" });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get or create today's stock entry
    const { data: existing, error: getError } = await supabase
      .from("shift_stock_entries")
      .select("*")
      .eq("product_id", product_id)
      .eq("branch_id", branch_id || "branch1")
      .eq("entry_date", today)
      .single();

    if (getError && getError.code !== "PGRST116") {
      throw getError;
    }

    if (existing) {
      // Update existing entry
      const newAdded = (existing.added_stock_kg || 0) + parseFloat(added_stock_kg);
      const newClosing = (existing.opening_stock_kg || 0) + newAdded - (existing.sold_stock_kg || 0);
      
      const { data: updated, error: updateError } = await supabase
        .from("shift_stock_entries")
        .update({
          added_stock_kg: newAdded,
          closing_stock_kg: newClosing,
          is_low_stock: newClosing < (existing.low_stock_threshold_kg || 10),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      res.status(201).json(updated);
    } else {
      // Create new entry with yesterday's closing as opening
      const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];
      const { data: yesterday_entry } = await supabase
        .from("shift_stock_entries")
        .select("closing_stock_kg, low_stock_threshold_kg")
        .eq("product_id", product_id)
        .eq("branch_id", branch_id || "branch1")
        .eq("entry_date", yesterday)
        .single();

      const openingStock = yesterday_entry?.closing_stock_kg || 0;
      const threshold = yesterday_entry?.low_stock_threshold_kg || 10;
      const newClosing = openingStock + parseFloat(added_stock_kg);

      const { data: created, error: createError } = await supabase
        .from("shift_stock_entries")
        .insert({
          product_id,
          branch_id: branch_id || "branch1",
          entry_date: today,
          opening_stock_kg: openingStock,
          added_stock_kg: parseFloat(added_stock_kg),
          sold_stock_kg: 0,
          closing_stock_kg: newClosing,
          low_stock_threshold_kg: threshold,
          is_low_stock: newClosing < threshold,
          recorded_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      res.status(201).json(created);
    }
  } catch (error) {
    console.error("[STOCK/ADD] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 3. Update closing stock and sold stock
app.patch("/api/stock/closing/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { closing_stock_kg, sold_stock_kg } = req.body;
    const user = (req as any).user;

    const { data: entry, error: getError } = await supabase
      .from("shift_stock_entries")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (getError) throw getError;
    if (!entry) return res.status(404).json({ error: "Stock entry not found" });

    // Calculate variance
    const expectedClosing = (entry.opening_stock_kg || 0) + (entry.added_stock_kg || 0) - (sold_stock_kg || 0);
    const variance = (closing_stock_kg || expectedClosing) - expectedClosing;

    const { data: updated, error: updateError } = await supabase
      .from("shift_stock_entries")
      .update({
        sold_stock_kg: sold_stock_kg || entry.sold_stock_kg,
        closing_stock_kg: closing_stock_kg || expectedClosing,
        variance_kg: variance,
        is_low_stock: (closing_stock_kg || expectedClosing) < (entry.low_stock_threshold_kg || 10),
        adjusted_closing_stock_kg: closing_stock_kg ? closing_stock_kg : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create alert if variance exists
    if (Math.abs(variance) > 0.1) {
      await supabase.from("stock_alerts").insert({
        product_id: entry.product_id,
        branch_id: entry.branch_id,
        alert_type: "variance",
        message: `Stock variance of ${variance > 0 ? '+' : ''}${variance.toFixed(2)}kg detected`,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("[STOCK/CLOSING] Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 4. Get low-stock alerts
app.get("/api/stock/alerts", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { branch_id, resolved } = req.query;
    
    let query = supabase.from("stock_alerts").select("*, products(name, code), users(name)");
    if (branch_id) query = query.eq("branch_id", branch_id);
    if (resolved === "false") query = query.eq("is_resolved", false);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error("[STOCK/ALERTS] Error:", error);
      return res.json([]);
    }
    res.json(data || []);
  } catch (error) {
    console.error("[STOCK/ALERTS] Catch error:", error);
    res.json([]);
  }
});

// 5. Get stock summary for branch
app.get("/api/stock/summary", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { branch_id } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("shift_stock_entries")
      .select("*, products(name, category, code)")
      .eq("entry_date", today)
      .eq("branch_id", branch_id || "branch1")
      .order("products(category)", { ascending: true });

    if (error) {
      console.error("[STOCK/SUMMARY] Error:", error);
      return res.json({
        total_opening: 0,
        total_added: 0,
        total_sold: 0,
        total_closing: 0,
        low_stock_count: 0,
        entries: [],
      });
    }

    const entries = data || [];
    const summary = {
      total_opening: entries.reduce((sum, e) => sum + (e.opening_stock_kg || 0), 0),
      total_added: entries.reduce((sum, e) => sum + (e.added_stock_kg || 0), 0),
      total_sold: entries.reduce((sum, e) => sum + (e.sold_stock_kg || 0), 0),
      total_closing: entries.reduce((sum, e) => sum + (e.closing_stock_kg || 0), 0),
      low_stock_count: entries.filter(e => e.is_low_stock).length,
      entries,
    };

    res.json(summary);
  } catch (error) {
    console.error("[STOCK/SUMMARY] Catch error:", error);
    res.json({
      total_opening: 0,
      total_added: 0,
      total_sold: 0,
      total_closing: 0,
      low_stock_count: 0,
      entries: [],
    });
  }
});

// ============================================================================
// AI ASSISTANT ENDPOINTS
// ============================================================================

// Helper: Gather system context for AI
const gatherAIContext = async () => {
  try {
    // Fetch products with current stock levels
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, stock_kg, low_stock_threshold_kg");

    // Fetch cashiers
    const { data: cashiers } = await supabase
      .from("users")
      .select("id, name, role")
      .eq("role", "cashier");

    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = sevenDaysAgoDate.toISOString();
    const sevenDaysAgoDateOnly = sevenDaysAgoDate.toISOString().split("T")[0];

    // Fetch recent shifts with stock entries
    const { data: shiftStockEntries } = await supabase
      .from("shift_stock_entries")
      .select(
        `
        id, shift_id, cashier_id, branch_id, product_id,
        opening_stock, added_stock, sold_stock, closing_stock, variance,
        shift_date,
        products(name),
        users(name)
        `
      )
      .gte("shift_date", sevenDaysAgoDateOnly)
      .order("shift_date", { ascending: false })
      .limit(50);

    // Fetch recent transactions (sales)
    const { data: transactions } = await supabase
      .from("transactions")
      .select(
        `
        id, cashier_id, created_at, items, total, payment_method,
        users(name)
        `
      )
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    // Calculate low-stock items
    const lowStockItems = (products || []).filter(
      (p: any) => p.stock_kg < (p.low_stock_threshold_kg || 10)
    );

    // Calculate sales summary by product and cashier payment totals
    const salesSummary: Record<string, any> = {};
    const cashierPayments: Record<string, any> = {};
    (transactions || []).forEach((t: any) => {
      const cashierKey = t.cashier_id || "unknown";
      const cashierName = t.users?.name || cashierKey;
      if (!cashierPayments[cashierKey]) {
        cashierPayments[cashierKey] = {
          cashier_id: cashierKey,
          cashier_name: cashierName,
          cash: 0,
          mpesa: 0,
          card: 0,
          total: 0,
        };
      }
      const method = (t.payment_method || "").toLowerCase();
      if (method === "cash") cashierPayments[cashierKey].cash += Number(t.total || 0);
      if (method === "mpesa") cashierPayments[cashierKey].mpesa += Number(t.total || 0);
      if (method === "card") cashierPayments[cashierKey].card += Number(t.total || 0);
      cashierPayments[cashierKey].total += Number(t.total || 0);

      let items: any[] = [];
      if (Array.isArray(t.items)) {
        items = t.items;
      } else if (typeof t.items === "string") {
        try {
          items = JSON.parse(t.items);
        } catch (_err) {
          items = [];
        }
      }

      items.forEach((item: any) => {
        const productName = item.productName || item.name || "Unknown";
        if (!salesSummary[productName]) {
          salesSummary[productName] = { quantity: 0, revenue: 0, count: 0 };
        }
        salesSummary[productName].quantity += Number(item.weightKg || 0);
        salesSummary[productName].revenue += Number(item.totalPrice || 0) || 0;
        salesSummary[productName].count += 1;
      });
    });

    // Aggregate shift summaries by cashier
    const cashierShiftSummary: Record<string, any> = {};
    (shiftStockEntries || []).forEach((entry: any) => {
      const cashierKey = entry.cashier_id || "unknown";
      const cashierName = entry.users?.name || cashierKey;
      if (!cashierShiftSummary[cashierKey]) {
        cashierShiftSummary[cashierKey] = {
          cashier_id: cashierKey,
          cashier_name: cashierName,
          opening_stock: 0,
          added_stock: 0,
          sold_stock: 0,
          closing_stock: 0,
          variance: 0,
        };
      }
      cashierShiftSummary[cashierKey].opening_stock += Number(entry.opening_stock || 0);
      cashierShiftSummary[cashierKey].added_stock += Number(entry.added_stock || 0);
      cashierShiftSummary[cashierKey].sold_stock += Number(entry.sold_stock || 0);
      cashierShiftSummary[cashierKey].closing_stock += Number(entry.closing_stock || 0);
      cashierShiftSummary[cashierKey].variance += Number(entry.variance || 0);
    });

    // Identify cashier discrepancies
    const discrepancies = (shiftStockEntries || []).filter(
      (entry: any) => Math.abs(entry.variance || 0) > 0.1
    );

    return {
      products: products || [],
      cashiers: cashiers || [],
      lowStockItems,
      recentShiftEntries: shiftStockEntries || [],
      recentTransactions: transactions || [],
      salesSummary,
      cashierPayments,
      cashierShiftSummary,
      discrepancies,
      contextTimestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error gathering AI context:", error);
    return {
      products: [],
      cashiers: [],
      lowStockItems: [],
      recentShiftEntries: [],
      recentTransactions: [],
      salesSummary: {},
      cashierPayments: {},
      cashierShiftSummary: {},
      discrepancies: [],
      contextTimestamp: new Date().toISOString(),
      error: "Failed to gather context",
    };
  }
};

// ===== NEW REPORTING ENDPOINTS =====

// 1. Wastage Report - Track daily losses
app.get("/api/reports/wastage", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { period } = req.query; // "today", "week", "month"
    let startDate = new Date();
    
    if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);
    else startDate.setHours(0, 0, 0, 0); // today
    
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get shift history with sales data to calculate wastage
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("*, transactions(id, items)")
      .gte("shift_date", startDateStr)
      .order("shift_date", { ascending: false });

    if (shiftsError || !shifts) {
      return res.json([]);
    }

    let wastageData: any[] = [];

    // For now, calculate based on inventory variance (difference between expected and actual)
    for (const shift of shifts) {
      const { data: shiftStock } = await supabase
        .from("shift_stock_entries")
        .select("*, products(name, unit, cost_per_unit)")
        .eq("shift_id", shift.id);

      if (shiftStock) {
        for (const entry of shiftStock) {
          const variance = (entry.opening_stock || 0) + (entry.added_stock || 0) - (entry.closing_stock || 0) - (entry.sold_stock || 0);
          if (variance > 0) {
            wastageData.push({
              product_name: entry.products?.name || "Unknown",
              quantity_wasted: variance,
              unit: entry.products?.unit || "kg",
              reason: "variance", // Could be spoilage, trimming, damage, etc.
              date: shift.shift_date,
              cashier_name: shift.cashier_name,
              cost_lost: variance * (entry.products?.cost_per_unit || 0),
            });
          }
        }
      }
    }

    res.json(wastageData);
  } catch (error) {
    console.error("[WASTAGE REPORT] Error:", error);
    res.json([]);
  }
});

// 2. Daily Reconciliation - Cash vs Expected
app.get("/api/reports/reconciliation", authenticateToken, async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: shifts } = await supabase
      .from("shifts")
      .select("*, transactions(id, items, payment_method, amount)")
      .eq("shift_date", today)
      .order("created_at", { ascending: false });

    if (!shifts) {
      return res.json([]);
    }

    const reconciliations: any[] = [];

    for (const shift of shifts) {
      if (!shift.transactions) continue;

      // Calculate expected total from transactions
      const expectedTotal = (shift.transactions as any[]).reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Calculate actual by payment method
      const actualCash = (shift.transactions as any[])
        .filter((tx: any) => tx.payment_method === "cash")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      const actualMpesa = (shift.transactions as any[])
        .filter((tx: any) => tx.payment_method === "mpesa")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      reconciliations.push({
        shift_date: shift.shift_date,
        expected_total: expectedTotal,
        actual_cash: actualCash,
        actual_mpesa: actualMpesa,
        difference: (actualCash + actualMpesa) - expectedTotal,
        cashier_name: shift.cashier_name,
        notes: "Daily reconciliation record",
      });
    }

    res.json(reconciliations);
  } catch (error) {
    console.error("[RECONCILIATION] Error:", error);
    res.json([]);
  }
});

// 3. Cashier KPIs - Performance metrics
app.get("/api/reports/cashier-kpis", authenticateToken, async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all shifts for today
    const { data: shifts } = await supabase
      .from("shifts")
      .select("*, transactions(id, items, amount)")
      .eq("shift_date", today);

    if (!shifts) {
      return res.json([]);
    }

    const kpisMap = new Map<string, any>();

    for (const shift of shifts) {
      const cashierId = shift.cashier_id;
      if (!kpisMap.has(cashierId)) {
        kpisMap.set(cashierId, {
          cashier_id: cashierId,
          cashier_name: shift.cashier_name,
          total_sales: 0,
          transaction_count: 0,
          avg_transaction: 0,
          shift_hours: 0,
          sales_per_hour: 0,
        });
      }

      const kpi = kpisMap.get(cashierId);
      const transactions = shift.transactions as any[];
      if (transactions) {
        const sales = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        kpi.total_sales += sales;
        kpi.transaction_count += transactions.length;
      }

      // Calculate shift hours
      const openTime = new Date(shift.opening_time || "");
      const closeTime = shift.closing_time ? new Date(shift.closing_time) : new Date();
      kpi.shift_hours += (closeTime.getTime() - openTime.getTime()) / (1000 * 60 * 60);
    }

    // Calculate averages
    const kpis = Array.from(kpisMap.values()).map((kpi) => ({
      ...kpi,
      avg_transaction: kpi.transaction_count > 0 ? kpi.total_sales / kpi.transaction_count : 0,
      sales_per_hour: kpi.shift_hours > 0 ? kpi.total_sales / kpi.shift_hours : 0,
    }));

    res.json(kpis);
  } catch (error) {
    console.error("[CASHIER KPIs] Error:", error);
    res.json([]);
  }
});

// 4. Stock Adjustments - Record inventory corrections
app.post("/api/stock/adjustments", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { adjustments } = req.body;
    const userId = (req as any).user?.id;

    if (!adjustments || adjustments.length === 0) {
      return res.status(400).json({ error: "No adjustments provided" });
    }

    const adjustmentRecords = adjustments.map((adj: any) => ({
      product_id: adj.product_id,
      adjustment_type: adj.adjustment_type,
      quantity: adj.quantity,
      reason: adj.reason,
      notes: adj.notes || "",
      adjusted_by: userId,
      adjustment_date: new Date().toISOString(),
    }));

    // Insert adjustment records
    const { error: insertError } = await supabase
      .from("stock_adjustments")
      .insert(adjustmentRecords);

    if (insertError) {
      console.error("[STOCK ADJUSTMENTS] Insert error:", insertError);
      return res.status(400).json({ error: insertError.message });
    }

    // Update product stock quantities
    for (const adj of adjustments) {
      if (adj.adjustment_type === "increase") {
        // Increase stock
        const { data: product } = await supabase
          .from("products")
          .select("stock_kg")
          .eq("id", adj.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_kg: (product.stock_kg || 0) + adj.quantity })
            .eq("id", adj.product_id);
        }
      } else if (adj.adjustment_type === "decrease") {
        // Decrease stock
        const { data: product } = await supabase
          .from("products")
          .select("stock_kg")
          .eq("id", adj.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({ stock_kg: Math.max(0, (product.stock_kg || 0) - adj.quantity) })
            .eq("id", adj.product_id);
        }
      }
    }

    // Log to inventory ledger
    const ledgerEntries = adjustments.map((adj: any) => ({
      item_id: adj.product_id,
      event_type: "ADJUSTMENT",
      quantity_kg: adj.adjustment_type === "increase" ? adj.quantity : -adj.quantity,
      user_id: userId,
      reference_id: `adjustment-${new Date().getTime()}`,
    }));

    await supabase.from("inventory_ledger").insert(ledgerEntries);

    res.json({ success: true, message: "Stock adjustments applied successfully" });
  } catch (error) {
    console.error("[STOCK ADJUSTMENTS] Catch error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// AI Chat endpoint
app.post("/api/ai/chat", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  const { query } = req.body;
  const userId = (req as any).user?.id;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  if (aiProvider === "openai" && !openai) {
    return res.status(503).json({ error: "AI service is not configured. Please add OPENAI_API_KEY to environment." });
  }
  if (aiProvider === "openrouter" && !openRouter) {
    return res.status(503).json({ error: "AI service is not configured. Please add OPENROUTER_API_KEY to environment." });
  }

  try {
    // Gather context from POS system
    const context = await gatherAIContext();

    // Prepare system prompt with POS context
    const systemPrompt = `You are an AI assistant for a multi-butchery POS system called "Eden Drop 001". Your role is to help admins make data-driven decisions.

CURRENT SYSTEM DATA:
- Total Products: ${context.products.length}
- Cashiers: ${context.cashiers.length}
- Low Stock Items: ${context.lowStockItems.length} (threshold breached)
- Recent Shifts Analyzed: ${context.recentShiftEntries.length}
- Recent Transactions: ${context.recentTransactions.length}
- Cashier Discrepancies Found: ${context.discrepancies.length}

CASHIER DIRECTORY:
${(context.cashiers || []).map((c: any) => `- ${c.name} (ID: ${c.id})`).join("\n") || "No cashiers found"}

LOW STOCK ALERTS:
${context.lowStockItems.map((item: any) => `- ${item.name}: ${item.stock_kg}kg (threshold: ${item.low_stock_threshold_kg}kg)`).join("\n") || "None"}

TOP SELLING ITEMS (Last 7 days):
${Object.entries(context.salesSummary)
  .sort(([, a]: any, [, b]: any) => b.quantity - a.quantity)
  .slice(0, 5)
  .map(([name, data]: any) => `- ${name}: ${data.quantity.toFixed(1)}kg sold, ${data.count} transactions`)
  .join("\n") || "No sales data"}

CASHIER PAYMENT TOTALS (Last 7 days):
${Object.values(context.cashierPayments || {})
  .map((c: any) => `- ${c.cashier_name}: Cash ${c.cash.toFixed(2)}, M-Pesa ${c.mpesa.toFixed(2)}, Card ${c.card.toFixed(2)}, Total ${c.total.toFixed(2)}`)
  .join("\n") || "No cashier payment data"}

CASHIER SHIFT SUMMARIES (Last 7 days):
${Object.values(context.cashierShiftSummary || {})
  .map((c: any) => `- ${c.cashier_name}: Opening ${c.opening_stock.toFixed(1)}kg, Added ${c.added_stock.toFixed(1)}kg, Sold ${c.sold_stock.toFixed(1)}kg, Closing ${c.closing_stock.toFixed(1)}kg, Variance ${c.variance.toFixed(1)}kg`)
  .join("\n") || "No shift summaries"}

RECENT DISCREPANCIES (Variance > 0.1kg):
${context.discrepancies.slice(0, 5).map((d: any) => `- Shift ${d.shift_id.slice(0, 8)}: ${d.products?.name || "Unknown"} (Variance: ${d.variance?.toFixed(2)}kg)`).join("\n") || "None"}

Your responses should be:
1. Concise and actionable
2. Focused on inventory optimization, loss prevention, and sales insights
3. Data-driven with specific metrics
4. Include warnings for critical issues (low stock, high variance)
5. Suggest specific actions (e.g., "Restock beef by 50kg", "Investigate cashier discrepancy")

If a user asks about a specific cashier (e.g., "Cashier 1"), respond with:
- Opening stock, added stock, sold stock, closing stock, and variance totals
- Expected cash and M-Pesa totals (and card if available)
- Any discrepancies or unusual patterns
If the cashier name is unclear, list available cashiers from the directory.

Always be helpful, professional, and safety-conscious. Flag any suspicious patterns (theft, damage, counting errors).`;

    let assistantResponse = "No response generated";
    if (aiProvider === "ollama") {
      const ollamaRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          stream: false,
          options: { temperature: 0.7 },
        }),
      });

      if (!ollamaRes.ok) {
        const errText = await ollamaRes.text();
        throw new Error(`Ollama error: ${ollamaRes.status} ${errText}`);
      }

      const ollamaJson = await ollamaRes.json();
      assistantResponse = ollamaJson?.message?.content || assistantResponse;
    } else if (aiProvider === "openrouter" && openRouter) {
      const response = await openRouter.chat.completions.create({
        model: openRouterModel,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      assistantResponse = response.choices[0]?.message?.content || assistantResponse;
    } else if (openai) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      assistantResponse = response.choices[0]?.message?.content || assistantResponse;
    }

    // Optional: Log AI interaction
    try {
      await supabase.from("ai_logs").insert({
        admin_id: userId,
        query,
        response: assistantResponse,
        context_summary: `${context.lowStockItems.length} low-stock, ${context.discrepancies.length} discrepancies`,
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Failed to log AI interaction (non-critical):", logError);
    }

    res.json({
      response: assistantResponse,
      context: {
        lowStockCount: context.lowStockItems.length,
        discrepancyCount: context.discrepancies.length,
        topSellingItems: Object.entries(context.salesSummary)
          .sort(([, a]: any, [, b]: any) => b.quantity - a.quantity)
          .slice(0, 3),
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      error: "Failed to process AI request",
      details: (error as Error).message,
    });
  }
});

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    // eslint-disable-next-line no-console
    console.log(`Eden Drop 001 backend listening on port ${PORT}`);
    try {
      // Run migration to ensure required tables exist
      await ensureShiftStockEntriesTable();
      
      const { data, error } = await supabase.from("products").select("id").limit(1);
      if (error) console.error("Supabase connection error:", error.message);
      else console.log("Successfully connected to Supabase database.");
    } catch (err) {
      console.error("Failed to reach Supabase:", (err as Error).message);
    }
  });
}

export default app;
