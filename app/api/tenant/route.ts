import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { resolveTenantContext } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const ctx = await resolveTenantContext(session);
  if (!ctx) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: ctx.user._id.toString(),
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.membership.role,
      isPlatformAdmin: !!ctx.user.isPlatformAdmin,
    },
    organization: {
      id: ctx.organization._id.toString(),
      name: ctx.organization.name,
      slug: ctx.organization.slug,
    },
    subscription: {
      plan: ctx.subscription.plan,
      status: ctx.subscription.status,
      currentPeriodEnd: ctx.subscription.currentPeriodEnd,
      stripeCustomerId: ctx.subscription.stripeCustomerId || null,
    },
  });
}
