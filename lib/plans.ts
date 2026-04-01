export type PlanLimitKey =
  | "maxGroups"
  | "maxMembersPerGroup"
  | "maxExpensesPerMonth";

export interface PlanLimits {
  maxGroups: number;
  maxMembersPerGroup: number;
  maxExpensesPerMonth: number;
}

export const PLAN_LIMITS: Record<"free" | "pro", PlanLimits> = {
  free: {
    maxGroups: 3,
    maxMembersPerGroup: 8,
    maxExpensesPerMonth: 200,
  },
  pro: {
    maxGroups: 100,
    maxMembersPerGroup: 250,
    maxExpensesPerMonth: 10000,
  },
};
