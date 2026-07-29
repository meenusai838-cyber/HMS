"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { transferPatient, dischargePatient, BedUnavailableError } from "@/lib/ward";

export type TransferState = { error?: string } | undefined;

export async function transferPatientAction(
  _prevState: TransferState,
  formData: FormData
): Promise<TransferState> {
  await requireRole(["NURSE"]);

  const admissionId = String(formData.get("admissionId") ?? "");
  const newBedId = String(formData.get("newBedId") ?? "");
  if (!newBedId) {
    return { error: "Choose a bed to transfer to." };
  }

  try {
    await transferPatient({ admissionId, newBedId });
  } catch (error) {
    if (error instanceof BedUnavailableError) {
      return { error: error.message };
    }
    return { error: error instanceof Error ? error.message : "Transfer failed." };
  }

  revalidatePath(`/nurse/admissions/${admissionId}`);
  revalidatePath("/nurse");
}

export async function dischargePatientAction(formData: FormData) {
  await requireRole(["NURSE"]);
  const admissionId = String(formData.get("admissionId") ?? "");
  await dischargePatient(admissionId);
  revalidatePath(`/nurse/admissions/${admissionId}`);
  revalidatePath("/nurse");
}
