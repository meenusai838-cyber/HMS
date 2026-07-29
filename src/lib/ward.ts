import "server-only";
import { prisma } from "@/lib/prisma";

export class BedUnavailableError extends Error {
  constructor() {
    super("That bed is no longer available.");
    this.name = "BedUnavailableError";
  }
}

export async function getWardBoard() {
  return prisma.ward.findMany({
    include: {
      beds: {
        include: {
          assignments: {
            where: { endedAt: null },
            include: {
              admission: {
                include: { patient: true, admittingDoctor: { include: { user: true } } },
              },
            },
          },
        },
        orderBy: { bedNumber: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAvailableBeds() {
  return prisma.bed.findMany({
    where: { status: "AVAILABLE" },
    include: { ward: true },
    orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
  });
}

export async function admitPatient(input: {
  patientId: string;
  admittingDoctorId: string;
  bedId: string;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    const bed = await tx.bed.findUniqueOrThrow({ where: { id: input.bedId } });
    if (bed.status !== "AVAILABLE") {
      throw new BedUnavailableError();
    }

    const admission = await tx.admission.create({
      data: {
        patientId: input.patientId,
        admittingDoctorId: input.admittingDoctorId,
        reason: input.reason,
      },
    });

    await tx.bedAssignment.create({
      data: { admissionId: admission.id, bedId: input.bedId },
    });

    await tx.bed.update({ where: { id: input.bedId }, data: { status: "OCCUPIED" } });

    return admission;
  });
}

export async function transferPatient(input: { admissionId: string; newBedId: string }) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUniqueOrThrow({ where: { id: input.admissionId } });
    if (admission.status !== "ADMITTED") {
      throw new Error("This patient is not currently admitted.");
    }

    const currentAssignment = await tx.bedAssignment.findFirst({
      where: { admissionId: input.admissionId, endedAt: null },
    });
    if (!currentAssignment) {
      throw new Error("No active bed assignment found for this admission.");
    }
    if (currentAssignment.bedId === input.newBedId) {
      throw new Error("Patient is already in that bed.");
    }

    const newBed = await tx.bed.findUniqueOrThrow({ where: { id: input.newBedId } });
    if (newBed.status !== "AVAILABLE") {
      throw new BedUnavailableError();
    }

    const now = new Date();
    await tx.bedAssignment.update({
      where: { id: currentAssignment.id },
      data: { endedAt: now },
    });
    await tx.bed.update({ where: { id: currentAssignment.bedId }, data: { status: "AVAILABLE" } });

    await tx.bedAssignment.create({
      data: { admissionId: input.admissionId, bedId: input.newBedId, startedAt: now },
    });
    await tx.bed.update({ where: { id: input.newBedId }, data: { status: "OCCUPIED" } });

    return tx.admission.findUniqueOrThrow({ where: { id: input.admissionId } });
  });
}

export async function dischargePatient(admissionId: string) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUniqueOrThrow({ where: { id: admissionId } });
    if (admission.status !== "ADMITTED") {
      throw new Error("This patient has already been discharged.");
    }

    const currentAssignment = await tx.bedAssignment.findFirst({
      where: { admissionId, endedAt: null },
    });
    const now = new Date();

    if (currentAssignment) {
      await tx.bedAssignment.update({ where: { id: currentAssignment.id }, data: { endedAt: now } });
      await tx.bed.update({ where: { id: currentAssignment.bedId }, data: { status: "AVAILABLE" } });
    }

    return tx.admission.update({
      where: { id: admissionId },
      data: { status: "DISCHARGED", dischargedAt: now },
    });
  });
}

export async function getActiveAdmissions() {
  return prisma.admission.findMany({
    where: { status: "ADMITTED" },
    include: {
      patient: true,
      admittingDoctor: { include: { user: true } },
      assignments: {
        where: { endedAt: null },
        include: { bed: { include: { ward: true } } },
      },
    },
    orderBy: { admittedAt: "desc" },
  });
}

export async function getAdmissionDetail(admissionId: string) {
  return prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      patient: true,
      admittingDoctor: { include: { user: true } },
      assignments: {
        include: { bed: { include: { ward: true } } },
        orderBy: { startedAt: "asc" },
      },
    },
  });
}

export async function getBedOccupancyStats() {
  const beds = await prisma.bed.findMany({ select: { status: true } });
  const total = beds.length;
  const occupied = beds.filter((b) => b.status === "OCCUPIED").length;
  return {
    total,
    occupied,
    available: beds.filter((b) => b.status === "AVAILABLE").length,
    maintenance: beds.filter((b) => b.status === "MAINTENANCE").length,
    occupancyRate: total === 0 ? 0 : Math.round((occupied / total) * 100),
  };
}
