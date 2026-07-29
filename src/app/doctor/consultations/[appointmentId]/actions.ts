"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  saveConsultationNotes,
  addPrescriptionItem,
  removePrescriptionItem,
  type PrescriptionWarnings,
} from "@/lib/consultations";
import { completeConsultation } from "@/lib/queue";
import { orderLabTest } from "@/lib/lab";

async function assertOwnsAppointment(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { doctor: true },
  });
  if (appointment.doctor.userId !== userId) {
    throw new Error("Not authorized for this appointment.");
  }
  return appointment;
}

export async function saveNotesAction(formData: FormData) {
  const session = await requireRole(["DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const consultationId = String(formData.get("consultationId") ?? "");
  await assertOwnsAppointment(appointmentId, session.user.id);

  await saveConsultationNotes(consultationId, {
    symptoms: String(formData.get("symptoms") ?? ""),
    diagnosis: String(formData.get("diagnosis") ?? ""),
    treatmentNotes: String(formData.get("treatmentNotes") ?? ""),
  });

  revalidatePath(`/doctor/consultations/${appointmentId}`);
}

export type AddItemState = { warnings?: PrescriptionWarnings; error?: string } | undefined;

export async function addPrescriptionItemAction(
  _prevState: AddItemState,
  formData: FormData
): Promise<AddItemState> {
  const session = await requireRole(["DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const appointment = await assertOwnsAppointment(appointmentId, session.user.id);

  const consultationId = String(formData.get("consultationId") ?? "");
  const medicineId = String(formData.get("medicineId") ?? "") || undefined;
  const medicineName = String(formData.get("medicineName") ?? "");
  const dosage = String(formData.get("dosage") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const durationDaysRaw = String(formData.get("durationDays") ?? "");
  const instructions = String(formData.get("instructions") ?? "");

  if (!medicineName || !dosage || !frequency) {
    return { error: "Medicine, dosage, and frequency are required." };
  }

  const { warnings } = await addPrescriptionItem({
    consultationId,
    patientId: appointment.patientId,
    medicineId,
    medicineName,
    dosage,
    frequency,
    durationDays: durationDaysRaw ? Number(durationDaysRaw) : undefined,
    instructions: instructions || undefined,
  });

  revalidatePath(`/doctor/consultations/${appointmentId}`);
  return { warnings };
}

export async function removePrescriptionItemAction(formData: FormData) {
  const session = await requireRole(["DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await assertOwnsAppointment(appointmentId, session.user.id);

  const itemId = String(formData.get("itemId") ?? "");
  await removePrescriptionItem(itemId);
  revalidatePath(`/doctor/consultations/${appointmentId}`);
}

export async function orderLabTestAction(formData: FormData) {
  const session = await requireRole(["DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const appointment = await assertOwnsAppointment(appointmentId, session.user.id);

  const consultationId = String(formData.get("consultationId") ?? "");
  const testId = String(formData.get("testId") ?? "") || undefined;
  const testName = String(formData.get("testName") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!testName) return;

  await orderLabTest({
    consultationId,
    patientId: appointment.patientId,
    testId,
    testName,
    notes: notes || undefined,
  });

  revalidatePath(`/doctor/consultations/${appointmentId}`);
}

export async function completeConsultationAction(formData: FormData) {
  const session = await requireRole(["DOCTOR"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  await assertOwnsAppointment(appointmentId, session.user.id);

  await completeConsultation(appointmentId);
  revalidatePath("/doctor");
  redirect("/doctor");
}
