import { describe, expect, it } from "vitest";
import { calculateNetBalances, settleDebts } from "./calcBalances";

describe("calculateNetBalances", () => {
  it("handles equal split", () => {
    const net = calculateNetBalances(
      [
        {
          amount: 120,
          paidBy: "u1",
          splitBetween: ["u1", "u2", "u3"],
          splitMode: "equal",
        },
      ],
      ["u1", "u2", "u3"],
    );

    expect(net).toEqual({ u1: 80, u2: -40, u3: -40 });
  });

  it("handles percentage split", () => {
    const net = calculateNetBalances(
      [
        {
          amount: 100,
          paidBy: "u1",
          splitBetween: ["u1", "u2"],
          splitMode: "percentage",
          splitShares: [
            { userId: "u1", percentage: 30 },
            { userId: "u2", percentage: 70 },
          ],
        },
      ],
      ["u1", "u2"],
    );

    expect(net).toEqual({ u1: 70, u2: -70 });
  });

  it("handles fixed split", () => {
    const net = calculateNetBalances(
      [
        {
          amount: 150,
          paidBy: "u2",
          splitBetween: ["u1", "u2", "u3"],
          splitMode: "fixed",
          fixedShares: [
            { userId: "u1", amount: 50 },
            { userId: "u2", amount: 25 },
            { userId: "u3", amount: 75 },
          ],
        },
      ],
      ["u1", "u2", "u3"],
    );

    expect(net).toEqual({ u1: -50, u2: 125, u3: -75 });
  });

  it("handles itemized split", () => {
    const net = calculateNetBalances(
      [
        {
          amount: 90,
          paidBy: "u3",
          splitBetween: ["u1", "u2", "u3"],
          splitMode: "itemized",
          itemizedShares: [
            { label: "Pizza", amount: 60, assignedTo: ["u1", "u2"] },
            { label: "Taxi", amount: 30, assignedTo: ["u3"] },
          ],
        },
      ],
      ["u1", "u2", "u3"],
    );

    expect(net).toEqual({ u1: -30, u2: -30, u3: 60 });
  });
});

describe("settleDebts", () => {
  it("returns simplified settlement transactions", () => {
    const txns = settleDebts({ u1: 80, u2: -30, u3: -50 });

    expect(txns).toEqual([
      { from: "u2", to: "u1", amount: 30 },
      { from: "u3", to: "u1", amount: 50 },
    ]);
  });
});
