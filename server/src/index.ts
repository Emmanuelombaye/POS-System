import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "https://glskbegsmdrylrhczpyy.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_waCCK6KyQPWQlCQHpzVucQ_5ytpKQcQ";

const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "eden-top-backend", database: "supabase" });
});

// Products endpoints
app.get("/products", async (_req, res) => {
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

app.post("/products", async (req, res) => {
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
app.get("/users", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/users", async (req, res) => {
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
app.get("/transactions", async (_req, res) => {
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

app.post("/transactions", async (req, res) => {
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
app.get("/wholesale-summaries", async (req, res) => {
  try {
    let query = supabase.from("wholesale_summaries").select("*");

    // Optional filters
    if (req.query.branch) {
      query = query.eq("branch", req.query.branch);
    }
    if (req.query.date) {
      query = query.eq("date", req.query.date);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/wholesale-summaries", async (req, res) => {
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

app.get("/wholesale-summaries/:id", async (req, res) => {
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

app.delete("/wholesale-summaries/:id", async (req, res) => {
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

