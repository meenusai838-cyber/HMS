"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { collectSample, startProcessing } from "@/lib/lab";

export async function collectSampleAction(formData: FormData) {
  await requireRole(["LAB"]);
  const labOrderId = String(formData.get("labOrderId") ?? "");
  await collectSample(labOrderId);
  revalidatePath("/lab");
}

export async function startProcessingAction(formData: FormData) {
  await requireRole(["LAB"]);
  const labOrderId = String(formData.get("labOrderId") ?? "");
  await startProcessing(labOrderId);
  revalidatePath("/lab");
}
