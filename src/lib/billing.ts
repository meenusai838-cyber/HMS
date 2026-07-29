import "server-only";
import { prisma } from "@/lib/prisma";
import type { BillItemCategory, ClaimStatus, PaymentMethod } from "@prisma/client";

export class BillClosedError extends Error {
  constructor() {
    super("This bill is no longer open.");
    this.name = "BillClosedError";
  }
}

export class ClaimExistsError extends Error {
  constructor() {
    super("An insurance claim has already been filed for this bill.");
    this.name = "ClaimExistsError";
  }
}

export class OverpaymentError extends Error {
  constructor() {
    super("Payment amount exceeds the outstanding balance.");
    this.name = "OverpaymentError";
  }
}

export function getBillTotals(bill: {
  items: { amount: number }[];
  payments: { amount: number }[];
}) {
  const total = bill.items.reduce((sum, i) => sum + i.amount, 0);
  const paid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
  return { total, paid, balance: total - paid };
}

export async function getUnbilledConsultations() {
  return prisma.consultation.findMany({
    where: { billedAt: null, appointment: { status: "COMPLETED" } },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      labOrders: true,
      prescription: { include: { items: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUnbilledAdmissions() {
  return prisma.admission.findMany({
    where: { billedAt: null, status: "DISCHARGED" },
    include: {
      patient: true,
      assignments: { include: { bed: { include: { ward: true } } } },
    },
    orderBy: { dischargedAt: "asc" },
  });
}

function nightsBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export async function generateBillFromConsultation(consultationId: string) {
  return prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.findUniqueOrThrow({
      where: { id: consultationId },
      include: {
        doctor: { include: { user: true } },
        labOrders: { where: { status: "COMPLETED" }, include: { test: true } },
        prescription: {
          include: { items: { where: { dispensedAt: { not: null } }, include: { medicine: true } } },
        },
      },
    });

    if (consultation.billedAt) {
      throw new Error("This consultation has already been billed.");
    }

    const items: {
      category: BillItemCategory;
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[] = [
      {
        category: "CONSULTATION",
        description: `Consultation — Dr. ${consultation.doctor.user.name}`,
        quantity: 1,
        unitPrice: consultation.doctor.consultationFee,
        amount: consultation.doctor.consultationFee,
      },
    ];

    for (const order of consultation.labOrders) {
      const unitPrice = order.test?.price ?? 0;
      items.push({
        category: "LAB_TEST",
        description: order.testName,
        quantity: 1,
        unitPrice,
        amount: unitPrice,
      });
    }

    for (const item of consultation.prescription?.items ?? []) {
      const unitPrice = item.medicine?.unitPrice ?? 0;
      const quantity = item.quantityDispensed ?? 0;
      items.push({
        category: "MEDICINE",
        description: item.medicineName,
        quantity,
        unitPrice,
        amount: unitPrice * quantity,
      });
    }

    const bill = await tx.bill.create({
      data: {
        patientId: consultation.patientId,
        consultationId: consultation.id,
        items: { create: items },
      },
    });

    await tx.consultation.update({ where: { id: consultation.id }, data: { billedAt: new Date() } });

    return bill;
  });
}

export async function generateBillFromAdmission(admissionId: string) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUniqueOrThrow({
      where: { id: admissionId },
      include: { assignments: { include: { bed: { include: { ward: true } } } } },
    });

    if (admission.billedAt) {
      throw new Error("This admission has already been billed.");
    }

    const items = admission.assignments.map((assignment) => {
      const end = assignment.endedAt ?? admission.dischargedAt ?? new Date();
      const nights = nightsBetween(assignment.startedAt, end);
      const unitPrice = assignment.bed.ward.dailyRate;
      return {
        category: "ROOM" as BillItemCategory,
        description: `${assignment.bed.ward.name} — Bed ${assignment.bed.bedNumber} (${nights} night${nights === 1 ? "" : "s"})`,
        quantity: nights,
        unitPrice,
        amount: unitPrice * nights,
      };
    });

    const bill = await tx.bill.create({
      data: {
        patientId: admission.patientId,
        admissionId: admission.id,
        items: { create: items },
      },
    });

    await tx.admission.update({ where: { id: admission.id }, data: { billedAt: new Date() } });

    return bill;
  });
}

export async function getOpenBills() {
  const bills = await prisma.bill.findMany({
    where: { status: "OPEN" },
    include: { patient: true, items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return bills.map((bill) => ({ ...bill, ...getBillTotals(bill) }));
}

export async function getBillDetail(billId: string) {
  return prisma.bill.findUnique({
    where: { id: billId },
    include: {
      patient: true,
      items: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
      insuranceClaim: true,
      consultation: { include: { doctor: { include: { user: true } } } },
      admission: true,
    },
  });
}

export async function addBillItem(input: {
  billId: string;
  category: BillItemCategory;
  description: string;
  quantity: number;
  unitPrice: number;
}) {
  const bill = await prisma.bill.findUniqueOrThrow({ where: { id: input.billId } });
  if (bill.status !== "OPEN") throw new BillClosedError();

  return prisma.billItem.create({
    data: {
      billId: input.billId,
      category: input.category,
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      amount: input.quantity * input.unitPrice,
    },
  });
}

export async function removeBillItem(itemId: string) {
  const item = await prisma.billItem.findUniqueOrThrow({ where: { id: itemId }, include: { bill: true } });
  if (item.bill.status !== "OPEN") throw new BillClosedError();
  return prisma.billItem.delete({ where: { id: itemId } });
}

export async function recordPayment(input: {
  billId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUniqueOrThrow({
      where: { id: input.billId },
      include: { items: true, payments: true },
    });
    if (bill.status !== "OPEN") throw new BillClosedError();

    const { total, paid } = getBillTotals(bill);
    if (input.amount > total - paid + 0.001) throw new OverpaymentError();

    const payment = await tx.payment.create({
      data: {
        billId: input.billId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
      },
    });

    if (paid + input.amount >= total - 0.001) {
      await tx.bill.update({ where: { id: input.billId }, data: { status: "PAID" } });
    }

    return payment;
  });
}

export async function fileInsuranceClaim(input: {
  billId: string;
  insurerName: string;
  policyNumber: string;
  claimedAmount: number;
}) {
  const existing = await prisma.insuranceClaim.findUnique({ where: { billId: input.billId } });
  if (existing) throw new ClaimExistsError();

  return prisma.insuranceClaim.create({
    data: {
      billId: input.billId,
      insurerName: input.insurerName,
      policyNumber: input.policyNumber,
      claimedAmount: input.claimedAmount,
    },
  });
}

export async function updateClaimStatus(input: {
  claimId: string;
  status: ClaimStatus;
  approvedAmount?: number;
  notes?: string;
}) {
  return prisma.insuranceClaim.update({
    where: { id: input.claimId },
    data: {
      status: input.status,
      approvedAmount: input.approvedAmount,
      notes: input.notes,
      resolvedAt: input.status === "SUBMITTED" ? null : new Date(),
    },
  });
}
