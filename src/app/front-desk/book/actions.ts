"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { BookAppointmentSchema, WaitlistSchema } from "@/lib/validation";
import {
  bookAppointment,
  bookRecurringAppointments,
  joinWaitlist,
  offerSlotToWaitlisted,
  SlotUnavailableError,
} from "@/lib/appointments";

export type BookState = { error?: string } | undefined;

export async function bookSlotAction(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  await requireRole(["FRONT_DESK", "ADMIN"]);

  const raw = {
    patientId: String(formData.get("patientId") ?? ""),
    doctorId: String(formData.get("doctorId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    isEmergency: String(formData.get("isEmergency") ?? ""),
    repeatWeeks: formData.get("repeatWeeks") ? String(formData.get("repeatWeeks")) : undefined,
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = BookAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please choose a patient, doctor, date, and time." };
  }
  const data = parsed.data;
  const durationMinutes = Number(formData.get("durationMinutes") ?? 15);
  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const waitlistId = String(formData.get("waitlistId") ?? "");

  try {
    if (waitlistId) {
      await offerSlotToWaitlisted(waitlistId, start, end);
    } else if (data.repeatWeeks && data.repeatWeeks > 1) {
      await bookRecurringAppointments({
        patientId: data.patientId,
        doctorId: data.doctorId,
        firstStart: start,
        firstEnd: end,
        weeks: data.repeatWeeks,
        notes: data.notes,
      });
    } else {
      await bookAppointment({
        patientId: data.patientId,
        doctorId: data.doctorId,
        start,
        end,
        isEmergency: data.isEmergency === "true",
        notes: data.notes,
      });
    }
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect(`/front-desk/patients/${data.patientId}?booked=true`);
}

export async function bookEmergencyNowAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN"]);

  const patientId = String(formData.get("patientId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  if (!patientId || !doctorId) return;

  const start = new Date();
  const end = new Date(start.getTime() + 15 * 60_000);

  await bookAppointment({
    patientId,
    doctorId,
    start,
    end,
    isEmergency: true,
    notes: "Walk-in emergency",
  });

  redirect(`/front-desk/patients/${patientId}?booked=true`);
}

export async function joinWaitlistAction(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  await requireRole(["FRONT_DESK", "ADMIN"]);

  const raw = {
    patientId: String(formData.get("patientId") ?? ""),
    doctorId: String(formData.get("doctorId") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Choose a doctor and preferred date." };
  }

  await joinWaitlist({
    patientId: parsed.data.patientId,
    doctorId: parsed.data.doctorId,
    preferredDate: new Date(parsed.data.preferredDate),
    notes: parsed.data.notes,
  });

  redirect(`/front-desk/patients/${parsed.data.patientId}?waitlisted=true`);
}
