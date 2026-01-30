import { CategoryBadge, ExpenseCategory } from "./CategoryBadge";
import Avatar from "./Avatar";

type SplitType = "equal" | "exact" | "percentage";

interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  createdAt: string;
  expenseDate?: string;
  category?: ExpenseCategory;
  splitType?: SplitType;
  paidBy?: { _id: string; name: string; image?: string };
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete?: (id: string) => void;
}

// Format date for display
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }
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
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
        >
          <div className="flex gap-3 items-start">
            {/* Avatar */}
            <Avatar
              name={expense.paidBy?.name || "Unknown"}
              image={expense.paidBy?.image}
              size="md"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {expense.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(expense.expenseDate || expense.createdAt)}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Paid by {expense.paidBy?.name || "Unknown"}
                    </span>
                    {expense.splitType && expense.splitType !== "equal" && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          •
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {expense.splitType === "exact"
                            ? "Custom ₹"
                            : "Custom %"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ₹{expense.amount.toFixed(2)}
                    </div>
                    {expense.category && (
                      <div className="mt-1">
                        <CategoryBadge
                          category={expense.category}
                          showLabel={false}
                        />
                      </div>
                    )}
                  </div>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(expense._id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-all"
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
          </div>
        </div>
      ))}
    </div>
  );
}
