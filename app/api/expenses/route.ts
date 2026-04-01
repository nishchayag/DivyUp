import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import { createExpenseSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/lib/rateLimit";
import { checkUsageLimit, resolveTenantContext } from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/expenses
 * Create a new expense within a group.
 * Body: { title, amount, paidById, splitBetweenIds, groupId }
 */
export async function POST(req: NextRequest) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "expenses:create",
    max: 80,
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
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors,
    )[0]?.[0];
    return NextResponse.json(
      { error: firstError || "Invalid payload" },
      { status: 400 },
    );
  }

  const {
    title,
    amount,
    currency,
    paidById,
    splitBetweenIds,
    splitMode,
    splitPreset,
    splitShares,
    fixedShares,
    itemizedShares,
    recurrence,
    bulkCreate,
    category,
    notes,
    groupId,
  } = parsed.data;

  await dbConnect();

  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json(
      { error: "Unable to resolve tenant" },
      { status: 400 },
    );
  }

  const limit = await checkUsageLimit(ctx, "maxExpensesPerMonth");
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Monthly expense limit reached: ${limit.current}/${limit.limit}. Upgrade to Pro for higher limits.`,
      },
      { status: 402 },
    );
  }

  // Ensure group exists
  const group = await Group.findById(groupId);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if user is a member
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (group.isArchived) {
    return NextResponse.json(
      { error: "Group is archived. Unarchive it to add expenses." },
      { status: 400 },
    );
  }

  const firstDay = new Date();
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);

  if (group.monthlyBudget && group.monthlyBudget > 0) {
    const monthExpenses = await Expense.find({
      group: groupId,
      createdAt: { $gte: firstDay },
      status: { $ne: "settled" },
    }).select("amount");
    const monthTotal = monthExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );
    if (monthTotal + amount > group.monthlyBudget) {
      return NextResponse.json(
        {
          error: `Monthly budget exceeded: ${monthTotal + amount} > ${group.monthlyBudget}`,
        },
        { status: 400 },
      );
    }
  }

  const createPayload = {
    title,
    amount,
    currency: currency || group.currency || "USD",
    category,
    notes,
    paidBy: paidById,
    splitBetween: splitBetweenIds,
    splitMode,
    splitPreset: splitPreset || "custom",
    splitShares,
    fixedShares,
    itemizedShares,
    recurrence: recurrence?.enabled
      ? {
          enabled: true,
          frequency: recurrence.frequency || "monthly",
          nextRunAt: recurrence.nextRunAt
            ? new Date(recurrence.nextRunAt)
            : undefined,
          templateName: recurrence.templateName,
          autoApprove: recurrence.autoApprove ?? false,
        }
      : { enabled: false },
    group: groupId,
  };

  // Bulk create support for recurring templates / mass entry
  let expense;
  if (bulkCreate?.count && bulkCreate.count > 1) {
    const intervalDays = bulkCreate.intervalDays || 1;
    const docs = Array.from({ length: bulkCreate.count }).map((_, index) => {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() + index * intervalDays);
      return { ...createPayload, createdAt, updatedAt: createdAt };
    });
    const created = await Expense.insertMany(docs);
    expense = created[0];
  } else {
    expense = await Expense.create(createPayload);
  }

  await logAuditEvent(req, ctx, {
    action: "expense.created",
    entityType: "expense",
    entityId: expense._id.toString(),
    metadata: { amount, groupId },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
