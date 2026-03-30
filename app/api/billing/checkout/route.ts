import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { enforceRateLimit } from "@/lib/rateLimit";
import { hasRequiredRole, resolveTenantContext } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const rateLimited = enforceRateLimit(req, {
    bucket: "billing:checkout",
    max: 10,
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
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (!hasRequiredRole(ctx.membership.role, ["owner", "admin"])) {
    return NextResponse.json({ error: "Only admins can manage billing" }, { status: 403 });
  }

  if (!process.env.STRIPE_CHECKOUT_LINK) {
    return NextResponse.json(
      {
        error: "Billing checkout link is not configured.",
        hint: "Set STRIPE_CHECKOUT_LINK in environment variables.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: process.env.STRIPE_CHECKOUT_LINK });
}
