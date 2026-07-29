"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { dispenseItem, InsufficientStockError } from "@/lib/pharmacy";

export type DispenseState = { error?: string } | undefined;

export async function dispenseItemAction(
  _prevState: DispenseState,
  formData: FormData
): Promise<DispenseState> {
  await requireRole(["PHARMACY"]);

  const itemId = String(formData.get("itemId") ?? "");
  const quantityRaw = String(formData.get("quantity") ?? "");
  const quantity = Number(quantityRaw);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Enter a valid quantity." };
  }

  try {
    await dispenseItem({ itemId, quantity });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/pharmacy/dispense");
}
