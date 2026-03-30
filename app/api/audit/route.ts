import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import AuditLog from "@/models/AuditLog";
import { enforceRateLimit } from "@/lib/rateLimit";
import { hasRequiredRole, resolveTenantContext } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "audit:read",
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

  await dbConnect();
  const ctx = await resolveTenantContext(session);

  if (!ctx || !hasRequiredRole(ctx.membership.role, ["admin"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 50)));

  const events = await AuditLog.find({ organization: ctx.organization._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ events });
}
