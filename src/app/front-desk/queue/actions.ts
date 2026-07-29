"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import {
  checkInAppointment,
  createWalkInVisit,
  skipInQueue,
  requeueSkipped,
  startConsultation,
  completeConsultation,
} from "@/lib/queue";

export type WalkInVisitState = { error?: string } | undefined;

export async function checkInAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  await checkInAppointment(appointmentId);
  revalidatePath("/front-desk/queue");
  revalidatePath(`/front-desk/queue?doctorId=${doctorId}`);
}

export async function walkInCheckInAction(
  _prevState: WalkInVisitState,
  formData: FormData
): Promise<WalkInVisitState> {
  await requireRole(["FRONT_DESK", "ADMIN"]);
  const patientId = String(formData.get("patientId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  if (!patientId || !doctorId) {
    return { error: "Choose a patient and doctor." };
  }
  await createWalkInVisit({ patientId, doctorId });
  revalidatePath("/front-desk/queue");
}

export async function skipAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await skipInQueue(appointmentId);
  revalidatePath("/front-desk/queue");
}

export async function requeueAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await requeueSkipped(appointmentId);
  revalidatePath("/front-desk/queue");
}

export async function startAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN", "DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await startConsultation(appointmentId);
  revalidatePath("/front-desk/queue");
  revalidatePath("/doctor");
}

export async function completeAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN", "DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await completeConsultation(appointmentId);
  revalidatePath("/front-desk/queue");
  revalidatePath("/doctor");
}
