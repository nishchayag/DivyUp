import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4 surface-card rounded-2xl">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="brand-button">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="brand-button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoGroupsEmpty() {
  return (
    <EmptyState
      icon="👥"
      title="No groups yet"
      description="Create your first group to start tracking expenses with friends and family."
      actionLabel="Create a Group"
      actionHref="/groups/new"
    />
  );
}

export function NoExpensesEmpty({
  onAddExpense,
}: {
  onAddExpense: () => void;
}) {
  return (
    <EmptyState
      icon="💸"
      title="No expenses yet"
      description="Add your first expense to start splitting costs with your group."
      actionLabel="Add Expense"
      onAction={onAddExpense}
    />
  );
}

export function BalancesSettledEmpty() {
  return (
    <div className="text-center py-6 surface-card rounded-2xl">
      <div className="text-3xl mb-2">🎉</div>
      <p className="text-green-600 dark:text-green-400 font-medium">
        All settled up!
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Everyone is even.
      </p>
    </div>
  );
}
