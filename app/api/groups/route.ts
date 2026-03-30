import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import { createGroupSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/lib/rateLimit";
import { checkUsageLimit, resolveTenantContext } from "@/lib/tenant";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/groups
 * Returns all groups for the authenticated user.
 */
export async function GET() {
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

  const user = await User.findOne({ email: session.user.email.toLowerCase() });

  if (!user) {
    return NextResponse.json({ groups: [] });
  }

  const groups = await Group.find({
    members: user._id,
    organization: ctx.organization._id,
  })
    .populate("members", "name email image")
    .lean();

  return NextResponse.json({ groups });
}

/**
 * POST /api/groups
 * Create a new group. The creator is automatically added as a member.
 * Body: { name: string, description?: string, memberEmails?: string[] }
 */
export async function POST(req: NextRequest) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "groups:create",
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

  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors,
    )[0]?.[0];
    return NextResponse.json(
      { error: firstError || "Invalid input" },
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

  const limit = await checkUsageLimit(ctx, "maxGroups");
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Plan limit reached: ${limit.current}/${limit.limit} groups. Upgrade to Pro to create more groups.`,
      },
      { status: 402 },
    );
  }

  const creator = await User.findOne({
    email: session.user.email.toLowerCase(),
  });

  if (!creator || creator._id.toString() !== ctx.user._id.toString()) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name, description, memberEmails } = parsed.data;

  // Start with creator as member
  const members = [creator._id];

  // Add other members by email if provided
  if (Array.isArray(memberEmails) && memberEmails.length > 0) {
    const otherUsers = await User.find({ email: { $in: memberEmails } });
    for (const u of otherUsers) {
      if (!members.some((m) => m.toString() === u._id.toString())) {
        members.push(u._id);
      }
    }
  }

  const group = await Group.create({
    name,
    description,
    organization: ctx.organization._id,
    members,
    creator: creator._id,
  });

  await logAuditEvent(req, ctx, {
    action: "group.created",
    entityType: "group",
    entityId: group._id.toString(),
    metadata: { name: group.name, membersCount: members.length },
  });

  return NextResponse.json({ group }, { status: 201 });
}
