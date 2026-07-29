"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { admitPatient, BedUnavailableError } from "@/lib/ward";

export type AdmitState = { error?: string } | undefined;

export async function admitPatientAction(
  _prevState: AdmitState,
  formData: FormData
): Promise<AdmitState> {
  await requireRole(["NURSE"]);

  const patientId = String(formData.get("patientId") ?? "");
  const admittingDoctorId = String(formData.get("admittingDoctorId") ?? "");
  const bedId = String(formData.get("bedId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!patientId || !admittingDoctorId || !bedId || !reason) {
    return { error: "All fields are required." };
  }

  let admissionId: string;
  try {
    const admission = await admitPatient({ patientId, admittingDoctorId, bedId, reason });
    admissionId = admission.id;
  } catch (error) {
    if (error instanceof BedUnavailableError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/nurse/admissions/${admissionId}`);
}
