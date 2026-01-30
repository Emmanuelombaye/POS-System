import type { BusinessSettings, Transaction } from "@/store/appStore";

export const formatCurrency = (value: number | undefined | null, settings: BusinessSettings) => {
  const amount = value ?? 0;
  return `${settings.currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatDateTime = (iso: string | undefined | null) => {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const summarizeTransactionsByDay = (transactions: Transaction[]) => {
  const map = new Map<
    string,
    {
      date: string;
      total: number;
      count: number;
    }
  >();

  for (const tx of transactions) {
    const d = new Date(tx.createdAt);
    const key = d.toISOString().slice(0, 10);
    const existing = map.get(key) ?? {
      date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      total: 0,
      count: 0,
    };
    existing.total += tx.total;
    existing.count += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
};

