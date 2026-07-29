"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { completeLabOrder } from "@/lib/lab";
import { saveUploadedFile } from "@/lib/file-storage";

export type CompleteOrderState = { error?: string } | undefined;

export async function completeOrderAction(
  _prevState: CompleteOrderState,
  formData: FormData
): Promise<CompleteOrderState> {
  await requireRole(["LAB"]);

  const labOrderId = String(formData.get("labOrderId") ?? "");
  const resultSummary = String(formData.get("resultSummary") ?? "");
  if (!resultSummary) {
    return { error: "Enter a result summary before completing." };
  }

  const file = formData.get("report");
  let reportFileName: string | undefined;
  let reportStoredName: string | undefined;

  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file, "lab-reports");
    reportFileName = saved.originalName;
    reportStoredName = saved.storedName;
  }

  await completeLabOrder({ labOrderId, resultSummary, reportFileName, reportStoredName });

  redirect("/lab");
}
