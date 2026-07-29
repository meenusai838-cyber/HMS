"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { BookAppointmentSchema, WaitlistSchema } from "@/lib/validation";
import { bookAppointment, bookRecurringAppointments, joinWaitlist, SlotUnavailableError } from "@/lib/appointments";

export type BookState = { error?: string } | undefined;

async function myPatientId(userId: string) {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) throw new Error("Patient profile not found.");
  return patient.id;
}

export async function bookMySlotAction(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const session = await requireRole(["PATIENT"]);
  const patientId = await myPatientId(session.user.id);

  const raw = {
    patientId,
    doctorId: String(formData.get("doctorId") ?? ""),
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    repeatWeeks: formData.get("repeatWeeks") ? String(formData.get("repeatWeeks")) : undefined,
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = BookAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please choose a doctor, date, and time." };
  }
  const data = parsed.data;
  const durationMinutes = Number(formData.get("durationMinutes") ?? 15);
  const start = new Date(`${data.date}T${data.startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  try {
    if (data.repeatWeeks && data.repeatWeeks > 1) {
      await bookRecurringAppointments({
        patientId,
        doctorId: data.doctorId,
        firstStart: start,
        firstEnd: end,
        weeks: data.repeatWeeks,
        notes: data.notes,
      });
    } else {
      await bookAppointment({ patientId, doctorId: data.doctorId, start, end, notes: data.notes });
    }
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect("/patient/appointments?booked=true");
}

export async function joinMyWaitlistAction(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const session = await requireRole(["PATIENT"]);
  const patientId = await myPatientId(session.user.id);

  const raw = {
    patientId,
    doctorId: String(formData.get("doctorId") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Choose a doctor and preferred date." };
  }

  await joinWaitlist({
    patientId,
    doctorId: parsed.data.doctorId,
    preferredDate: new Date(parsed.data.preferredDate),
    notes: parsed.data.notes,
  });

  redirect("/patient/appointments?waitlisted=true");
}
