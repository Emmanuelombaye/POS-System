import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore, Role, User } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, summarizeTransactionsByDay } from "@/utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const AdminDashboard = () => {
  const {
    transactions,
    products,
    users,
    settings,
    auditLog,
    addUser,
    updateUserRole,
    updateSettings,
  } = useAppStore();

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("cashier");

  const revenueByDay = useMemo(
    () => summarizeTransactionsByDay(transactions),
    [transactions]
  );

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number }
    >();
    for (const tx of transactions) {
      for (const i of tx.items) {
        const existing = map.get(i.productId) ?? {
          name: i.productName,
          total: 0,
        };
        existing.total += i.pricePerKg * i.weightKg;
        map.set(i.productId, existing);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  const handleCreateUser = () => {
    if (!newUserName.trim()) return;
    const user: User = {
      id: crypto.randomUUID(),
      name: newUserName.trim(),
      role: newUserRole,
    };
    addUser(user, "a1");
    setNewUserName("");
  };

  const handleSettingsChange = (field: keyof typeof settings, value: any) => {
    updateSettings({ [field]: value }, "a1");
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-2 sm:px-4 py-3 sm:py-4">
      {/* Navigation to Wholesale Desk */}
      <div>
        <Link to="/admin/wholesale">
          <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto text-sm">
            → Wholesale Desk
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="text-2xl font-semibold">
              {formatCurrency(
                transactions
                  .filter((tx) => {
                    const d = new Date(tx.createdAt);
                    const today = new Date();
                    return (
                      d.getDate() === today.getDate() &&
                      d.getMonth() === today.getMonth() &&
                      d.getFullYear() === today.getFullYear()
                    );
                  })
                  .reduce((sum, tx) => sum + tx.total, 0),
                settings
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Live total of all cashier sales for the current day.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active products</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="text-2xl font-semibold">
              {products.filter((p) => p.isActive).length}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Products currently visible in the POS. Manage catalogue below.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="text-2xl font-semibold">{users.length}</div>
            <p className="mt-1 text-[11px] text-slate-400">
              Cashiers, managers, and admins with access to this system.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1.6fr,1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent className="h-48 sm:h-64">
            {revenueByDay.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No revenue yet. Once cashiers start selling, trends appear here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(v) =>
                      `${settings.currency} ${Number(v).toLocaleString()}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value: any) =>
                      `${settings.currency} ${Number(value).toLocaleString()}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#f97373"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="h-48 sm:h-64">
            {topProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No product performance data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(v) =>
                      `${settings.currency} ${Number(v).toLocaleString()}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#020617",
                      border: "1px solid #1f2937",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(value: any) =>
                      `${settings.currency} ${Number(value).toLocaleString()}`
                    }
                  />
                  <Bar dataKey="total" fill="#fb7185" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1.2fr,1.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>User & role management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Full name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="h-9 text-xs flex-1"
              />
              <select
                className="h-9 w-full sm:w-32 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-50"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as Role)}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Button size="sm" onClick={handleCreateUser} className="w-full sm:w-auto">
                Add
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-slate-800 bg-slate-950">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between border-b border-slate-900 px-3 py-2 last:border-b-0"
                >
                  <div>
                    <div className="text-[11px] font-medium text-slate-50">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ID: {u.id}
                    </div>
                  </div>
                  <select
                    className="h-7 rounded-md border border-slate-700 bg-slate-900 px-2 text-[10px] text-slate-50"
                    value={u.role}
                    onChange={(e) =>
                      updateUserRole(u.id, e.target.value as Role, "a1")
                    }
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business settings & audit log</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1.1fr,0.9fr] text-xs">
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-medium text-slate-300">
                  Currency code
                </label>
                <Input
                  className="mt-1 h-8 w-24 text-xs"
                  value={settings.currency}
                  onChange={(e) =>
                    handleSettingsChange("currency", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300">
                  Receipt header
                </label>
                <textarea
                  className="mt-1 h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                  value={settings.receiptHeader}
                  onChange={(e) =>
                    handleSettingsChange("receiptHeader", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="tax-enabled"
                  type="checkbox"
                  checked={settings.taxEnabled}
                  onChange={(e) =>
                    handleSettingsChange("taxEnabled", e.target.checked)
                  }
                  className="h-3 w-3"
                />
                <label
                  htmlFor="tax-enabled"
                  className="text-[11px] text-slate-300"
                >
                  Apply tax to receipts
                </label>
                {settings.taxEnabled && (
                  <Input
                    type="number"
                    className="h-8 w-16 text-xs"
                    value={settings.taxRatePercent}
                    onChange={(e) =>
                      handleSettingsChange(
                        "taxRatePercent",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                )}
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-md border border-slate-800 bg-slate-950">
              {auditLog.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                  Once managers start adjusting prices and stock, you&apos;ll see a
                  trail of who did what here.
                </div>
              ) : (
                auditLog
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="border-b border-slate-900 px-3 py-2 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-50">
                          {entry.actorName}
                        </span>
                        <Badge variant="outline">{entry.role}</Badge>
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-300">
                        {entry.action}
                      </div>
                      <div className="mt-0.5 text-[9px] text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

