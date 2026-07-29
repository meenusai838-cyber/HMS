import { describe, it, expect } from "vitest";
import { getBillTotals } from "./billing";

describe("getBillTotals", () => {
  it("sums items and payments, and computes the remaining balance", () => {
    const bill = {
      items: [{ amount: 80 }, { amount: 35 }, { amount: 3.75 }],
      payments: [{ amount: 50 }],
    };

    expect(getBillTotals(bill)).toEqual({ total: 118.75, paid: 50, balance: 68.75 });
  });

  it("treats a bill with no items or payments as zero", () => {
    expect(getBillTotals({ items: [], payments: [] })).toEqual({ total: 0, paid: 0, balance: 0 });
  });

  it("allows the balance to reach exactly zero once paid in full", () => {
    const bill = {
      items: [{ amount: 100 }],
      payments: [{ amount: 60 }, { amount: 40 }],
    };

    expect(getBillTotals(bill).balance).toBe(0);
  });
});
