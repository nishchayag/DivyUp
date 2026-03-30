import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import Organization from "@/models/Organization";
import Subscription from "@/models/Subscription";

function isAdminUser(email?: string | null) {
  if (!email) {
    return false;
  }

  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  return allowList.includes(email.toLowerCase());
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findOne({ email: session.user.email.toLowerCase() }).lean();
  const allowed = !!user?.isPlatformAdmin || isAdminUser(session.user.email);

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, orgs, groups, expenses, proSubscriptions] = await Promise.all([
    User.countDocuments(),
    Organization.countDocuments(),
    Group.countDocuments(),
    Expense.countDocuments(),
    Subscription.countDocuments({ plan: "pro", status: { $in: ["active", "trialing"] } }),
  ]);

  return NextResponse.json({
    metrics: {
      users,
      organizations: orgs,
      groups,
      expenses,
      proSubscriptions,
      conversionRate: users ? Number(((proSubscriptions / users) * 100).toFixed(2)) : 0,
    },
  });
}
