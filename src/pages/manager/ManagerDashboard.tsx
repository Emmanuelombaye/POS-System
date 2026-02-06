import { useMemo, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime, summarizeTransactionsByDay } from "@/utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Settings, TrendingUp, AlertTriangle } from "lucide-react";

export const ManagerDashboard = () => {
  const { products, transactions, users, settings, updateProductPrice } = useAppStore();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [newPrice, setNewPrice] = useState<number | "">("");

  const dailyData = useMemo(
    () => summarizeTransactionsByDay(transactions),
    [transactions]
  );

  const handleUpdatePrice = () => {
    if (!selectedProductId || !newPrice) return;
    updateProductPrice(selectedProductId, Number(newPrice), "m1");
    setNewPrice("");
  };

  const lowStock = products.filter(
    (p) => p.stockKg <= p.lowStockThresholdKg
  );

  return (
    <div className="space-y-6 px-4 py-8 max-w-[1600px] mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-charcoal tracking-tight">Manager Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Daily operations and price control.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-[1.7fr,1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-charcoal">
              <TrendingUp className="h-5 w-5 text-brand-burgundy" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {dailyData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                No sales recorded yet. Cashiers&apos; transactions will appear here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) =>
                      `${settings.currency} ${Number(v).toLocaleString()}`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1C1C1C",
                      border: "none",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#F8F8F8"
                    }}
                    itemStyle={{ color: "#F8F8F8" }}
                    formatter={(value: any) =>
                      `${settings.currency} ${Number(value).toLocaleString()}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#7A1E1E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#7A1E1E" }}
                    activeDot={{ r: 6, stroke: "#C9A24D", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-charcoal">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {lowStock.length === 0 ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 font-medium">
                All tracked products are above their minimum levels.
              </div>
            ) : (
              lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-3"
                >
                  <div>
                    <div className="text-[12px] font-bold text-amber-900">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-amber-800/80 mt-0.5">
                      {(p.stockKg || 0).toFixed(1)} kg in stock • min {p.lowStockThresholdKg} kg
                    </div>
                  </div>
                  <Badge variant="warning">Reorder</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.4fr,1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-charcoal">
              <Settings className="h-5 w-5 text-gray-400" />
              Price Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex gap-2">
              <select
                className="h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-brand-charcoal focus:border-brand-burgundy outline-none transition-shadow"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Select product to update...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.pricePerKg, settings)}/kg)
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="New price /kg"
                className="h-11 w-32 text-xs"
                value={newPrice}
                onChange={(e) =>
                  setNewPrice(e.target.value ? Number(e.target.value) : "")
                }
              />
              <Button
                size="sm"
                className="h-11 px-6"
                disabled={!selectedProductId || !newPrice}
                onClick={handleUpdatePrice}
              >
                Update
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 p-2 bg-gray-50 rounded-lg">
              Authorized managers can adjust per-kg prices. All changes are logged in the audit trail.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-charcoal">Real-time Transactions</CardTitle>
          </CardHeader>
          <CardContent className="h-60 overflow-y-auto text-xs pr-2">
            {transactions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[11px] text-gray-400">
                No transactions yet. Cashiers&apos; sales will show up in real time.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((tx) => {
                    const cashier = users.find((u) => u.id === tx.cashierId);
                    return (
                      <div
                        key={tx.id}
                        className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-brand-charcoal">
                            {formatCurrency(tx.total, settings)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatDateTime(tx.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                          <span>
                            {cashier?.name ?? "Unknown"} • {(tx.items?.length ?? 0)} items •{" "}
                            {tx.paymentMethod.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

