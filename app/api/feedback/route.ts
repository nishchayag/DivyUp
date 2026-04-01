import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { resolveTenantContext, hasRequiredRole } from "@/lib/tenant";
import { feedbackSchema } from "@/lib/validations";
import Feedback from "@/models/Feedback";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: firstError || "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json({ error: "Unable to resolve tenant" }, { status: 400 });
  }

  const feedback = await Feedback.create({
    organization: ctx.organization._id,
    user: ctx.user._id,
    message: parsed.data.message,
    page: parsed.data.page,
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json({ error: "Unable to resolve tenant" }, { status: 400 });
  }

  if (!hasRequiredRole(ctx.membership.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const feedback = await Feedback.find({ organization: ctx.organization._id })
    .populate("user", "name email image")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ feedback });
}
