import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "eden-drop-001-secret-key-2026";

// Lazy-load Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY environment variables are required");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// ====================================================================
// MIDDLEWARE: Verify JWT and admin role
// ====================================================================
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const verifyAdminToken = (req: AuthRequest, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.userId, role: decoded.role };

    // Check if admin
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can manage users" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ====================================================================
// GET /api/admin/users - List all users
// ====================================================================
router.get("/", verifyAdminToken, async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, role, email, phone, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ users: data || [] });
  } catch (err: any) {
    console.error("[USER MANAGEMENT] Get users error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// POST /api/admin/users - Create new user
// ====================================================================
router.post("/", verifyAdminToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, role, email, phone, password } = req.body;

    // Validation
    if (!id || !name || !role) {
      return res
        .status(400)
        .json({ error: "id, name, and role are required" });
    }

    if (!["admin", "manager", "cashier"].includes(role)) {
      return res
        .status(400)
        .json({ error: "role must be admin, manager, or cashier" });
    }

    // Check if user already exists
    const supabase = getSupabaseClient();
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: "User with this ID already exists" });
    }

    // Create user
    const { data: newUser, error: insertError } = await getSupabaseClient()
      .from("users")
      .insert([
        {
          id,
          name,
          role,
          email: email || null,
          phone: phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (insertError) throw insertError;

    console.log(
      `[USER MANAGEMENT] User created: ${id} (${role}) by admin ${req.user?.id}`
    );

    return res.status(201).json({
      message: "User created successfully",
      user: newUser?.[0],
    });
  } catch (err: any) {
    console.error("[USER MANAGEMENT] Create user error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// PATCH /api/admin/users/:id - Update user
// ====================================================================
router.patch(
  "/:id",
  verifyAdminToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, role, email, phone, password } = req.body;

      // Validation
      if (!name && !role && !email && !phone && !password) {
        return res
          .status(400)
          .json({ error: "At least one field must be provided" });
      }

      if (role && !["admin", "manager", "cashier"].includes(role)) {
        return res
          .status(400)
          .json({ error: "role must be admin, manager, or cashier" });
      }

      // Prevent changing own role (security)
      if (role && req.user?.id === id && role !== req.user?.role) {
        return res.status(403).json({
          error: "Admins cannot change their own role",
        });
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;

      // Update user
      const { data: updatedUser, error: updateError } = await getSupabaseClient()
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select();

      if (updateError) throw updateError;

      if (!updatedUser || updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(
        `[USER MANAGEMENT] User updated: ${id} by admin ${req.user?.id}`
      );

      return res.json({
        message: "User updated successfully",
        user: updatedUser[0],
      });
    } catch (err: any) {
      console.error("[USER MANAGEMENT] Update user error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// ====================================================================
// DELETE /api/admin/users/:id - Delete user
// ====================================================================
router.delete(
  "/:id",
  verifyAdminToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Prevent deleting self
      if (req.user?.id === id) {
        return res.status(403).json({ error: "Cannot delete your own account" });
      }

      // Delete user
      const { data: deletedUser, error: deleteError } = await getSupabaseClient()
        .from("users")
        .delete()
        .eq("id", id)
        .select();

      if (deleteError) throw deleteError;

      if (!deletedUser || deletedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(
        `[USER MANAGEMENT] User deleted: ${id} by admin ${req.user?.id}`
      );

      return res.json({ message: "User deleted successfully" });
    } catch (err: any) {
      console.error("[USER MANAGEMENT] Delete user error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

// ====================================================================
// POST /api/admin/users/:id/reset-password - Reset user password
// ====================================================================
router.post(
  "/:id/reset-password",
  verifyAdminToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: "newPassword is required" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      // Hash password (same way as Supabase does it)
      const hashedPassword = bcryptjs.hashSync(newPassword, 10);

      // Update password in users table
      const { data: updatedUser, error: updateError } = await getSupabaseClient()
        .from("users")
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (updateError) throw updateError;

      if (!updatedUser || updatedUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(
        `[USER MANAGEMENT] Password reset for user: ${id} by admin ${req.user?.id}`
      );

      return res.json({
        message: "Password reset successfully",
        user: {
          id: updatedUser[0].id,
          name: updatedUser[0].name,
          role: updatedUser[0].role,
        },
      });
    } catch (err: any) {
      console.error("[USER MANAGEMENT] Reset password error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
