import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";

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
  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ groups: [] });
  }

  const groups = await Group.find({ members: user._id })
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, memberEmails } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  await dbConnect();
  const creator = await User.findOne({ email: session.user.email });

  if (!creator) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

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
    members,
    creator: creator._id,
  });

  return NextResponse.json({ group }, { status: 201 });
}
