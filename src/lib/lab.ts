import "server-only";
import { prisma } from "@/lib/prisma";

const PENDING_STATUSES = ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] as const;

export async function orderLabTest(input: {
  consultationId: string;
  patientId: string;
  testId?: string;
  testName: string;
  notes?: string;
}) {
  return prisma.labOrder.create({
    data: {
      consultationId: input.consultationId,
      patientId: input.patientId,
      testId: input.testId,
      testName: input.testName,
      notes: input.notes,
    },
  });
}

export async function collectSample(labOrderId: string) {
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "SAMPLE_COLLECTED", sampleCollectedAt: new Date() },
  });
}

export async function startProcessing(labOrderId: string) {
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "IN_PROGRESS" },
  });
}

export async function completeLabOrder(input: {
  labOrderId: string;
  resultSummary: string;
  reportFileName?: string;
  reportStoredName?: string;
}) {
  return prisma.labOrder.update({
    where: { id: input.labOrderId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      resultSummary: input.resultSummary,
      reportFileName: input.reportFileName,
      reportStoredName: input.reportStoredName,
    },
  });
}

export async function cancelLabOrder(labOrderId: string) {
  return prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "CANCELLED" },
  });
}

export async function getPendingLabOrders() {
  return prisma.labOrder.findMany({
    where: { status: { in: [...PENDING_STATUSES] } },
    include: {
      patient: true,
      consultation: { include: { doctor: { include: { user: true } } } },
    },
    orderBy: { orderedAt: "asc" },
  });
}

export async function getLabOrdersForConsultation(consultationId: string) {
  return prisma.labOrder.findMany({
    where: { consultationId },
    orderBy: { orderedAt: "desc" },
  });
}
