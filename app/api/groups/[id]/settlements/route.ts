import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Settlement from "@/models/Settlement";
import Group from "@/models/Group";
import User from "@/models/User";

/**
 * GET /api/groups/[id]/settlements
 * Get all settlements for a group
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const group = await Group.findById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check membership
  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settlements = await Settlement.find({ group: params.id })
    .populate("paidBy", "name email image")
    .populate("paidTo", "name email image")
    .sort({ settledAt: -1 })
    .lean();

  return NextResponse.json({ settlements });
}

/**
 * POST /api/groups/[id]/settlements
 * Record a settlement (payment) between two members
 * Body: { paidById, paidToId, amount, note? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { paidById, paidToId, amount, note } = body;

  if (!paidById || !paidToId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await dbConnect();

  const group = await Group.findById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check that the logged-in user is a member of the group
  const isMember = group.members.some(
    (m) => m.toString() === user._id.toString(),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify payer is a member
  const payerIsMember = group.members.some((m) => m.toString() === paidById);
  if (!payerIsMember) {
    return NextResponse.json(
      { error: "Payer is not a group member" },
      { status: 400 },
    );
  }

  // Verify recipient is also a member
  const recipientIsMember = group.members.some(
    (m) => m.toString() === paidToId,
  );
  if (!recipientIsMember) {
    return NextResponse.json(
      { error: "Recipient is not a group member" },
      { status: 400 },
    );
  }

  // Create settlement record
  const settlement = await Settlement.create({
    group: params.id,
    paidBy: paidById,
    paidTo: paidToId,
    amount,
    note: note || undefined,
    settledAt: new Date(),
  });

  const populatedSettlement = await Settlement.findById(settlement._id)
    .populate("paidBy", "name email image")
    .populate("paidTo", "name email image")
    .lean();

  return NextResponse.json(
    { settlement: populatedSettlement },
    { status: 201 },
  );
}

/**
 * DELETE /api/groups/[id]/settlements
 * Delete a settlement record (undo payment)
 * Body: { settlementId }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const settlementId = searchParams.get("settlementId");

  if (!settlementId) {
    return NextResponse.json(
      { error: "Settlement ID required" },
      { status: 400 },
    );
  }

  await dbConnect();

  const settlement = await Settlement.findById(settlementId);
  if (!settlement) {
    return NextResponse.json(
      { error: "Settlement not found" },
      { status: 404 },
    );
  }

  // Verify settlement belongs to this group
  if (settlement.group.toString() !== params.id) {
    return NextResponse.json(
      { error: "Settlement not in this group" },
      { status: 400 },
    );
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Only the person who made the payment can delete it
  if (settlement.paidBy.toString() !== user._id.toString()) {
    return NextResponse.json(
      { error: "Only the payer can delete this settlement" },
      { status: 403 },
    );
  }

  await Settlement.findByIdAndDelete(settlementId);

  return NextResponse.json({ message: "Settlement deleted" });
}
