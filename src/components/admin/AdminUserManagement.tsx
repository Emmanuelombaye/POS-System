import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Key,
  X,
  Check,
  AlertCircle,
  Loader,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAppStore } from "@/store/appStore";

interface User {
  id: string;
  name: string;
  role: "admin" | "manager" | "cashier";
  email?: string;
  phone?: string;
  created_at?: string;
}

interface EditingUser extends User {
  password?: string;
}

export const AdminUserManagement = () => {
  const { token } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"list" | "add" | "edit">(
    "list"
  );
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "cashier" as "admin" | "manager" | "cashier",
    email: "",
    phone: "",
    password: "",
  });
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (
        !formData.id ||
        !formData.name ||
        !formData.role
      ) {
        setError("ID, name, and role are required");
        return;
      }

      if (users.some((u) => u.id === formData.id)) {
        setError("User with this ID already exists");
        return;
      }

      const response = await api.post("/api/admin/users", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        `User "${formData.name}" created successfully with ID "${formData.id}"`
      );
      setFormData({
        id: "",
        name: "",
        role: "cashier",
        email: "",
        phone: "",
        password: "",
      });
      fetchUsers();
      setTimeout(() => setSelectedTab("list"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setError(null);
      setSuccess(null);

      const updateData = {
        name: editingUser.name,
        role: editingUser.role,
        email: editingUser.email,
        phone: editingUser.phone,
      };

      await api.patch(`/api/admin/users/${editingUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`User "${editingUser.name}" updated successfully`);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSelectedTab("list"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      await api.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`User "${userName}" deleted successfully`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordModal || !newPassword) return;

    try {
      setPasswordLoading(true);
      setError(null);
      setSuccess(null);

      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      await api.post(
        `/api/admin/users/${resetPasswordModal.userId}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(
        `Password reset for "${resetPasswordModal.userName}" successfully`
      );
      setResetPasswordModal(null);
      setNewPassword("");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600">
              Manage admins, managers, and cashiers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab("list")}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            selectedTab === "list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => {
            setSelectedTab("add");
            setFormData({
              id: "",
              name: "",
              role: "cashier",
              email: "",
              phone: "",
              password: "",
            });
          }}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            selectedTab === "add"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{success}</p>
        </motion.div>
      )}

      {/* Content */}
      {selectedTab === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-700"
                              : user.role === "manager"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">ID: {user.id}</p>
                      {user.email && (
                        <p className="text-sm text-gray-600">{user.email}</p>
                      )}
                      {user.phone && (
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setSelectedTab("edit");
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="Edit user"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setResetPasswordModal({ userId: user.id, userName: user.name })
                        }
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {selectedTab === "add" && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleAddUser}
          className="space-y-4 max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value.toLowerCase() })
                }
                placeholder="e.g., c4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "admin" | "manager" | "cashier",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@edendrop001.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+254 700 000 000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create User
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab("list")}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {selectedTab === "edit" && editingUser && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleUpdateUser}
          className="space-y-4 max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User ID (Read-only)
              </label>
              <input
                type="text"
                value={editingUser.id}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as "admin" | "manager" | "cashier",
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={editingUser.email || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={editingUser.phone || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Update User
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setSelectedTab("list");
              }}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
            </div>

            <p className="text-gray-600">
              Enter new password for <strong>{resetPasswordModal.userName}</strong>
            </p>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                disabled={passwordLoading || newPassword.length < 8}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                {passwordLoading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                <X className="w-4 h-4 inline" /> Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
