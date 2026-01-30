"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import { Spinner } from "./Loader";

interface Member {
  _id: string;
  name: string;
  image?: string;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettleUpModalProps {
  groupId: string;
  members: Member[];
  settlements: Settlement[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettleUpModal({
  groupId,
  members,
  settlements,
  onClose,
  onSuccess,
}: SettleUpModalProps) {
  const [selectedSettlement, setSelectedSettlement] =
    useState<Settlement | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getMember = (id: string) => members.find((m) => m._id === id);

  const handleSettle = async () => {
    if (!selectedSettlement) return;

    setLoading(true);
    setError("");

    try {
      const amount = customAmount
        ? parseFloat(customAmount)
        : selectedSettlement.amount;

      const res = await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidById: selectedSettlement.from,
          paidToId: selectedSettlement.to,
          amount,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record payment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Settle Up
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

        {settlements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-600 dark:text-gray-400">
              All settled up! No payments needed.
            </p>
          </div>
        ) : selectedSettlement ? (
          /* Payment form */
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <Avatar
                  name={getMember(selectedSettlement.from)?.name || ""}
                  image={getMember(selectedSettlement.from)?.image}
                  size="lg"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getMember(selectedSettlement.from)?.name}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">→</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{selectedSettlement.amount.toFixed(2)}
                </span>
              </div>
              <div className="text-center">
                <Avatar
                  name={getMember(selectedSettlement.to)?.name || ""}
                  image={getMember(selectedSettlement.to)?.image}
                  size="lg"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getMember(selectedSettlement.to)?.name}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="settlement-amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Amount (or adjust)
              </label>
              <input
                id="settlement-amount"
                type="number"
                step="0.01"
                value={customAmount || selectedSettlement.amount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Venmo, Cash, etc."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSettle}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Recording...
                  </>
                ) : (
                  "Mark as Paid"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Settlement list */
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a payment to record:
            </p>
            {settlements.map((settlement, index) => {
              const from = getMember(settlement.from);
              const to = getMember(settlement.to);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSettlement(settlement)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                >
                  <Avatar
                    name={from?.name || ""}
                    image={from?.image}
                    size="sm"
                  />
                  <div className="flex-1 text-left">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {from?.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}
                      pays{" "}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {to?.name}
                    </span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ₹{settlement.amount.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {settlements.length > 0 && !selectedSettlement && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
