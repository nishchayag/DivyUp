"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ExpenseList from "@/components/ExpenseList";
import AddExpenseModal from "@/components/AddExpenseModal";
import { GroupDetailSkeleton } from "@/components/Skeleton";
import { NoExpensesEmpty, BalancesSettledEmpty } from "@/components/EmptyState";
import { calculateNetBalances, settleDebts } from "@/utils/calcBalances";
import { useToast } from "@/components/Toast";

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
  createdAt: string;
  paidBy: Member;
  splitBetween: Member[];
}

interface Group {
  _id: string;
  name: string;
  description?: string;
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

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${params.id}`);
      if (!res.ok) {
        throw new Error("Failed to load group");
      }
      const data = await res.json();
      setGroup(data.group);
      setExpenses(data.expenses || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [params.id]);

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
    } catch (err: any) {
      showToast(err.message, "error");
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
    } catch (err: any) {
      showToast(err.message, "error");
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

      setExpenses(expenses.filter((e) => e._id !== expenseId));
      showToast("Expense deleted", "success");
    } catch (err: any) {
      showToast(err.message, "error");
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

  // Calculate balances
  const expensesForCalc = expenses.map((e) => ({
    amount: e.amount,
    paidBy: e.paidBy._id,
    splitBetween: e.splitBetween.map((m) => m._id),
  }));
  const memberIds = group.members.map((m) => m._id);
  const netBalances = calculateNetBalances(expensesForCalc, memberIds);
  const settlements = settleDebts(netBalances);

  const getMemberName = (id: string) =>
    group.members.find((m) => m._id === id)?.name || "Unknown";

  const currentUserId = (session?.user as any)?.id;
  const isCreator = group.creator === currentUserId;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {group.name}
          </h2>
          {group.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/groups/${params.id}/export`}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowInvite(true)}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            + Invite
          </button>
          <button
            onClick={handleLeaveGroup}
            className="text-sm px-3 py-1.5 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Members ({group.members.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <div
              key={m._id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              {m.image ? (
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {m.name}
              </span>
              {m._id === group.creator && (
                <span className="text-xs text-gray-500">(creator)</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Balances Summary */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Balances
        </h3>
        {settlements.length === 0 ? (
          <BalancesSettledEmpty />
        ) : (
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="text-sm">
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {getMemberName(s.from)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {" "}
                    owes{" "}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {getMemberName(s.to)}
                  </span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${s.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Expenses ({expenses.length})
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <NoExpensesEmpty onAddExpense={() => setShowModal(true)} />
        ) : (
          <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <AddExpenseModal
          members={group.members}
          groupId={group._id}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite Member
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label
                  htmlFor="inviteEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="friend@example.com"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The user must have a DivyUp account
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
