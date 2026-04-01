import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { resolveTenantContext } from "@/lib/tenant";

export async function POST(
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

  expense.status = "settled";
  expense.settledAt = new Date();
  await expense.save();

  if (expense.paidBy.toString() !== user._id.toString()) {
    await Notification.create({
      organization: ctx.organization._id,
      user: expense.paidBy,
      kind: "settled",
      title: "Expense settled",
      message: `${user.name} marked ${expense.title} as settled`,
      link: `/groups/${group._id}`,
    });
  }

  return NextResponse.json({
    message: "Expense settled",
    settledAt: expense.settledAt,
  });
}
