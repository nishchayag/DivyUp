import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { resolveTenantContext } from "@/lib/tenant";
import { convertCurrency } from "@/utils/currency";

type IdLike = { toString: () => string };

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json(
      { error: "Unable to resolve tenant" },
      { status: 400 },
    );
  }

  const group = await Group.findById(params.id).populate("members", "name");
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await User.findOne({ email: session.user.email.toLowerCase() });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m: { _id: IdLike }) => m._id.toString() === user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expenses = await Expense.find({ group: params.id }).lean();
  const groupCurrency = group.currency || "USD";

  const normalized = expenses.map((expense) => {
    const convertedAmount =
      expense.currency && expense.currency !== groupCurrency
        ? convertCurrency(expense.amount, expense.currency, groupCurrency)
        : expense.amount;
    return {
      ...expense,
      convertedAmount,
      monthKey: new Date(expense.createdAt).toISOString().slice(0, 7),
    };
  });

  const monthlyTrendMap = normalized.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.monthKey] = (acc[e.monthKey] || 0) + e.convertedAmount;
      return acc;
    },
    {},
  );

  const categoryMap = normalized.reduce<Record<string, number>>((acc, e) => {
    const key = e.category || "General";
    acc[key] = (acc[key] || 0) + e.convertedAmount;
    return acc;
  }, {});

  const payerMap = normalized.reduce<Record<string, number>>((acc, e) => {
    const key = e.paidBy.toString();
    acc[key] = (acc[key] || 0) + e.convertedAmount;
    return acc;
  }, {});

  const members = group.members as unknown as Array<{
    _id: IdLike;
    name: string;
  }>;

  const payerEntries = Object.entries(payerMap)
    .map(([id, amount]) => ({
      id,
      name: members.find((m) => m._id.toString() === id)?.name || "Unknown",
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyTrend = Object.entries(monthlyTrendMap)
    .map(([month, amount]) => ({
      month,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const total = normalized.reduce((sum, e) => sum + e.convertedAmount, 0);
  const settled = normalized
    .filter((e) => e.status === "settled")
    .reduce((sum, e) => sum + e.convertedAmount, 0);

  return NextResponse.json({
    currency: groupCurrency,
    total: Math.round((total + Number.EPSILON) * 100) / 100,
    settled: Math.round((settled + Number.EPSILON) * 100) / 100,
    open: Math.round((total - settled + Number.EPSILON) * 100) / 100,
    monthlyTrend,
    byCategory: categoryMap,
    topPayers: payerEntries,
  });
}
