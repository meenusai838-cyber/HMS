import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const ACTIVE_STATUSES = ["SCHEDULED", "IN_PROGRESS"] as const;

export class TheatreUnavailableError extends Error {
  constructor() {
    super("The theatre is already booked for that time.");
    this.name = "TheatreUnavailableError";
  }
}

async function assertNoOverlap(
  tx: Prisma.TransactionClient,
  theatreId: string,
  start: Date,
  end: Date,
  excludeSurgeryId?: string
) {
  const conflict = await tx.surgery.findFirst({
    where: {
      theatreId,
      status: { in: [...ACTIVE_STATUSES] },
      scheduledStart: { lt: end },
      scheduledEnd: { gt: start },
      ...(excludeSurgeryId ? { id: { not: excludeSurgeryId } } : {}),
    },
  });
  if (conflict) throw new TheatreUnavailableError();
}

export async function scheduleSurgery(input: {
  theatreId: string;
  patientId: string;
  surgeonId: string;
  procedureName: string;
  start: Date;
  end: Date;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    await assertNoOverlap(tx, input.theatreId, input.start, input.end);
    return tx.surgery.create({
      data: {
        theatreId: input.theatreId,
        patientId: input.patientId,
        surgeonId: input.surgeonId,
        procedureName: input.procedureName,
        scheduledStart: input.start,
        scheduledEnd: input.end,
        notes: input.notes,
      },
    });
  });
}

export async function startSurgery(id: string) {
  return prisma.surgery.update({ where: { id }, data: { status: "IN_PROGRESS" } });
}

export async function completeSurgery(id: string) {
  return prisma.surgery.update({ where: { id }, data: { status: "COMPLETED" } });
}

export async function cancelSurgery(id: string) {
  return prisma.surgery.update({ where: { id }, data: { status: "CANCELLED" } });
}

export async function getUpcomingSurgeries() {
  return prisma.surgery.findMany({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    include: {
      theatre: true,
      patient: true,
      surgeon: { include: { user: true } },
    },
    orderBy: { scheduledStart: "asc" },
  });
}
