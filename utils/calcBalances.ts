/**
 * Utility functions to calculate net balances for a group from expenses.
 *
 * Input:
 *  - expenses: array of expenses where each expense has amount, paidBy (user id), splitBetween (array of user ids)
 *  - members: array of user ids participating in the group
 *
 * Output:
 *  - Map of userId -> net amount (positive means others owe this user; negative means this user owes others)
 */

export type ExpenseLike = {
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitMode?: "equal" | "percentage";
  splitShares?: { userId: string; percentage: number }[];
};

/**
 * Calculate net balances for each member based on expenses.
 * Assumes equal split between members in splitBetween array.
 */
export function calculateNetBalances(
  expenses: ExpenseLike[],
  members: string[],
): Record<string, number> {
  const net: Record<string, number> = {};

  // Initialize all members with 0
  members.forEach((m) => (net[m] = 0));

  for (const expense of expenses) {
    if (!expense) continue;
    const amount = Number(expense.amount || 0);
    if (amount <= 0) continue;

    const payerId = String(expense.paidBy || "");
    if (!payerId) continue;

    // Payer gets credited full amount (they paid)
    if (net[payerId] !== undefined) {
      net[payerId] += amount;
    } else {
      net[payerId] = amount;
    }

    // Each participant owes by equal or percentage mode.
    if (expense.splitMode === "percentage" && expense.splitShares?.length) {
      for (const share of expense.splitShares) {
        const userId = String(share.userId || "");
        if (!userId) continue;
        const owed = (amount * share.percentage) / 100;
        if (net[userId] !== undefined) {
          net[userId] -= owed;
        } else {
          net[userId] = -owed;
        }
      }
    } else {
      const participants =
        expense.splitBetween && expense.splitBetween.length
          ? expense.splitBetween.map((id) => String(id || "")).filter(Boolean)
          : members;
      if (!participants.length) continue;
      const share = amount / participants.length;

      for (const userId of participants) {
        if (net[userId] !== undefined) {
          net[userId] -= share;
        } else {
          net[userId] = -share;
        }
      }
    }
  }

  // Round to 2 decimal places
  Object.keys(net).forEach((k) => {
    net[k] = Math.round((net[k] + Number.EPSILON) * 100) / 100;
  });

  return net;
}

/**
 * Returns an array of non-zero balances for display.
 * Positive = others owe this user
 * Negative = this user owes others
 */
export function simplifiedBalances(
  netMap: Record<string, number>,
): { user: string; amount: number }[] {
  return Object.entries(netMap)
    .filter(([, v]) => Math.abs(v) > 0.005)
    .map(([user, amount]) => ({ user, amount }));
}

/**
 * Compute who owes whom (simplified debts).
 * Returns list of { from, to, amount } transactions that settle all debts.
 */
export function settleDebts(
  netMap: Record<string, number>,
): { from: string; to: string; amount: number }[] {
  const balances = Object.entries(netMap)
    .map(([user, amount]) => ({ user, amount }))
    .filter((b) => Math.abs(b.amount) > 0.005);

  const debtors = balances.filter((b) => b.amount < 0);
  const creditors = balances.filter((b) => b.amount > 0);

  const transactions: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settleAmount = Math.min(-debtor.amount, creditor.amount);

    if (settleAmount > 0.005) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount += settleAmount;
    creditor.amount -= settleAmount;

    if (Math.abs(debtor.amount) < 0.005) i++;
    if (Math.abs(creditor.amount) < 0.005) j++;
  }

  return transactions;
}
