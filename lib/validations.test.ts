import { describe, expect, it } from "vitest";
import { createExpenseSchema } from "./validations";

const basePayload = {
  title: "Dinner",
  amount: 100,
  currency: "USD" as const,
  paidById: "u1",
  splitBetweenIds: ["u1", "u2"],
  groupId: "g1",
};

describe("createExpenseSchema", () => {
  it("accepts valid percentage split", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      splitMode: "percentage",
      splitShares: [
        { userId: "u1", percentage: 40 },
        { userId: "u2", percentage: 60 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid percentage totals", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      splitMode: "percentage",
      splitShares: [
        { userId: "u1", percentage: 20 },
        { userId: "u2", percentage: 70 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid fixed split", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      splitMode: "fixed",
      fixedShares: [
        { userId: "u1", amount: 40 },
        { userId: "u2", amount: 60 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects fixed split when shares do not match amount", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      splitMode: "fixed",
      fixedShares: [
        { userId: "u1", amount: 10 },
        { userId: "u2", amount: 20 },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid itemized split", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      amount: 150,
      splitMode: "itemized",
      itemizedShares: [
        { label: "Food", amount: 100, assignedTo: ["u1", "u2"] },
        { label: "Cab", amount: 50, assignedTo: ["u2"] },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects itemized split when totals mismatch", () => {
    const result = createExpenseSchema.safeParse({
      ...basePayload,
      amount: 200,
      splitMode: "itemized",
      itemizedShares: [{ label: "Food", amount: 100, assignedTo: ["u1"] }],
    });

    expect(result.success).toBe(false);
  });
});
