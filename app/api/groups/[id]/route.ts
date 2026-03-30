import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import User from "@/models/User";
import { updateGroupSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/lib/rateLimit";
import { hasRequiredRole, resolveTenantContext } from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/groups/[id]
 * Returns group details + expenses. Only accessible to group members.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:read",
    max: 120,
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

  const group = await Group.findById(params.id)
    .populate("members", "name email image")
    .lean();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (
    (group as any).organization?.toString() !== ctx.organization._id.toString()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check membership
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isMember = (group.members as any[]).some(
    (m) => m._id.toString() === user._id.toString(),
  );

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch expenses for this group
  const expenses = await Expense.find({ group: params.id })
    .populate("paidBy", "name email image")
    .populate("splitBetween", "name email image")
    .sort({ createdAt: -1 })
    .lean();

  // Add creator as string for comparison in frontend
  const groupWithCreator = {
    ...group,
    creator: (group as any).creator?.toString(),
  };

  return NextResponse.json({ group: groupWithCreator, expenses });
}

/**
 * PATCH /api/groups/[id]
 * Update group details.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:update",
    max: 40,
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
  const result = updateGroupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();

  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json(
      { error: "Unable to resolve tenant" },
      { status: 400 },
    );
  }

  const group = await Group.findById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Allow creator, owner, or admin to update group metadata
  if (
    group.creator.toString() !== user._id.toString() &&
    !hasRequiredRole(ctx.membership.role, ["admin"])
  ) {
    return NextResponse.json(
      { error: "Only admins or the group creator can edit group details" },
      { status: 403 },
    );
  }

  const { name, description } = result.data;
  if (name) group.name = name;
  if (description !== undefined) group.description = description;

  await group.save();

  await logAuditEvent(req, ctx, {
    action: "group.updated",
    entityType: "group",
    entityId: group._id.toString(),
    metadata: { name: group.name },
  });

  const updatedGroup = await Group.findById(params.id)
    .populate("members", "name email image")
    .lean();

  return NextResponse.json({ group: updatedGroup });
}

/**
 * DELETE /api/groups/[id]
 * Delete a group (creator only).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:delete",
    max: 20,
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

  const group = await Group.findById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only creator/owner can delete group
  if (
    group.creator.toString() !== user._id.toString() &&
    !hasRequiredRole(ctx.membership.role, ["owner"])
  ) {
    return NextResponse.json(
      { error: "Only the group creator or owner can delete the group" },
      { status: 403 },
    );
  }

  // Delete all expenses in the group
  await Expense.deleteMany({ group: params.id });

  // Delete the group
  await Group.findByIdAndDelete(params.id);

  await logAuditEvent(req, ctx, {
    action: "group.deleted",
    entityType: "group",
    entityId: params.id,
  });

  return NextResponse.json({ message: "Group deleted successfully" });
}
