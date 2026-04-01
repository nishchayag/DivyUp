"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseModal from "@/components/AddExpenseModal";
import { GroupDetailSkeleton } from "@/components/Skeleton";
import { NoExpensesEmpty, BalancesSettledEmpty } from "@/components/EmptyState";
import { calculateNetBalances, settleDebts } from "@/utils/calcBalances";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/utils/currency";
import { useToast } from "@/components/Toast";
import GroupCharts from "@/components/GroupCharts";

interface Member {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface Expense {
  _id: string;
  title: string;
  amount: number;
  currency?: string;
  category?: string;
  notes?: string;
  status?: "open" | "settled";
  splitMode?: "equal" | "percentage";
  splitShares?: { userId: string; percentage: number }[];
  createdAt: string;
  settledAt?: string;
  paidBy: Member;
  splitBetween: Member[];
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  currency?: string;
  members: Member[];
  creator: string;
}

export default function GroupPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to load group");
      }
      const data = await res.json();
      setGroup(data.group);
      setExpenses(data.expenses || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await fetch(`/api/groups/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setGroup(data.group);
      setInviteEmail("");
      setShowInvite(false);
      showToast("Member added successfully!", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to add member",
        "error",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;

    try {
      const res = await fetch(`/api/groups/${params.id}/members`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave group");
      }

      showToast("You have left the group", "success");
      window.location.href = "/";
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to leave group",
        "error",
      );
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete expense");
      }

      setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      showToast("Expense deleted", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete expense",
        "error",
      );
    }
  };

  const handleSettleExpense = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/settle`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to settle expense");
      }

      setExpenses((prev) =>
        prev.map((expense) =>
          expense._id === expenseId
            ? { ...expense, status: "settled" }
            : expense,
        ),
      );
      showToast("Expense settled", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to settle expense",
        "error",
      );
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    if (!group) return;
    setSavingCurrency(true);
    try {
      const res = await fetch(`/api/groups/${group._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update currency");
      }

      setGroup((prev) => (prev ? { ...prev, currency } : prev));
      showToast("Group currency updated", "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update currency",
        "error",
      );
    } finally {
      setSavingCurrency(false);
    }
  };

  if (loading) {
    return <GroupDetailSkeleton />;
  }

  if (error || !group) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error || "Group not found"}
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate balances from uncleared expenses only.
  const toId = (value: unknown) => String(value ?? "");
  const currency = group.currency || "USD";
  const balanceExpenses = expenses.filter(
    (e) => e.status !== "settled" && (!e.currency || e.currency === currency),
  );
  const excludedFromBalances =
    expenses.filter((e) => e.status !== "settled").length -
    balanceExpenses.length;
  const expensesForCalc = balanceExpenses
    .map((e) => ({
      amount: e.amount,
      paidBy: toId(e.paidBy?._id),
      splitBetween: e.splitBetween.map((m) => toId(m._id)),
      splitMode: e.splitMode,
      splitShares: e.splitShares?.map((share) => ({
        userId: toId(share.userId),
        percentage: share.percentage,
      })),
    }));
  const memberIds = group.members.map((m) => toId(m._id));
  const netBalances = calculateNetBalances(expensesForCalc, memberIds);
  const settlements = settleDebts(netBalances);
  const currentUserId = session?.user?.id;
  const isCreator = group.creator === currentUserId;
  const canReviewBalances =
    isCreator || session?.user?.role === "admin" || session?.user?.role === "owner";
  const memberNetBalances = group.members
    .map((member) => ({
      ...member,
      net: netBalances[toId(member._id)] || 0,
    }))
    .sort((a, b) => b.net - a.net);
  const settlementHistory = expenses
    .filter((expense) => expense.status === "settled")
    .sort(
      (a, b) =>
        new Date(b.settledAt || b.createdAt).getTime() -
        new Date(a.settledAt || a.createdAt).getTime(),
    );

  const getMemberName = (id: string) =>
    group.members.find((m) => m._id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="surface-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {group.name}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            {isCreator && (
              <span className="text-xs rounded-full px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Creator
              </span>
            )}
            <span className="text-xs rounded-full px-2 py-1 bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
              {group.members.length} members
            </span>
          </div>
          {group.description && (
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canReviewBalances && (
            <select
              value={currency}
              disabled={savingCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  Currency: {code}
                </option>
              ))}
            </select>
          )}
          <a
            href={`/api/groups/${params.id}/export`}
            className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowInvite(true)}
            className="text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            + Invite
          </button>
          <button
            onClick={handleLeaveGroup}
            className="text-sm px-3 py-2 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="surface-card rounded-2xl p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3">
          Members ({group.members.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <div
              key={m._id}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl"
            >
              {m.image ? (
                <Image
                  src={m.image}
                  alt={m.name}
                  className="w-6 h-6 rounded-lg"
                  width={24}
                  height={24}
                  unoptimized
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white text-xs">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {m.name}
              </span>
              {m._id === group.creator && (
                <span className="text-xs text-slate-500">(creator)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Balances Summary */}
      <div className="surface-card rounded-2xl p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3">
          Balances
        </h3>
        {excludedFromBalances > 0 && (
          <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
            {excludedFromBalances} open expense(s) in other currencies are excluded from balance math.
          </p>
        )}
        {settlements.length === 0 ? (
          <BalancesSettledEmpty />
        ) : (
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                <div className="text-sm">
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {getMemberName(s.from)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" "}
                    owes{" "}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {getMemberName(s.to)}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(s.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {canReviewBalances && (
        <div className="surface-card rounded-2xl p-5">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3">
            Member Net Balances (Admin)
          </h3>
          <div className="space-y-2">
            {memberNetBalances.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {m.name}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    m.net > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : m.net < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {m.net > 0 ? "+" : ""}
                  {formatCurrency(m.net, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card rounded-2xl p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3">
          Visual Summaries
        </h3>
        <GroupCharts expenses={expenses} currency={currency} />
      </div>

      <div className="surface-card rounded-2xl p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3">
          Settlement History
        </h3>
        {settlementHistory.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No completed settlements yet.
          </p>
        ) : (
          <div className="space-y-2">
            {settlementHistory.map((expense) => (
              <div
                key={expense._id}
                className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {expense.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Settled on {new Date(expense.settledAt || expense.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(expense.amount, expense.currency || currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="surface-card rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white">
            Expenses ({expenses.length})
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm brand-button px-4 py-2 rounded-xl"
          >
            + Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <NoExpensesEmpty onAddExpense={() => setShowModal(true)} />
        ) : (
          <ExpenseList
            expenses={expenses}
            currency={currency}
            onDelete={handleDeleteExpense}
            onSettle={handleSettleExpense}
          />
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <AddExpenseModal
          members={group.members}
          groupId={group._id}
          currency={currency}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchGroup();
            showToast("Expense added!", "success");
          }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="surface-card rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                Invite Member
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label
                  htmlFor="inviteEmail"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                  placeholder="friend@example.com"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The user must have a DivyUp account
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 brand-button rounded-xl disabled:opacity-50 disabled:pointer-events-none"
                >
                  {inviting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
