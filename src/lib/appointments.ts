import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const ACTIVE_STATUSES = ["SCHEDULED", "COMPLETED"] as const;

export type Slot = {
  start: Date;
  end: Date;
  available: boolean;
};

function parseTimeOnDate(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Generates the day's slot grid for a doctor from their weekly availability template, minus already-booked slots. */
export async function getSlotsForDoctorOnDate(doctorId: string, date: Date): Promise<Slot[]> {
  const dayOfWeek = date.getDay();

  const [templates, existing] = await Promise.all([
    prisma.doctorAvailability.findMany({ where: { doctorId, dayOfWeek } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: [...ACTIVE_STATUSES] },
        scheduledStart: { gte: startOfDay(date), lt: endOfDay(date) },
      },
      select: { scheduledStart: true, scheduledEnd: true },
    }),
  ]);

  const slots: Slot[] = [];

  for (const template of templates) {
    const windowStart = parseTimeOnDate(date, template.startTime);
    const windowEnd = parseTimeOnDate(date, template.endTime);
    let cursor = windowStart;

    while (cursor.getTime() + template.slotMinutes * 60_000 <= windowEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + template.slotMinutes * 60_000);

      const overlaps = existing.some(
        (a) => a.scheduledStart < slotEnd && a.scheduledEnd > slotStart
      );

      slots.push({ start: slotStart, end: slotEnd, available: !overlaps });
      cursor = slotEnd;
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("That slot is no longer available.");
    this.name = "SlotUnavailableError";
  }
}

async function assertNoOverlap(
  tx: Prisma.TransactionClient,
  doctorId: string,
  start: Date,
  end: Date
) {
  const conflict = await tx.appointment.findFirst({
    where: {
      doctorId,
      status: { in: [...ACTIVE_STATUSES] },
      scheduledStart: { lt: end },
      scheduledEnd: { gt: start },
    },
  });
  if (conflict) throw new SlotUnavailableError();
}

export async function bookAppointment(input: {
  patientId: string;
  doctorId: string;
  start: Date;
  end: Date;
  isEmergency?: boolean;
  notes?: string;
  recurrenceGroupId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    if (!input.isEmergency) {
      await assertNoOverlap(tx, input.doctorId, input.start, input.end);
    }
    return tx.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledStart: input.start,
        scheduledEnd: input.end,
        isEmergency: input.isEmergency ?? false,
        notes: input.notes,
        recurrenceGroupId: input.recurrenceGroupId,
        status: "SCHEDULED",
      },
    });
  });
}

/** Books a weekly-repeating series. Each occurrence is checked independently; if one slot
 *  is taken the whole series is rolled back so the caller can retry with a different time. */
export async function bookRecurringAppointments(input: {
  patientId: string;
  doctorId: string;
  firstStart: Date;
  firstEnd: Date;
  weeks: number;
  notes?: string;
}) {
  const recurrenceGroupId = crypto.randomUUID();

  return prisma.$transaction(async (tx) => {
    const created = [];
    for (let i = 0; i < input.weeks; i++) {
      const start = new Date(input.firstStart.getTime() + i * 7 * 24 * 60 * 60_000);
      const end = new Date(input.firstEnd.getTime() + i * 7 * 24 * 60 * 60_000);
      await assertNoOverlap(tx, input.doctorId, start, end);
      const appt = await tx.appointment.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          scheduledStart: start,
          scheduledEnd: end,
          notes: input.notes,
          recurrenceGroupId,
          status: "SCHEDULED",
        },
      });
      created.push(appt);
    }
    return created;
  });
}

export async function cancelAppointment(appointmentId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });
}

export async function cancelRecurringSeries(recurrenceGroupId: string) {
  return prisma.appointment.updateMany({
    where: { recurrenceGroupId, status: { in: [...ACTIVE_STATUSES] } },
    data: { status: "CANCELLED" },
  });
}

export async function joinWaitlist(input: {
  patientId: string;
  doctorId: string;
  preferredDate: Date;
  notes?: string;
}) {
  return prisma.appointment.create({
    data: {
      patientId: input.patientId,
      doctorId: input.doctorId,
      scheduledStart: input.preferredDate,
      scheduledEnd: input.preferredDate,
      status: "WAITLISTED",
      notes: input.notes,
    },
  });
}

/** Front-desk action: promote a waitlisted patient into a specific open slot. */
export async function offerSlotToWaitlisted(waitlistId: string, start: Date, end: Date) {
  return prisma.$transaction(async (tx) => {
    await assertNoOverlap(tx, (await tx.appointment.findUniqueOrThrow({ where: { id: waitlistId } })).doctorId, start, end);
    return tx.appointment.update({
      where: { id: waitlistId },
      data: { status: "SCHEDULED", scheduledStart: start, scheduledEnd: end },
    });
  });
}
