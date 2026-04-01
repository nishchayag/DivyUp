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

type SplitMode = "equal" | "percentage" | "fixed" | "itemized";
type SplitPreset = "equal" | "60_40" | "70_30" | "custom";

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
  const [splitPreset, setSplitPreset] = useState<SplitPreset>("equal");
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<
    "weekly" | "monthly"
  >("monthly");
  const [recurringDate, setRecurringDate] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [autoApproveRecurring, setAutoApproveRecurring] = useState(false);
  const [bulkCount, setBulkCount] = useState("1");
  const [bulkIntervalDays, setBulkIntervalDays] = useState("1");
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
  const [fixedShares, setFixedShares] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m._id, "0"])),
  );
  const [itemizedRows, setItemizedRows] = useState<
    { label: string; amount: string; assignedTo: string[] }[]
  >([
    {
      label: "",
      amount: "",
      assignedTo: members[0]?._id ? [members[0]._id] : [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountNumber = parseFloat(amount || "0");
  const totalPercentage = splitBetween.reduce(
    (sum, id) => sum + parseFloat(percentages[id] || "0"),
    0,
  );
  const totalFixed = splitBetween.reduce(
    (sum, id) => sum + parseFloat(fixedShares[id] || "0"),
    0,
  );
  const totalItemized = itemizedRows.reduce(
    (sum, row) => sum + parseFloat(row.amount || "0"),
    0,
  );

  const toggleMember = (id: string) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const applyPreset = (preset: SplitPreset) => {
    setSplitPreset(preset);
    if (preset === "equal") {
      const equalPct = (100 / Math.max(splitBetween.length, 1)).toFixed(2);
      setPercentages((prev) => ({
        ...prev,
        ...Object.fromEntries(splitBetween.map((id) => [id, equalPct])),
      }));
      return;
    }

    if (splitBetween.length < 2) return;
    const [first, second, ...rest] = splitBetween;
    const values = preset === "60_40" ? ["60", "40"] : ["70", "30"];
    setPercentages((prev) => {
      const next = { ...prev, [first]: values[0], [second]: values[1] };
      rest.forEach((id) => {
        next[id] = "0";
      });
      return next;
    });
  };

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
          splitPreset,
          splitShares:
            splitMode === "percentage"
              ? splitBetween.map((id) => ({
                  userId: id,
                  percentage: parseFloat(percentages[id] || "0"),
                }))
              : undefined,
          fixedShares:
            splitMode === "fixed"
              ? splitBetween.map((id) => ({
                  userId: id,
                  amount: parseFloat(fixedShares[id] || "0"),
                }))
              : undefined,
          itemizedShares:
            splitMode === "itemized"
              ? itemizedRows.map((row) => ({
                  label: row.label,
                  amount: parseFloat(row.amount || "0"),
                  assignedTo: row.assignedTo,
                }))
              : undefined,
          recurrence: recurringEnabled
            ? {
                enabled: true,
                frequency: recurringFrequency,
                nextRunAt: recurringDate
                  ? new Date(recurringDate).toISOString()
                  : undefined,
                templateName: templateName || undefined,
                autoApprove: autoApproveRecurring,
              }
            : { enabled: false },
          bulkCreate:
            parseInt(bulkCount, 10) > 1
              ? {
                  count: parseInt(bulkCount, 10),
                  intervalDays: parseInt(bulkIntervalDays, 10) || 1,
                }
              : undefined,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Expense</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            X
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Currency
            </label>
            <select
              aria-label="Expense currency"
              value={expenseCurrency}
              onChange={(e) => setExpenseCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
              Split Mode
            </label>
            <select
              aria-label="Split mode"
              value={splitMode}
              onChange={(e) => setSplitMode(e.target.value as SplitMode)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="equal">Equal split</option>
              <option value="percentage">Percentage split</option>
              <option value="fixed">Fixed amounts</option>
              <option value="itemized">Itemized split</option>
            </select>
          </div>

          {splitMode === "percentage" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Split Preset
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("equal")}
                  className="px-2 py-1 text-xs border rounded"
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("60_40")}
                  className="px-2 py-1 text-xs border rounded"
                >
                  60/40
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("70_30")}
                  className="px-2 py-1 text-xs border rounded"
                >
                  70/30
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid by
            </label>
            <select
              aria-label="Paid by member"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                    aria-label={`Enable split for ${m.name}`}
                    type="checkbox"
                    checked={splitBetween.includes(m._id)}
                    onChange={() => toggleMember(m._id)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1">{m.name}</span>
                  {splitMode === "percentage" &&
                    splitBetween.includes(m._id) && (
                      <input
                        aria-label={`Percentage for ${m.name}`}
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
                  {splitMode === "fixed" && splitBetween.includes(m._id) && (
                    <input
                      aria-label={`Fixed share for ${m.name}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={fixedShares[m._id] || "0"}
                      onChange={(e) =>
                        setFixedShares((prev) => ({
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
            {splitMode === "fixed" && (
              <p
                className={`mt-2 text-xs ${Math.abs(totalFixed - amountNumber) < 0.01 ? "text-green-600" : "text-red-600"}`}
              >
                Total fixed allocation: {totalFixed.toFixed(2)} /{" "}
                {amountNumber.toFixed(2)}
              </p>
            )}
          </div>

          {splitMode === "itemized" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
              {itemizedRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) =>
                      setItemizedRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, label: e.target.value } : r,
                        ),
                      )
                    }
                    className="col-span-5 border border-gray-300 rounded px-2 py-1 text-xs"
                    placeholder="Item"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) =>
                      setItemizedRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, amount: e.target.value } : r,
                        ),
                      )
                    }
                    className="col-span-3 border border-gray-300 rounded px-2 py-1 text-xs"
                    placeholder="Amt"
                  />
                  <select
                    aria-label="Assign item to members"
                    multiple
                    value={row.assignedTo}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(
                        (o) => o.value,
                      );
                      setItemizedRows((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, assignedTo: selected } : r,
                        ),
                      );
                    }}
                    className="col-span-4 border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setItemizedRows((prev) => [
                    ...prev,
                    {
                      label: "",
                      amount: "",
                      assignedTo: members[0]?._id ? [members[0]._id] : [],
                    },
                  ])
                }
                className="text-xs px-2 py-1 border rounded"
              >
                + Add item
              </button>
              <p
                className={`text-xs ${Math.abs(totalItemized - amountNumber) < 0.01 ? "text-green-600" : "text-red-600"}`}
              >
                Itemized total: {totalItemized.toFixed(2)} /{" "}
                {amountNumber.toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurring Expense
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                aria-label="Enable recurring expense"
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
                  aria-label="Recurring frequency"
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
                  aria-label="Recurring date"
                  type="date"
                  value={recurringDate}
                  onChange={(e) => setRecurringDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Template name (optional)"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    aria-label="Auto approve recurring expenses"
                    type="checkbox"
                    checked={autoApproveRecurring}
                    onChange={(e) => setAutoApproveRecurring(e.target.checked)}
                    className="rounded"
                  />
                  Auto-approve recurring instances
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulk create
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Count"
              />
              <input
                type="number"
                min="1"
                max="90"
                value={bulkIntervalDays}
                onChange={(e) => setBulkIntervalDays(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Interval days"
              />
            </div>
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
                  Math.abs(totalPercentage - 100) >= 0.01) ||
                (splitMode === "fixed" &&
                  Math.abs(totalFixed - amountNumber) >= 0.01) ||
                (splitMode === "itemized" &&
                  Math.abs(totalItemized - amountNumber) >= 0.01)
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
