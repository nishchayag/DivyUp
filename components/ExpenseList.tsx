interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  createdAt: string;
  paidBy?: { _id: string; name: string };
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete?: (id: string) => void;
}

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 text-center">
        No expenses yet. Add your first expense!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense._id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {expense.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(expense.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right flex items-start gap-2">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${expense.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Paid by {expense.paidBy?.name || "Unknown"}
                </div>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(expense._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity"
                  title="Delete expense"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
