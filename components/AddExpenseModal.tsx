"use client";

import { useState } from "react";
import { SUPPORTED_CURRENCIES } from "@/utils/currency";

interface Member {
  _id: string;
  name: string;
}

interface AddExpenseModalProps {
  members: Member[];
  groupId: string;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

type SplitMode = "equal" | "percentage";

export default function AddExpenseModal({
  members,
  groupId,
  currency = "USD",
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState(currency);
  const [paidBy, setPaidBy] = useState(members[0]?._id || "");
  const [category, setCategory] = useState("General");
  const [notes, setNotes] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    "weekly" | "monthly"
  >("monthly");
  const [recurringDate, setRecurringDate] = useState("");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    members.map((m) => m._id),
  );
  const [percentages, setPercentages] = useState<Record<string, string>>(
    Object.fromEntries(
      members.map((m) => [
        m._id,
        (100 / Math.max(members.length, 1)).toFixed(2),
      ]),
    ),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          currency: expenseCurrency,
          category,
          notes: notes || undefined,
          paidById: paidBy,
          splitBetweenIds: splitBetween,
          splitMode,
          splitShares:
            splitMode === "percentage"
              ? splitBetween.map((id) => ({
                  userId: id,
                  percentage: parseFloat(percentages[id] || "0"),
                }))
              : undefined,
          recurrence: recurringEnabled
            ? {
                enabled: true,
                frequency: recurringFrequency,
                nextRunAt: recurringDate
                  ? new Date(recurringDate).toISOString()
                  : undefined,
              }
            : { enabled: false },
          groupId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create expense");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const totalPercentage = splitBetween.reduce(
    (sum, id) => sum + parseFloat(percentages[id] || "0"),
    0,
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Expense</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ({expenseCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Currency
            </label>
            <select
              value={expenseCurrency}
              onChange={(e) => setExpenseCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>General</option>
              <option>Food</option>
              <option>Travel</option>
              <option>Housing</option>
              <option>Utilities</option>
              <option>Entertainment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional context or details"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Split Mode
            </label>
            <select
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as SplitMode)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="equal">Equal split</option>
              <option value="percentage">Percentage split</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurring Expense
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable recurring schedule</span>
            </div>
            {recurringEnabled && (
              <div className="space-y-2">
                <select
                  value={recurringFrequency}
                  onChange={(e) =>
                    setRecurringFrequency(
                      e.target.value as "weekly" | "monthly",
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  type="date"
                  value={recurringDate}
                  onChange={(e) => setRecurringDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid by
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split between
            </label>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={splitBetween.includes(m._id)}
                    onChange={() => toggleMember(m._id)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">{m.name}</span>
                  {splitMode === "percentage" &&
                    splitBetween.includes(m._id) && (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={percentages[m._id] || "0"}
                        onChange={(e) =>
                          setPercentages((prev) => ({
                            ...prev,
                            [m._id]: e.target.value,
                          }))
                        }
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    )}
                </div>
              ))}
            </div>
            {splitMode === "percentage" && (
              <p
                className={`mt-2 text-xs ${Math.abs(totalPercentage - 100) < 0.01 ? "text-green-600" : "text-red-600"}`}
              >
                Total percentage: {totalPercentage.toFixed(2)}%
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                splitBetween.length === 0 ||
                (splitMode === "percentage" &&
                  Math.abs(totalPercentage - 100) >= 0.01)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
