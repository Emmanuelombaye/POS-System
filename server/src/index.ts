import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";
const JWT_SECRET = process.env.JWT_SECRET || "eden-top-secret-key-2026";

const supabase = createClient(supabaseUrl, supabaseKey);

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
  res.json({ status: "ok", service: "eden-top-backend", database: "supabase" });
});

// Auth Login endpoint
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "User ID and password are required." });
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "User not found." });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: "Account not configured. Contact admin." });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Products Endpoints ---

app.get("/products", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/products", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("products").upsert([req.body]).select();
    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.patch("/products/:id", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
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

app.delete("/products/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Users Endpoints ---

app.get("/users", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("users").select("id, name, role");
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/users", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
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

app.patch("/users/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
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

app.delete("/users/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Transactions Endpoints ---

app.get("/transactions", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/transactions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const transaction = req.body;
    const { data: tx, error: txError } = await supabase.from("transactions").insert([transaction]).select().single();
    if (txError) throw txError;

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

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- SSR Endpoints (Shifts & Stock Reconciliation) ---

// 1. Shifts
app.get("/shifts", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("shifts").select("*, users(name)");
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.cashier_id) query = query.eq("cashier_id", req.query.cashier_id);

    const { data, error } = await query.order("opened_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/shifts/open", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cashier_id } = req.body;
    // Check if cashier already has an open shift
    const { data: existing } = await supabase.from("shifts").select("id").eq("cashier_id", cashier_id).eq("status", "OPEN").single();
    if (existing) return res.status(400).json({ error: "Cashier already has an open shift." });

    const { data: shift, error } = await supabase.from("shifts").insert([{ cashier_id, status: 'OPEN' }]).select().single();
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
    }

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/shifts/:id/close", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { actual_counts } = req.body; // Map item_id -> actual_kg
    const shiftId = req.params.id;

    // 1. Update shift status
    const { data: shift, error: shiftError } = await supabase
      .from("shifts")
      .update({ status: 'PENDING_REVIEW', closed_at: new Date().toISOString() })
      .eq("id", shiftId)
      .select().single();

    if (shiftError) throw shiftError;

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

      await supabase
        .from("shift_stock_snapshots")
        .update({
          actual_closing_kg: actualKg,
          expected_closing_kg: expectedKg,
          variance_kg: variance
        })
        .eq("shift_id", shiftId)
        .eq("item_id", itemId);

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

// 2. Stock Additions
app.get("/stock-additions", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("stock_additions").select("*, products(name), shifts(cashier_id)");
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.shift_id) query = query.eq("shift_id", req.query.shift_id);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/stock-additions", authenticateToken, async (req: Request, res: Response) => {
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

app.patch("/stock-additions/:id/approve", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
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

app.get("/wholesale-summaries", authenticateToken, async (req: Request, res: Response) => {
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

app.post("/wholesale-summaries", authenticateToken, authorizeRoles("admin", "manager"), async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("wholesale_summaries").upsert([req.body]).select();
    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/wholesale-summaries/:id", authenticateToken, async (req: Request, res: Response) => {
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

app.delete("/wholesale-summaries/:id", authenticateToken, authorizeRoles("admin"), async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("wholesale_summaries").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Summary deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    // eslint-disable-next-line no-console
    console.log(`Eden Top backend listening on port ${PORT}`);
    try {
      const { data, error } = await supabase.from("products").select("id").limit(1);
      if (error) console.error("Supabase connection error:", error.message);
      else console.log("Successfully connected to Supabase database.");
    } catch (err) {
      console.error("Failed to reach Supabase:", (err as Error).message);
    }
  });
}

export default app;
