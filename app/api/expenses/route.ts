import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group";
import User from "@/models/User";

/**
 * POST /api/expenses
 * Create a new expense within a group.
 * Body: { title, amount, paidById, splitBetweenIds, groupId }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, amount, paidById, splitBetweenIds, groupId } = body;

  // Validate required fields
  if (
    !title ||
    typeof amount !== "number" ||
    !paidById ||
    !Array.isArray(splitBetweenIds) ||
    !groupId
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await dbConnect();

  // Ensure group exists
  const group = await Group.findById(groupId);

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Check if user is a member
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString()
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create expense
  const expense = await Expense.create({
    title,
    amount,
    paidBy: paidById,
    splitBetween: splitBetweenIds,
    group: groupId,
  });

  return NextResponse.json({ expense }, { status: 201 });
}
