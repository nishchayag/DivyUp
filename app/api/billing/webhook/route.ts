import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Subscription from "@/models/Subscription";

/**
 * Lightweight webhook endpoint for subscription sync.
 * Expects a JSON body with:
 * - secret: matches BILLING_WEBHOOK_SECRET
 * - event: one of subscription.updated|subscription.canceled
 * - organizationId, plan, status, currentPeriodEnd, stripeCustomerId, stripeSubscriptionId
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || body.secret !== process.env.BILLING_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  if (!body.organizationId || !body.event) {
    return NextResponse.json({ error: "Missing webhook payload fields" }, { status: 400 });
  }

  await dbConnect();

  if (body.event === "subscription.updated") {
    await Subscription.findOneAndUpdate(
      { organization: body.organizationId },
      {
        $set: {
          plan: body.plan || "free",
          status: body.status || "active",
          stripeCustomerId: body.stripeCustomerId,
          stripeSubscriptionId: body.stripeSubscriptionId,
          currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : undefined,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, updated: true });
  }

  if (body.event === "subscription.canceled") {
    await Subscription.findOneAndUpdate(
      { organization: body.organizationId },
      {
        $set: {
          plan: "free",
          status: "canceled",
          currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : undefined,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, canceled: true });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
