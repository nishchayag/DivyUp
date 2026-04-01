import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { expenseCommentSchema } from "@/lib/validations";
import { resolveTenantContext } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
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

  const expense = await Expense.findById(params.id)
    .populate("comments.user", "name email image")
    .lean();

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const group = await Group.findById(expense.group);
  if (
    !group ||
    group.organization.toString() !== ctx.organization._id.toString()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ comments: expense.comments || [] });
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
  const parsed = expenseCommentSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors,
    )[0]?.[0];
    return NextResponse.json(
      { error: firstError || "Invalid comment" },
      { status: 400 },
    );
  }

  await dbConnect();

  const user = await User.findOne({ email: session.user.email });
  const expense = await Expense.findById(params.id);

  if (!user || !expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const group = await Group.findById(expense.group);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  expense.comments.push({
    user: user._id,
    text: parsed.data.text,
    createdAt: new Date(),
  } as never);

  await expense.save();

  // Notify payer when someone else comments on their expense.
  if (expense.paidBy.toString() !== user._id.toString()) {
    const ctx = await resolveTenantContext(session);
    if (ctx) {
      await Notification.create({
        organization: ctx.organization._id,
        user: expense.paidBy,
        kind: "comment",
        title: "New expense comment",
        message: `${user.name} commented on ${expense.title}`,
      });
    }
  }

  const updated = await Expense.findById(params.id)
    .populate("comments.user", "name email image")
    .lean();

  return NextResponse.json(
    { comments: updated?.comments || [] },
    { status: 201 },
  );
}
