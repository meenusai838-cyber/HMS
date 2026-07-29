import { describe, it, expect } from "vitest";
import {
  BillItemSchema,
  PaymentSchema,
  InsuranceClaimSchema,
  AllergySchema,
  RegisterPatientSchema,
} from "./validation";

describe("BillItemSchema", () => {
  it("accepts a valid line item and coerces numeric strings", () => {
    const parsed = BillItemSchema.parse({
      billId: "bill_1",
      category: "MEDICINE",
      description: "Paracetamol",
      quantity: "15",
      unitPrice: "0.25",
    });

    expect(parsed).toMatchObject({ quantity: 15, unitPrice: 0.25 });
  });

  it("rejects a quantity below 1", () => {
    const result = BillItemSchema.safeParse({
      billId: "bill_1",
      category: "OTHER",
      description: "Fee",
      quantity: 0,
      unitPrice: 10,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative unit price", () => {
    const result = BillItemSchema.safeParse({
      billId: "bill_1",
      category: "OTHER",
      description: "Fee",
      quantity: 1,
      unitPrice: -5,
    });

    expect(result.success).toBe(false);
  });
});

describe("PaymentSchema", () => {
  it("rejects a zero or negative amount", () => {
    expect(PaymentSchema.safeParse({ billId: "b1", amount: 0, method: "CASH" }).success).toBe(false);
    expect(PaymentSchema.safeParse({ billId: "b1", amount: -1, method: "CASH" }).success).toBe(false);
  });

  it("accepts a positive amount with a valid method", () => {
    const result = PaymentSchema.safeParse({ billId: "b1", amount: 25.5, method: "CARD" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown payment method", () => {
    const result = PaymentSchema.safeParse({ billId: "b1", amount: 25, method: "CRYPTO" });
    expect(result.success).toBe(false);
  });
});

describe("InsuranceClaimSchema", () => {
  it("requires a positive claimed amount", () => {
    const result = InsuranceClaimSchema.safeParse({
      billId: "b1",
      insurerName: "Acme Health",
      policyNumber: "POL-1",
      claimedAmount: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("AllergySchema", () => {
  it("defaults are not applied for severity — an invalid enum value is rejected", () => {
    const result = AllergySchema.safeParse({
      patientId: "p1",
      substance: "Penicillin",
      severity: "EXTREME",
    });
    expect(result.success).toBe(false);
  });
});

describe("RegisterPatientSchema", () => {
  it("rejects an invalid email", () => {
    const result = RegisterPatientSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      password: "password123",
      dob: "1990-01-01",
      gender: "Male",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = RegisterPatientSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "short",
      dob: "1990-01-01",
      gender: "Male",
    });
    expect(result.success).toBe(false);
  });
});
