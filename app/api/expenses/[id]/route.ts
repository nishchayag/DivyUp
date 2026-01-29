import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";
import { updateExpenseSchema } from "@/lib/validations";

/**
 * GET /api/expenses/[id]
 * Get a single expense by ID.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const expense = await Expense.findById(params.id)
    .populate("paidBy", "name email image")
    .populate("splitBetween", "name email image")
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

  const group = await Group.findById((expense.group as any)._id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m: any) => m.toString() === user._id.toString()
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
  { params }: { params: { id: string } }
) {
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
      { status: 400 }
    );
  }

  await dbConnect();

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

  const isMember = group.members.some(
    (m: any) => m.toString() === user._id.toString()
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update expense
  const { title, amount, paidById, splitBetweenIds } = result.data;

  if (title) expense.title = title;
  if (amount !== undefined) expense.amount = amount;
  if (paidById) expense.paidBy = paidById as any;
  if (splitBetweenIds) expense.splitBetween = splitBetweenIds as any;

  await expense.save();

  const updatedExpense = await Expense.findById(params.id)
    .populate("paidBy", "name email image")
    .populate("splitBetween", "name email image")
    .lean();

  return NextResponse.json({ expense: updatedExpense });
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

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

  const isMember = group.members.some(
    (m: any) => m.toString() === user._id.toString()
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Expense.findByIdAndDelete(params.id);

  return NextResponse.json({ message: "Expense deleted successfully" });
}
