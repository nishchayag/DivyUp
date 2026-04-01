import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import { updateExpenseSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/lib/rateLimit";
import { resolveTenantContext } from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

type IdLike = { toString: () => string };

/**
 * GET /api/expenses/[id]
 * Get a single expense by ID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "expenses:read",
    max: 180,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

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

  const expense = await Expense.findById(params.id)
    .populate("paidBy", "name email image")
    .populate("splitBetween", "name email image")
    .populate("comments.user", "name email image")
    .populate("group", "name members")
    .lean();

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  // Check if user is a member of the group
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const expenseGroupId = (expense.group as { _id: IdLike })._id.toString();
  const group = await Group.findById(expenseGroupId);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ expense });
}

/**
 * PATCH /api/expenses/[id]
 * Update an expense.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "expenses:update",
    max: 100,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate input
  const result = updateExpenseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
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

  const expense = await Expense.findById(params.id);
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  // Check if user is a member of the group
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const group = await Group.findById(expense.group);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update expense
  const {
    title,
    amount,
    currency,
    paidById,
    splitBetweenIds,
    splitMode,
    splitShares,
    category,
    notes,
    status,
    recurrence,
  } = result.data;

  if (title) expense.title = title;
  if (amount !== undefined) expense.amount = amount;
  if (currency) expense.currency = currency;
  if (category !== undefined) expense.category = category;
  if (notes !== undefined) expense.notes = notes;
  if (paidById) expense.paidBy = paidById as unknown as typeof expense.paidBy;
  if (splitBetweenIds)
    expense.splitBetween =
      splitBetweenIds as unknown as typeof expense.splitBetween;
  if (splitMode) expense.splitMode = splitMode;
  if (splitShares) {
    expense.splitShares = splitShares as unknown as typeof expense.splitShares;
  }
  if (recurrence) {
    const resolvedFrequency =
      recurrence.frequency ?? expense.recurrence?.frequency ?? "monthly";
    expense.recurrence = {
      enabled: recurrence.enabled,
      frequency: resolvedFrequency,
      nextRunAt: recurrence.nextRunAt
        ? new Date(recurrence.nextRunAt)
        : undefined,
    };
  }
  if (status) {
    expense.status = status;
    expense.settledAt = status === "settled" ? new Date() : undefined;
  }

  await expense.save();

  await logAuditEvent(req, ctx, {
    action: "expense.updated",
    entityType: "expense",
    entityId: expense._id.toString(),
    metadata: { groupId: group._id.toString() },
  });

  const updatedExpense = await Expense.findById(params.id)
    .populate("paidBy", "name email image")
    .populate("splitBetween", "name email image")
    .populate("comments.user", "name email image")
    .lean();

  return NextResponse.json({ expense: updatedExpense });
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "expenses:delete",
    max: 60,
    windowMs: 60_000,
  });
  if (rateLimited) {
    return rateLimited;
  }

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

  const expense = await Expense.findById(params.id);
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  // Check if user is a member of the group
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const group = await Group.findById(expense.group);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Expense.findByIdAndDelete(params.id);

  await logAuditEvent(req, ctx, {
    action: "expense.deleted",
    entityType: "expense",
    entityId: params.id,
    metadata: { groupId: group._id.toString() },
  });

  return NextResponse.json({ message: "Expense deleted successfully" });
}
