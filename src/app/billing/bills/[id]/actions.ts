"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import {
  addBillItem,
  removeBillItem,
  recordPayment,
  fileInsuranceClaim,
  updateClaimStatus,
  BillClosedError,
  ClaimExistsError,
  OverpaymentError,
} from "@/lib/billing";
import { BillItemSchema, PaymentSchema, InsuranceClaimSchema, ClaimUpdateSchema } from "@/lib/validation";

export type FormState = { errors?: Record<string, string[]>; error?: string } | undefined;

export async function addBillItemAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole(["BILLING", "ADMIN"]);

  const parsed = BillItemSchema.safeParse({
    billId: formData.get("billId"),
    category: formData.get("category"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await addBillItem(parsed.data);
  } catch (error) {
    if (error instanceof BillClosedError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/billing/bills/${parsed.data.billId}`);
}

export async function removeBillItemAction(formData: FormData) {
  await requireRole(["BILLING", "ADMIN"]);
  const billId = String(formData.get("billId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  await removeBillItem(itemId);
  revalidatePath(`/billing/bills/${billId}`);
}

export async function recordPaymentAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole(["BILLING", "ADMIN"]);

  const parsed = PaymentSchema.safeParse({
    billId: formData.get("billId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await recordPayment(parsed.data);
  } catch (error) {
    if (error instanceof BillClosedError || error instanceof OverpaymentError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath(`/billing/bills/${parsed.data.billId}`);
  revalidatePath("/billing");
}

export async function fileClaimAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole(["BILLING", "ADMIN"]);

  const parsed = InsuranceClaimSchema.safeParse({
    billId: formData.get("billId"),
    insurerName: formData.get("insurerName"),
    policyNumber: formData.get("policyNumber"),
    claimedAmount: formData.get("claimedAmount"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await fileInsuranceClaim(parsed.data);
  } catch (error) {
    if (error instanceof ClaimExistsError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/billing/bills/${parsed.data.billId}`);
}

export async function updateClaimStatusAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireRole(["BILLING", "ADMIN"]);

  const billId = String(formData.get("billId") ?? "");
  const parsed = ClaimUpdateSchema.safeParse({
    claimId: formData.get("claimId"),
    status: formData.get("status"),
    approvedAmount: formData.get("approvedAmount") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await updateClaimStatus(parsed.data);
  revalidatePath(`/billing/bills/${billId}`);
}
