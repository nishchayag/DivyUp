"use client";

import { useState, useEffect } from "react";
import { CategorySelect, ExpenseCategory } from "./CategoryBadge";
import DatePicker from "./DatePicker";
import { Spinner } from "./Loader";

type SplitType = "equal" | "exact" | "percentage";

interface Member {
  _id: string;
  name: string;
}

interface SplitDetail {
  userId: string;
  amount: number;
  percentage: number;
}

interface AddExpenseModalProps {
  members: Member[];
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExpenseModal({
  members,
  groupId,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?._id || "");
  const [splitBetween, setSplitBetween] = useState<string[]>(
    members.map((m) => m._id),
  );
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [splitDetails, setSplitDetails] = useState<SplitDetail[]>(
    members.map((m) => ({ userId: m._id, amount: 0, percentage: 0 })),
  );
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate equal splits when amount or participants change
  useEffect(() => {
    if (splitType === "equal" && amount && splitBetween.length > 0) {
      const equalAmount = parseFloat(amount) / splitBetween.length;
      const equalPercentage = 100 / splitBetween.length;
      setSplitDetails(
        members.map((m) => ({
          userId: m._id,
          amount: splitBetween.includes(m._id) ? equalAmount : 0,
          percentage: splitBetween.includes(m._id) ? equalPercentage : 0,
        })),
      );
    }
  }, [amount, splitBetween, splitType, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation for custom splits
    if (splitType === "exact") {
      const totalSplit = splitDetails
        .filter((d) => splitBetween.includes(d.userId))
        .reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(totalSplit - parseFloat(amount)) > 0.01) {
        setError(
          `Split amounts (₹${totalSplit.toFixed(2)}) must equal total (₹${parseFloat(amount).toFixed(2)})`,
        );
        return;
      }
    }

    if (splitType === "percentage") {
      const totalPercent = splitDetails
        .filter((d) => splitBetween.includes(d.userId))
        .reduce((sum, d) => sum + d.percentage, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setError(`Percentages (${totalPercent.toFixed(1)}%) must total 100%`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title,
        amount: parseFloat(amount),
        paidById: paidBy,
        splitBetweenIds: splitBetween,
        groupId,
        category,
        expenseDate,
        splitType,
      };

      // Include split details for custom splits
      if (splitType !== "equal") {
        payload.splitDetails = splitDetails
          .filter((d) => splitBetween.includes(d.userId))
          .map((d) => ({
            userId: d.userId,
            amount: splitType === "exact" ? d.amount : undefined,
            percentage: splitType === "percentage" ? d.percentage : undefined,
          }));
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create expense");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const updateSplitAmount = (userId: string, value: string) => {
    setSplitDetails((prev) =>
      prev.map((d) =>
        d.userId === userId ? { ...d, amount: parseFloat(value) || 0 } : d,
      ),
    );
  };

  const updateSplitPercentage = (userId: string, value: string) => {
    setSplitDetails((prev) =>
      prev.map((d) =>
        d.userId === userId ? { ...d, percentage: parseFloat(value) || 0 } : d,
      ),
    );
  };

  const distributeEqually = () => {
    if (!amount || splitBetween.length === 0) return;
    const equalAmount = parseFloat(amount) / splitBetween.length;
    const equalPercentage = 100 / splitBetween.length;
    setSplitDetails(
      members.map((m) => ({
        userId: m._id,
        amount: splitBetween.includes(m._id) ? equalAmount : 0,
        percentage: splitBetween.includes(m._id) ? equalPercentage : 0,
      })),
    );
  };

  // Calculate totals for validation display
  const totalSplitAmount = splitDetails
    .filter((d) => splitBetween.includes(d.userId))
    .reduce((sum, d) => sum + d.amount, 0);
  const totalSplitPercentage = splitDetails
    .filter((d) => splitBetween.includes(d.userId))
    .reduce((sum, d) => sum + d.percentage, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Expense
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <CategorySelect value={category} onChange={setCategory} />
          </div>

          <DatePicker
            label="Date"
            value={expenseDate}
            onChange={setExpenseDate}
          />

          <div>
            <label
              htmlFor="paid-by-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Paid by
            </label>
            <select
              id="paid-by-select"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Split between
            </label>

            {/* Split Type Selector */}
            <div className="flex gap-2 mb-3">
              {(["equal", "exact", "percentage"] as SplitType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    splitType === type
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {type === "equal"
                    ? "Equal"
                    : type === "exact"
                      ? "Exact ₹"
                      : "Percentage"}
                </button>
              ))}
            </div>

            {/* Member Selection with Custom Amounts */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((m) => {
                const detail = splitDetails.find((d) => d.userId === m._id);
                const isSelected = splitBetween.includes(m._id);

                return (
                  <div
                    key={m._id}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "bg-gray-50 dark:bg-gray-700/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(m._id)}
                      className="rounded"
                      aria-label={`Include ${m.name} in split`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {m.name}
                    </span>

                    {splitType === "exact" && isSelected && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={detail?.amount || ""}
                          onChange={(e) =>
                            updateSplitAmount(m._id, e.target.value)
                          }
                          placeholder="0.00"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {splitType === "percentage" && isSelected && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={detail?.percentage || ""}
                          onChange={(e) =>
                            updateSplitPercentage(m._id, e.target.value)
                          }
                          placeholder="0"
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    )}

                    {splitType === "equal" && isSelected && amount && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ₹{(parseFloat(amount) / splitBetween.length).toFixed(2)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split Validation/Summary */}
            {splitType !== "equal" && amount && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={distributeEqually}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Split equally
                </button>
                <span
                  className={
                    splitType === "exact"
                      ? Math.abs(totalSplitAmount - parseFloat(amount)) < 0.01
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                      : Math.abs(totalSplitPercentage - 100) < 0.01
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                  }
                >
                  {splitType === "exact"
                    ? `₹${totalSplitAmount.toFixed(2)} / ₹${parseFloat(amount || "0").toFixed(2)}`
                    : `${totalSplitPercentage.toFixed(1)}% / 100%`}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || splitBetween.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
