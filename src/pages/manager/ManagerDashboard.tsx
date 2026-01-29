import { useMemo, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime, summarizeTransactionsByDay } from "@/utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
    <div className="space-y-3 sm:space-y-4 px-2 sm:px-4 py-3 sm:py-4">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1.7fr,1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales performance</CardTitle>
          </CardHeader>
          <CardContent className="h-48 sm:h-64">
            {dailyData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No sales recorded yet. Cashiers&apos; transactions will appear here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
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
            <CardTitle>Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
            {lowStock.length === 0 ? (
              <div className="rounded-md border border-emerald-700/60 bg-emerald-950/60 px-3 py-2 text-emerald-100">
                All tracked products are above their minimum levels.
              </div>
            ) : (
              lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2"
                >
                  <div>
                    <div className="text-[11px] font-semibold text-amber-100">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-amber-200/90">
                      {p.stockKg.toFixed(1)} kg in stock • min {p.lowStockThresholdKg} kg
                    </div>
                  </div>
                  <Badge variant="warning">Reorder</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr,1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>Price management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex gap-2">
              <select
                className="h-9 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-50"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.pricePerKg, settings)}/kg)
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="New price /kg"
                className="h-9 w-32 text-xs"
                value={newPrice}
                onChange={(e) =>
                  setNewPrice(e.target.value ? Number(e.target.value) : "")
                }
              />
              <Button
                size="sm"
                disabled={!selectedProductId || !newPrice}
                onClick={handleUpdatePrice}
              >
                Update
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              Managers can adjust per-kg prices. All changes are logged in the audit
              trail for the admin.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="h-52 overflow-y-auto text-xs">
            {transactions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
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
                        className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-50">
                            {formatCurrency(tx.total, settings)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(tx.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {cashier?.name ?? "Unknown"} • {tx.items.length} items •{" "}
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

