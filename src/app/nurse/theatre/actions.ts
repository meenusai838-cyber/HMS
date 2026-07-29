"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import {
  scheduleSurgery,
  startSurgery,
  completeSurgery,
  cancelSurgery,
  TheatreUnavailableError,
} from "@/lib/theatre";

export type ScheduleState = { error?: string } | undefined;

export async function scheduleSurgeryAction(
  _prevState: ScheduleState,
  formData: FormData
): Promise<ScheduleState> {
  await requireRole(["NURSE"]);

  const theatreId = String(formData.get("theatreId") ?? "");
  const patientId = String(formData.get("patientId") ?? "");
  const surgeonId = String(formData.get("surgeonId") ?? "");
  const procedureName = String(formData.get("procedureName") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const notes = String(formData.get("notes") ?? "");

  if (!theatreId || !patientId || !surgeonId || !procedureName || !date || !startTime) {
    return { error: "All fields except notes are required." };
  }

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  try {
    await scheduleSurgery({ theatreId, patientId, surgeonId, procedureName, start, end, notes: notes || undefined });
  } catch (error) {
    if (error instanceof TheatreUnavailableError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/nurse/theatre");
}

export async function startSurgeryAction(formData: FormData) {
  await requireRole(["NURSE"]);
  await startSurgery(String(formData.get("surgeryId") ?? ""));
  revalidatePath("/nurse/theatre");
}

export async function completeSurgeryAction(formData: FormData) {
  await requireRole(["NURSE"]);
  await completeSurgery(String(formData.get("surgeryId") ?? ""));
  revalidatePath("/nurse/theatre");
}

export async function cancelSurgeryAction(formData: FormData) {
  await requireRole(["NURSE"]);
  await cancelSurgery(String(formData.get("surgeryId") ?? ""));
  revalidatePath("/nurse/theatre");
}
