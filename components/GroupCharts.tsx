"use client";

import { formatCurrency } from "@/utils/currency";

interface Member {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  amount: number;
  currency?: string;
  category?: string;
  status?: "open" | "settled";
  paidBy: Member;
}

interface GroupChartsProps {
  expenses: Expense[];
  currency: string;
}

export default function GroupCharts({ expenses, currency }: GroupChartsProps) {
  const chartExpenses = expenses.filter(
    (expense) => !expense.currency || expense.currency === currency,
  );
  const skippedCount = expenses.length - chartExpenses.length;

  const categoryTotals = chartExpenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.category || "General";
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, {});

  const spenderTotals = chartExpenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.paidBy?.name || "Unknown";
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const spenderEntries = Object.entries(spenderTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxCategory = Math.max(...categoryEntries.map(([, v]) => v), 1);
  const maxSpender = Math.max(...spenderEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-3">
      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount} expense(s) in other currencies are excluded from charts.
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Spend by Category
        </h4>
        {categoryEntries.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {categoryEntries.map(([name, value]) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(value, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                    style={{ width: `${Math.max(6, (value / maxCategory) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Top Payers
        </h4>
        {spenderEntries.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {spenderEntries.map(([name, value]) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{name}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(value, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600"
                    style={{ width: `${Math.max(6, (value / maxSpender) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
