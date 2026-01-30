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

    // Check password
    if (!user.password_hash) {
      return res.status(401).json({ error: "Account not configured with a password. Please contact admin." });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password." });
    }

    // Generate JWT
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

// Products endpoints
app.get("/products", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/products", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Users endpoints
app.get("/users", async (_req: Request, res: Response) => {
  try {
    // Public endpoint for profile selector on login page
    const { data, error } = await supabase
      .from("users")
      .select("id, name, role");

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/users", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Transactions endpoints
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
    const { data, error } = await supabase
      .from("transactions")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data?.[0]);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Wholesale Summaries endpoints
app.get("/wholesale-summaries", authenticateToken, async (req: Request, res: Response) => {
  try {
    let query = supabase.from("wholesale_summaries").select("*");

    // Optional filters
    if (req.query.branch) {
      query = query.eq("branch", req.query.branch);
    }
    if (req.query.date) {
      query = query.eq("date", req.query.date as string);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/wholesale-summaries", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("wholesale_summaries")
      .insert([req.body])
      .select();

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
    if (!data) {
      res.status(404).json({ error: "Summary not found" });
      return;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/wholesale-summaries/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("wholesale_summaries")
      .delete()
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      res.status(404).json({ error: "Summary not found" });
      return;
    }
    res.json({ message: "Summary deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

const PORT = process.env.PORT || 4000;

// Vercel handles the listening, but Render (and local) needs it.
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    // eslint-disable-next-line no-console
    console.log(`Eden Top backend listening on port ${PORT}`);

    // Verify Supabase connection
    try {
      const { data, error } = await supabase.from("products").select("id").limit(1);
      if (error) {
        console.error("Supabase connection error:", error.message);
      } else {
        console.log("Successfully connected to Supabase database.");
      }
    } catch (err) {
      console.error("Failed to reach Supabase:", (err as Error).message);
    }
  });
}

export default app;
