import { Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Expense } from "@/hooks/useExpenses";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  shiftOpen?: boolean;
}

export const ExpenseList = ({
  expenses,
  onDelete,
  isLoading = false,
  shiftOpen = true,
}: ExpenseListProps) => {
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await onDelete(id);
      } catch (error) {
        alert("Failed to delete expense: " + (error as Error).message);
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No expenses recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left: Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  {expense.category}
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {expense.payment_method}
                </span>
                {expense.approved && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    ✓ Approved
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {expense.description || "No description"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(expense.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Right: Amount & Actions */}
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="text-lg font-bold text-red-600">
                  -{expense.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">KES</p>
              </div>

              {/* Delete Button */}
              {shiftOpen && !expense.approved && (
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={isLoading}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete expense"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
