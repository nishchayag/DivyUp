"use client";

export type ExpenseCategory =
  | "food"
  | "transport"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "travel"
  | "health"
  | "rent"
  | "groceries"
  | "other";

interface CategoryConfig {
  icon: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, CategoryConfig> = {
  food: {
    icon: "🍕",
    label: "Food & Dining",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  transport: {
    icon: "🚗",
    label: "Transport",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  utilities: {
    icon: "💡",
    label: "Utilities",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-300",
  },
  entertainment: {
    icon: "🎬",
    label: "Entertainment",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  shopping: {
    icon: "🛍️",
    label: "Shopping",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    textColor: "text-pink-700 dark:text-pink-300",
  },
  travel: {
    icon: "✈️",
    label: "Travel",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    textColor: "text-cyan-700 dark:text-cyan-300",
  },
  health: {
    icon: "💊",
    label: "Health",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
  },
  rent: {
    icon: "🏠",
    label: "Rent",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
  },
  groceries: {
    icon: "🛒",
    label: "Groceries",
    bgColor: "bg-lime-100 dark:bg-lime-900/30",
    textColor: "text-lime-700 dark:text-lime-300",
  },
  other: {
    icon: "📦",
    label: "Other",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
  },
};

interface CategoryBadgeProps {
  category: ExpenseCategory;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function CategoryBadge({
  category,
  showLabel = true,
  size = "sm",
}: CategoryBadgeProps) {
  const config = EXPENSE_CATEGORIES[category] || EXPENSE_CATEGORIES.other;

  const sizeClasses =
    size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses}`}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

interface CategorySelectProps {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  className = "",
}: CategorySelectProps) {
  return (
    <div className={`grid grid-cols-5 gap-2 ${className}`}>
      {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((cat) => {
        const config = EXPENSE_CATEGORIES[cat];
        const isSelected = value === cat;

        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            title={config.label}
          >
            <span className="text-xl">{config.icon}</span>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-full text-center">
              {config.label.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
