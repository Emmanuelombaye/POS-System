import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { api } from "@/utils/api";

export interface Expense {
  id: string;
  shift_id: string;
  cashier_id: string;
  branch_id: string;
  amount: number;
  category: "Transport" | "Supplies" | "Repairs" | "Other";
  description: string;
  payment_method: "cash" | "mpesa";
  approved: boolean;
  created_at: string;
}

export const useExpenses = (shiftId?: string, date?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Fetch expenses
  const fetchExpenses = async () => {
    if (!shiftId && !date) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (shiftId) params.shift_id = shiftId;
      if (date) params.date = date;

      const data = await api.get("/api/expenses", params);
      setExpenses(data.expenses || []);
      setTotalExpenses(data.total || 0);
    } catch (err) {
      setError((err as Error).message);
      console.error("[useExpenses] Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add expense
  const addExpense = async (expenseData: Omit<Expense, "id" | "created_at" | "approved">) => {
    try {
      const data = await api.post("/api/expenses", expenseData);
      setExpenses([data.expense, ...expenses]);
      setTotalExpenses(totalExpenses + data.expense.amount);
      return data.expense;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Update expense
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const data = await api.patch(`/api/expenses/${id}`, updates);
      setExpenses(expenses.map(e => e.id === id ? data.expense : e));
      return data.expense;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Delete expense
  const deleteExpense = async (id: string) => {
    try {
      await api.delete(`/api/expenses/${id}`);
      const deleted = expenses.find(e => e.id === id);
      if (deleted) {
        setExpenses(expenses.filter(e => e.id !== id));
        setTotalExpenses(totalExpenses - deleted.amount);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  // Fetch on mount or when parameters change
  useEffect(() => {
    fetchExpenses();
  }, [shiftId, date]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!shiftId) return;

    const channel = supabase
      .channel(`expenses-${shiftId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `shift_id=eq.${shiftId}` },
        (payload) => {
          console.log("[useExpenses] Real-time update:", payload.eventType);
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [shiftId]);

  return {
    expenses,
    loading,
    error,
    totalExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
};
