import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { expensePaymentSchema } from "@/lib/validations";
import { resolveTenantContext } from "@/lib/tenant";
import { formatCurrency } from "@/utils/currency";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const expense = await Expense.findById(params.id)
    .populate("payments.paidBy", "name email image")
    .lean();
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ payments: expense.payments || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = expensePaymentSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors,
    )[0]?.[0];
    return NextResponse.json(
      { error: firstError || "Invalid payment" },
      { status: 400 },
    );
  }

  await dbConnect();
  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json(
      { error: "Unable to resolve tenant" },
      { status: 400 },
    );
  }

  const user = await User.findOne({ email: session.user.email });
  const expense = await Expense.findById(params.id);

  if (!user || !expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const group = await Group.findById(expense.group);
  if (
    !group ||
    group.organization.toString() !== ctx.organization._id.toString()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  expense.payments.push({
    amount: parsed.data.amount,
    paidBy: user._id,
    note: parsed.data.note,
    createdAt: new Date(),
  } as never);

  const totalPaid = expense.payments.reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0,
  );
  if (totalPaid >= expense.amount) {
    expense.status = "settled";
    expense.settledAt = new Date();
  }

  await expense.save();

  await Notification.create({
    organization: ctx.organization._id,
    user: expense.paidBy,
    kind: "payment",
    title: "New payment recorded",
    message: `${user.name} recorded ${formatCurrency(parsed.data.amount, expense.currency || "USD")} on ${expense.title}`,
    link: `/groups/${group._id}`,
  });

  const updated = await Expense.findById(params.id)
    .populate("payments.paidBy", "name email image")
    .lean();

  return NextResponse.json({ expense: updated }, { status: 201 });
}
