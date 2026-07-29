"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { mergePatients } from "@/lib/patients";

export type MergeState = { error?: string } | undefined;

export async function mergePatientsAction(
  _prevState: MergeState,
  formData: FormData
): Promise<MergeState> {
  await requireRole(["FRONT_DESK", "ADMIN"]);

  const survivorId = String(formData.get("survivorId") ?? "");
  const duplicateId = String(formData.get("duplicateId") ?? "");

  if (!survivorId || !duplicateId) {
    return { error: "Select both a surviving profile and a duplicate to merge." };
  }
  if (survivorId === duplicateId) {
    return { error: "Choose two different profiles." };
  }

  try {
    await mergePatients(survivorId, duplicateId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Merge failed." };
  }

  redirect(`/front-desk/patients/${survivorId}?merged=true`);
}
