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
 * Body: { title, amount, paidById, splitBetweenIds, groupId, category?, expenseDate?, splitType?, splitDetails? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    amount,
    paidById,
    splitBetweenIds,
    groupId,
    category,
    expenseDate,
    splitType,
    splitDetails,
  } = body;

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

  // Validate splitDetails if provided
  if (splitType === "exact" && splitDetails) {
    const totalSplit = splitDetails.reduce(
      (sum: number, d: { amount?: number }) => sum + (d.amount || 0),
      0,
    );
    // Allow small rounding differences
    if (Math.abs(totalSplit - amount) > 0.01) {
      return NextResponse.json(
        { error: "Split amounts must equal total amount" },
        { status: 400 },
      );
    }
  }

  if (splitType === "percentage" && splitDetails) {
    const totalPercent = splitDetails.reduce(
      (sum: number, d: { percentage?: number }) => sum + (d.percentage || 0),
      0,
    );
    if (Math.abs(totalPercent - 100) > 0.01) {
      return NextResponse.json(
        { error: "Percentages must total 100%" },
        { status: 400 },
      );
    }
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
    (m) => m.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create expense with optional fields
  const expenseData: Record<string, unknown> = {
    title,
    amount,
    paidBy: paidById,
    splitBetween: splitBetweenIds,
    group: groupId,
    category: category || "other",
    expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    splitType: splitType || "equal",
  };

  // Add splitDetails if using custom split
  if ((splitType === "exact" || splitType === "percentage") && splitDetails) {
    expenseData.splitDetails = splitDetails.map(
      (d: { userId: string; amount?: number; percentage?: number }) => ({
        user: d.userId,
        amount: d.amount,
        percentage: d.percentage,
      }),
    );
  }

  const expense = await Expense.create(expenseData);

  return NextResponse.json({ expense }, { status: 201 });
}
