"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { generateBillFromConsultation, generateBillFromAdmission } from "@/lib/billing";

export async function generateBillFromConsultationAction(formData: FormData) {
  await requireRole(["BILLING", "ADMIN"]);
  const consultationId = String(formData.get("consultationId") ?? "");
  const bill = await generateBillFromConsultation(consultationId);
  revalidatePath("/billing");
  redirect(`/billing/bills/${bill.id}`);
}

export async function generateBillFromAdmissionAction(formData: FormData) {
  await requireRole(["BILLING", "ADMIN"]);
  const admissionId = String(formData.get("admissionId") ?? "");
  const bill = await generateBillFromAdmission(admissionId);
  revalidatePath("/billing");
  redirect(`/billing/bills/${bill.id}`);
}
