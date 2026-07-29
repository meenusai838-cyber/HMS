import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const ACTIVE_STATUSES = ["SCHEDULED", "COMPLETED"] as const;
const DEFAULT_SLOT_MINUTES = 15;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function nextTokenNumber(tx: Prisma.TransactionClient, doctorId: string, day: Date) {
  const last = await tx.appointment.findFirst({
    where: {
      doctorId,
      checkedInAt: { gte: startOfDay(day), lte: endOfDay(day) },
    },
    orderBy: { tokenNumber: "desc" },
    select: { tokenNumber: true },
  });
  return (last?.tokenNumber ?? 0) + 1;
}

export async function checkInAppointment(appointmentId: string) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be checked in.");
    }
    const now = new Date();
    const token = await nextTokenNumber(tx, appointment.doctorId, now);
    return tx.appointment.update({
      where: { id: appointmentId },
      data: { checkedInAt: now, tokenNumber: token, queueStatus: "WAITING" },
    });
  });
}

export async function createWalkInVisit(input: { patientId: string; doctorId: string; notes?: string }) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const token = await nextTokenNumber(tx, input.doctorId, now);
    return tx.appointment.create({
      data: {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledStart: now,
        scheduledEnd: new Date(now.getTime() + DEFAULT_SLOT_MINUTES * 60_000),
        status: "SCHEDULED",
        isWalkIn: true,
        checkedInAt: now,
        tokenNumber: token,
        queueStatus: "WAITING",
        notes: input.notes,
      },
    });
  });
}

export async function startConsultation(appointmentId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { queueStatus: "IN_PROGRESS" },
  });
}

export async function completeConsultation(appointmentId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { queueStatus: "DONE", status: "COMPLETED" },
  });
}

export async function skipInQueue(appointmentId: string) {
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { queueStatus: "SKIPPED" },
  });
}

/** Late arrival: puts the patient back into the waiting line with a fresh token at the back. */
export async function requeueSkipped(appointmentId: string) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
    const now = new Date();
    const token = await nextTokenNumber(tx, appointment.doctorId, now);
    return tx.appointment.update({
      where: { id: appointmentId },
      data: { queueStatus: "WAITING", tokenNumber: token, checkedInAt: now },
    });
  });
}

export async function getDoctorQueueToday(doctorId: string) {
  const now = new Date();

  const [checkedIn, notCheckedIn] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: [...ACTIVE_STATUSES] },
        checkedInAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      include: { patient: true },
      orderBy: [{ isEmergency: "desc" }, { tokenNumber: "asc" }],
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: "SCHEDULED",
        checkedInAt: null,
        scheduledStart: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      include: { patient: true },
      orderBy: { scheduledStart: "asc" },
    }),
  ]);

  return {
    waiting: checkedIn.filter((a) => a.queueStatus === "WAITING"),
    inProgress: checkedIn.filter((a) => a.queueStatus === "IN_PROGRESS"),
    done: checkedIn.filter((a) => a.queueStatus === "DONE"),
    skipped: checkedIn.filter((a) => a.queueStatus === "SKIPPED"),
    notCheckedIn,
  };
}

export async function getQueuePositionForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  if (appointment.queueStatus !== "WAITING" || appointment.tokenNumber === null) {
    return null;
  }

  const now = new Date();
  const [aheadCount, inProgressCount, template] = await Promise.all([
    prisma.appointment.count({
      where: {
        doctorId: appointment.doctorId,
        queueStatus: "WAITING",
        checkedInAt: { gte: startOfDay(now), lte: endOfDay(now) },
        OR: [
          { isEmergency: true, NOT: { id: appointment.id } },
          appointment.isEmergency
            ? { tokenNumber: { lt: appointment.tokenNumber } }
            : { isEmergency: false, tokenNumber: { lt: appointment.tokenNumber } },
        ],
      },
    }),
    prisma.appointment.count({
      where: { doctorId: appointment.doctorId, queueStatus: "IN_PROGRESS" },
    }),
    prisma.doctorAvailability.findFirst({ where: { doctorId: appointment.doctorId } }),
  ]);

  const position = aheadCount + inProgressCount + 1;
  const slotMinutes = template?.slotMinutes ?? DEFAULT_SLOT_MINUTES;
  const estimatedWaitMinutes = (aheadCount + inProgressCount) * slotMinutes;

  return { position, estimatedWaitMinutes, tokenNumber: appointment.tokenNumber };
}
