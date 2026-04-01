"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/currency";

interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  currency?: string;
  category?: string;
  notes?: string;
  status?: "open" | "settled";
  createdAt: string;
  paidBy?: { _id: string; name: string };
}

interface Comment {
  _id?: string;
  text: string;
  createdAt: string;
  user?: { name?: string };
}

interface Payment {
  _id?: string;
  amount: number;
  note?: string;
  createdAt: string;
  paidBy?: { name?: string };
}

interface ExpenseListProps {
  expenses: ExpenseItem[];
  currency?: string;
  onDelete?: (id: string) => void;
  onSettle?: (id: string) => void;
}

export default function ExpenseList({
  expenses,
  currency = "USD",
  onDelete,
  onSettle,
}: ExpenseListProps) {
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);
  const [commentsByExpense, setCommentsByExpense] = useState<
    Record<string, Comment[]>
  >({});
  const [paymentsByExpense, setPaymentsByExpense] = useState<
    Record<string, Payment[]>
  >({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [paymentInput, setPaymentInput] = useState<Record<string, string>>({});

  const toggleDetails = async (expenseId: string) => {
    const next = openExpenseId === expenseId ? null : expenseId;
    setOpenExpenseId(next);

    if (next && !commentsByExpense[expenseId]) {
      const [commentsRes, paymentsRes] = await Promise.all([
        fetch(`/api/expenses/${expenseId}/comments`),
        fetch(`/api/expenses/${expenseId}/payments`),
      ]);

      const commentsJson = await commentsRes.json();
      const paymentsJson = await paymentsRes.json();

      setCommentsByExpense((prev) => ({
        ...prev,
        [expenseId]: commentsJson.comments || [],
      }));
      setPaymentsByExpense((prev) => ({
        ...prev,
        [expenseId]: paymentsJson.payments || [],
      }));
    }
  };

  const addComment = async (expenseId: string) => {
    const text = (commentInput[expenseId] || "").trim();
    if (!text) return;

    const res = await fetch(`/api/expenses/${expenseId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (res.ok) {
      setCommentsByExpense((prev) => ({
        ...prev,
        [expenseId]: data.comments || [],
      }));
      setCommentInput((prev) => ({ ...prev, [expenseId]: "" }));
    }
  };

  const addPayment = async (expenseId: string) => {
    const amount = parseFloat(paymentInput[expenseId] || "0");
    if (!amount || amount <= 0) return;

    const res = await fetch(`/api/expenses/${expenseId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();
    if (res.ok) {
      setPaymentsByExpense((prev) => ({
        ...prev,
        [expenseId]: data.expense?.payments || [],
      }));
      setPaymentInput((prev) => ({ ...prev, [expenseId]: "" }));
    }
  };

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
              <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={expense.status === "settled"}
                  disabled={expense.status === "settled" || !onSettle}
                  onChange={() => onSettle?.(expense._id)}
                  className="mr-2 accent-emerald-600"
                />
                <span>{expense.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-[10px] font-semibold tracking-wide">
                  {expense.currency || currency}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {expense.category && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {expense.category}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    expense.status === "settled"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {expense.status === "settled" ? "Settled" : "Open"}
                </span>
              </div>
              {expense.notes && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {expense.notes}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(expense.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right flex items-start gap-2">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount, expense.currency || currency)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Paid by {expense.paidBy?.name || "Unknown"}
                </div>
                {onSettle && expense.status !== "settled" && (
                  <button
                    onClick={() => onSettle(expense._id)}
                    className="text-xs mt-1 text-green-600 hover:text-green-700"
                  >
                    Mark settled
                  </button>
                )}
                <button
                  onClick={() => toggleDetails(expense._id)}
                  className="text-xs mt-1 text-blue-600 hover:text-blue-700"
                >
                  {openExpenseId === expense._id ? "Hide details" : "Details"}
                </button>
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

          {openExpenseId === expense._id && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Comments
                </h4>
                <div className="space-y-2 max-h-36 overflow-auto">
                  {(commentsByExpense[expense._id] || []).map(
                    (comment, idx) => (
                      <div
                        key={comment._id || idx}
                        className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div className="font-medium">
                          {comment.user?.name || "User"}
                        </div>
                        <div>{comment.text}</div>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={commentInput[expense._id] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({
                        ...prev,
                        [expense._id]: e.target.value,
                      }))
                    }
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                    placeholder="Add comment"
                  />
                  <button
                    onClick={() => addComment(expense._id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                  >
                    Send
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Payments
                </h4>
                <div className="space-y-2 max-h-36 overflow-auto">
                  {(paymentsByExpense[expense._id] || []).map(
                    (payment, idx) => (
                      <div
                        key={payment._id || idx}
                        className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded flex justify-between"
                      >
                        <span>{payment.paidBy?.name || "User"}</span>
                        <span>${payment.amount.toFixed(2)}</span>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentInput[expense._id] || ""}
                    onChange={(e) =>
                      setPaymentInput((prev) => ({
                        ...prev,
                        [expense._id]: e.target.value,
                      }))
                    }
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                    placeholder="Amount"
                  />
                  <button
                    onClick={() => addPayment(expense._id)}
                    className="px-2 py-1 text-xs bg-emerald-600 text-white rounded"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
