import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { resolveTenantContext } from "@/lib/tenant";

export async function GET(_req: NextRequest) {
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

  const notifications = await Notification.find({
    organization: ctx.organization._id,
    user: ctx.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    await Notification.updateMany(
      {
        organization: ctx.organization._id,
        user: ctx.user._id,
        readAt: { $exists: false },
      },
      { $set: { readAt: new Date() } },
    );
  } else {
    await Notification.updateMany(
      {
        _id: { $in: ids },
        organization: ctx.organization._id,
        user: ctx.user._id,
      },
      { $set: { readAt: new Date() } },
    );
  }

  return NextResponse.json({ message: "Notifications updated" });
}
