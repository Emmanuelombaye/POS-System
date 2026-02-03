import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  MoreVertical,
  Crown,
  Briefcase,
  CreditCard,
} from "lucide-react";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "bg-red-500",
    lightBg: "bg-red-50",
    textColor: "text-red-600",
    description: "Full system access",
  },
  manager: {
    label: "Manager",
    icon: Briefcase,
    color: "bg-amber-500",
    lightBg: "bg-amber-50",
    textColor: "text-amber-600",
    description: "Branch management & oversight",
  },
  cashier: {
    label: "Cashier",
    icon: CreditCard,
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-600",
    description: "Sales & transactions",
  },
};

export const UserManagement = () => {
  const { users, currentUser, addUser, updateUserRole, deleteUser } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<"all" | "admin" | "manager" | "cashier">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    role: "cashier" as "admin" | "manager" | "cashier",
    password: "",
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const handleAddUser = () => {
    if (!formData.name || !formData.password) {
      alert("Please fill in all fields");
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: formData.name,
      role: formData.role,
    };

    addUser(newUser, currentUser?.id || "system", formData.password);
    setShowAddModal(false);
    setFormData({ name: "", role: "cashier", password: "" });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(userId, currentUser?.id || "system");
    }
  };

  const handleRoleChange = (userId: string, newRole: "admin" | "manager" | "cashier") => {
    if (userId === currentUser?.id) {
      alert("You cannot change your own role");
      return;
    }
    updateUserRole(userId, newRole, currentUser?.id || "system");
    setEditingUser(null);
  };

  const roleStats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    manager: users.filter((u) => u.role === "manager").length,
    cashier: users.filter((u) => u.role === "cashier").length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-brand-burgundy" />
            User Management
          </h1>
          <p className="text-gray-500 font-semibold mt-1">Manage system users, roles, and permissions</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-brand-burgundy to-red-600 h-12 px-6 font-black shadow-lg"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-black text-gray-900 mt-2">{roleStats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const Icon = config.icon;
          const count = roleStats[role as keyof typeof roleStats];
          return (
            <Card key={role} className="border-2 border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{config.label}s</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{count}</p>
                  </div>
                  <div className={`p-3 ${config.lightBg} rounded-xl`}>
                    <Icon className={`h-6 w-6 ${config.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search users by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base font-semibold bg-white border-2 border-gray-200 focus:border-brand-burgundy rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          {["all", "admin", "manager", "cashier"].map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role as any)}
              className={`font-bold capitalize ${
                selectedRole === role
                  ? "bg-brand-burgundy text-white"
                  : "border-2 border-gray-200 hover:border-brand-burgundy/30"
              }`}
            >
              {role === "all" ? "All Users" : role}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-600 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredUsers.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role];
                    const RoleIcon = roleConfig.icon;
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${roleConfig.color} flex items-center justify-center text-white font-black`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 flex items-center gap-2">
                                {user.name}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingUser === user.id ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 font-bold"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="cashier">Cashier</option>
                            </select>
                          ) : (
                            <div className={`inline-flex items-center gap-2 ${roleConfig.lightBg} ${roleConfig.textColor} px-3 py-1.5 rounded-lg font-bold text-sm`}>
                              <RoleIcon className="h-4 w-4" />
                              {roleConfig.label}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                            {user.id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!isCurrentUser && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                                  className="text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-6">Add New User</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="h-12 text-base"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 font-semibold"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Initial Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set initial password"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-12 font-bold border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  className="flex-1 h-12 font-bold bg-gradient-to-r from-brand-burgundy to-red-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
