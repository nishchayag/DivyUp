import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";
import {
  checkUsageLimit,
  hasRequiredRole,
  resolveTenantContext,
} from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

/**
 * POST /api/groups/[id]/members
 * Add a member to a group by email.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:members:add",
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
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await dbConnect();

  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json(
      { error: "Unable to resolve tenant" },
      { status: 400 },
    );
  }

  const usage = await checkUsageLimit(ctx, "maxMembersPerGroup");
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: `Plan limit reached: ${usage.current}/${usage.limit} members. Upgrade to Pro for larger teams.`,
      },
      { status: 402 },
    );
  }

  const group = await Group.findById(params.id);
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if current user is a member (only members can add others)
  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isCurrentUserMember = group.members.some(
    (m: any) => m.toString() === currentUser._id.toString(),
  );

  if (!isCurrentUserMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasRequiredRole(ctx.membership.role, ["admin"])) {
    return NextResponse.json(
      { error: "Only owners/admins can add members" },
      { status: 403 },
    );
  }

  // Find the user to add
  const userToAdd = await User.findOne({ email: email.toLowerCase() });
  if (!userToAdd) {
    return NextResponse.json(
      { error: "User not found. They need to sign up first." },
      { status: 404 },
    );
  }

  // Check if already a member
  const isAlreadyMember = group.members.some(
    (m: any) => m.toString() === userToAdd._id.toString(),
  );

  if (isAlreadyMember) {
    return NextResponse.json(
      { error: "User is already a member" },
      { status: 400 },
    );
  }

  // Add member
  group.members.push(userToAdd._id);
  await group.save();

  await logAuditEvent(req, ctx, {
    action: "group.member.added",
    entityType: "group",
    entityId: group._id.toString(),
    metadata: { memberId: userToAdd._id.toString(), email: userToAdd.email },
  });

  const updatedGroup = await Group.findById(params.id)
    .populate("members", "name email image")
    .lean();

  return NextResponse.json({ group: updatedGroup });
}

/**
 * DELETE /api/groups/[id]/members
 * Remove a member from a group (or leave the group).
 * Query param: userId (if removing someone else) or leave empty to leave yourself
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:members:remove",
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

  const { searchParams } = new URL(req.url);
  const userIdToRemove = searchParams.get("userId");

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

  if (group.organization.toString() !== ctx.organization._id.toString()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isCurrentUserMember = group.members.some(
    (m: any) => m.toString() === currentUser._id.toString(),
  );

  if (!isCurrentUserMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine who to remove
  let targetUserId = currentUser._id.toString();

  if (userIdToRemove && userIdToRemove !== currentUser._id.toString()) {
    // Only creator/admin can remove others
    if (
      group.creator.toString() !== currentUser._id.toString() &&
      !hasRequiredRole(ctx.membership.role, ["admin"])
    ) {
      return NextResponse.json(
        { error: "Only admins or the group creator can remove other members" },
        { status: 403 },
      );
    }
    targetUserId = userIdToRemove;
  }

  // Cannot remove the creator
  if (targetUserId === group.creator.toString() && group.members.length > 1) {
    return NextResponse.json(
      { error: "Cannot remove the group creator while other members exist" },
      { status: 400 },
    );
  }

  // Remove member
  group.members = group.members.filter(
    (m: any) => m.toString() !== targetUserId,
  );

  // If no members left, delete the group
  if (group.members.length === 0) {
    await Group.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Group deleted (no members left)" });
  }

  // If creator left, transfer to first remaining member
  if (targetUserId === group.creator.toString()) {
    group.creator = group.members[0];
  }

  await group.save();

  await logAuditEvent(req, ctx, {
    action: "group.member.removed",
    entityType: "group",
    entityId: group._id.toString(),
    metadata: { removedUserId: targetUserId },
  });

  const updatedGroup = await Group.findById(params.id)
    .populate("members", "name email image")
    .lean();

  return NextResponse.json({
    message: "Member removed successfully",
    group: updatedGroup,
  });
}
