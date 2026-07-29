"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { receiveBatch } from "@/lib/pharmacy";

export type ReceiveBatchState = { error?: string } | undefined;

export async function receiveBatchAction(
  _prevState: ReceiveBatchState,
  formData: FormData
): Promise<ReceiveBatchState> {
  await requireRole(["PHARMACY"]);

  const medicineId = String(formData.get("medicineId") ?? "");
  const batchNumber = String(formData.get("batchNumber") ?? "");
  const expiryDate = String(formData.get("expiryDate") ?? "");
  const quantityRaw = String(formData.get("quantity") ?? "");

  if (!medicineId || !batchNumber || !expiryDate || !quantityRaw) {
    return { error: "All fields are required." };
  }

  const quantity = Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be a positive number." };
  }

  await receiveBatch({ medicineId, batchNumber, expiryDate: new Date(expiryDate), quantity });
  revalidatePath("/pharmacy");
}
