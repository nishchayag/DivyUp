import { Session } from "next-auth";
import User from "@/models/User";
import Organization from "@/models/Organization";
import Membership, { MembershipRole } from "@/models/Membership";
import Subscription from "@/models/Subscription";
import Group from "@/models/Group";
import Expense from "@/models/Expense";
import { PLAN_LIMITS, PlanLimitKey } from "@/lib/plans";

export interface TenantContext {
  user: any;
  organization: any;
  membership: any;
  subscription: any;
  plan: "free" | "pro";
}

function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

async function createUniqueOrgSlug(base: string): Promise<string> {
  const normalizedBase = base || "team";
  let attempt = 0;

  while (attempt < 10) {
    const suffix = attempt === 0 ? "" : `-${Math.floor(Math.random() * 9999)}`;
    const slug = `${normalizedBase}${suffix}`;
    const exists = await Organization.findOne({ slug }).lean();
    if (!exists) {
      return slug;
    }
    attempt += 1;
  }

  return `${normalizedBase}-${Date.now()}`;
}

export async function ensureOrganizationForUser(user: any) {
  if (user.activeOrganization) {
    const org = await Organization.findById(user.activeOrganization);
    if (org) {
      return org;
    }
  }

  const existingMembership = await Membership.findOne({
    user: user._id,
  }).populate("organization");

  if (existingMembership?.organization) {
    user.activeOrganization = (existingMembership.organization as any)._id;
    await user.save();
    return existingMembership.organization;
  }

  const baseSlug = slugifyOrganizationName(
    user.name || user.email?.split("@")[0] || "team",
  );
  const slug = await createUniqueOrgSlug(baseSlug);

  const org = await Organization.create({
    name: `${user.name || "New"}'s Workspace`,
    slug,
    owner: user._id,
  });

  await Membership.create({
    user: user._id,
    organization: org._id,
    role: "owner",
  });

  await Subscription.create({
    organization: org._id,
    plan: "free",
    status: "active",
  });

  user.activeOrganization = org._id;
  await user.save();

  return org;
}

export async function resolveTenantContext(
  session: Session,
): Promise<TenantContext | null> {
  const email = session?.user?.email;
  if (!email) {
    return null;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return null;
  }

  const organization = await ensureOrganizationForUser(user);
  if (!organization) {
    return null;
  }

  const membership = await Membership.findOne({
    user: user._id,
    organization: organization._id,
  });

  if (!membership) {
    return null;
  }

  const subscription =
    (await Subscription.findOne({ organization: organization._id })) ||
    (await Subscription.create({
      organization: organization._id,
      plan: "free",
      status: "active",
    }));

  const plan = (subscription.plan || "free") as "free" | "pro";

  return {
    user,
    organization,
    membership,
    subscription,
    plan,
  };
}

export function hasRequiredRole(
  role: MembershipRole,
  allowed: MembershipRole[],
): boolean {
  const rank: Record<MembershipRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return allowed.some((allowedRole) => rank[role] >= rank[allowedRole]);
}

export async function checkUsageLimit(ctx: TenantContext, key: PlanLimitKey) {
  const limits = PLAN_LIMITS[ctx.plan];

  if (key === "maxGroups") {
    const totalGroups = await Group.countDocuments({
      organization: ctx.organization._id,
    });
    return {
      allowed: totalGroups < limits.maxGroups,
      current: totalGroups,
      limit: limits.maxGroups,
    };
  }

  if (key === "maxMembersPerGroup") {
    const totalMembers = await Membership.countDocuments({
      organization: ctx.organization._id,
    });
    return {
      allowed: totalMembers < limits.maxMembersPerGroup,
      current: totalMembers,
      limit: limits.maxMembersPerGroup,
    };
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const groups = await Group.find({ organization: ctx.organization._id })
    .select("_id")
    .lean();
  const groupIds = groups.map((g: any) => g._id);

  const monthlyExpenses = await Expense.countDocuments({
    group: { $in: groupIds },
    createdAt: { $gte: start },
  });

  return {
    allowed: monthlyExpenses < limits.maxExpensesPerMonth,
    current: monthlyExpenses,
    limit: limits.maxExpensesPerMonth,
  };
}
