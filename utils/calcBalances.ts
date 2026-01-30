/**
 * Utility functions to calculate net balances for a group from expenses.
 *
 * Input:
 *  - expenses: array of expenses where each expense has amount, paidBy (user id), splitBetween (array of user ids)
 *  - members: array of user ids participating in the group
 *  - settlements: array of recorded payments between members
 *
 * Output:
 *  - Map of userId -> net amount (positive means others owe this user; negative means this user owes others)
 */

export type SplitType = "equal" | "exact" | "percentage";

export type SplitDetailLike = {
  user: string;
  amount?: number;
  percentage?: number;
};

export type ExpenseLike = {
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitType?: SplitType;
  splitDetails?: SplitDetailLike[];
};

export type SettlementLike = {
  paidBy: string; // Who made the payment
  paidTo: string; // Who received the payment
  amount: number;
};

/**
 * Calculate net balances for each member based on expenses and settlements.
 * Supports equal, exact amount, and percentage-based splits.
 * Settlements reduce the debt between members.
 */
export function calculateNetBalances(
  expenses: ExpenseLike[],
  members: string[],
  settlements: SettlementLike[] = [],
): Record<string, number> {
  const net: Record<string, number> = {};

  // Initialize all members with 0
  members.forEach((m) => (net[m] = 0));

  for (const expense of expenses) {
    const totalAmount = Number(expense.amount || 0);
    const splitType = expense.splitType || "equal";

    // Payer gets credited full amount (they paid)
    if (net[expense.paidBy] !== undefined) {
      net[expense.paidBy] += totalAmount;
    } else {
      net[expense.paidBy] = totalAmount;
    }

    // Calculate each participant's share based on split type
    const participants =
      expense.splitBetween && expense.splitBetween.length
        ? expense.splitBetween
        : members;

    if (splitType === "exact" && expense.splitDetails?.length) {
      // Exact amounts specified per user
      for (const detail of expense.splitDetails) {
        const share = Number(detail.amount || 0);
        if (net[detail.user] !== undefined) {
          net[detail.user] -= share;
        } else {
          net[detail.user] = -share;
        }
      }
    } else if (splitType === "percentage" && expense.splitDetails?.length) {
      // Percentage-based split
      for (const detail of expense.splitDetails) {
        const percentage = Number(detail.percentage || 0);
        const share = (totalAmount * percentage) / 100;
        if (net[detail.user] !== undefined) {
          net[detail.user] -= share;
        } else {
          net[detail.user] = -share;
        }
      }
    } else {
      // Equal split (default)
      const splitCount = participants.length || 1;
      const share = totalAmount / splitCount;

      for (const userId of participants) {
        if (net[userId] !== undefined) {
          net[userId] -= share;
        } else {
          net[userId] = -share;
        }
      }
    }
  }

  // Apply settlements: when A pays B, A's debt decreases (balance goes up)
  // and B's credit decreases (balance goes down)
  for (const settlement of settlements) {
    const amount = Number(settlement.amount || 0);

    // The person who paid reduces their debt (increases their balance)
    if (net[settlement.paidBy] !== undefined) {
      net[settlement.paidBy] += amount;
    }

    // The person who received reduces their credit (decreases their balance)
    if (net[settlement.paidTo] !== undefined) {
      net[settlement.paidTo] -= amount;
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
