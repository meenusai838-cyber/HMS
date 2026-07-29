import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const EXPIRING_SOON_MS = 30 * 24 * 60 * 60 * 1000;

export async function receiveBatch(input: {
  medicineId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
}) {
  return prisma.medicineBatch.create({
    data: {
      medicineId: input.medicineId,
      batchNumber: input.batchNumber,
      expiryDate: input.expiryDate,
      quantityReceived: input.quantity,
      quantityRemaining: input.quantity,
    },
  });
}

export async function getStockOverview() {
  const medicines = await prisma.medicine.findMany({
    include: { batches: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();

  return medicines.map((m) => {
    const totalRemaining = m.batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
    const expiringSoon = m.batches.filter(
      (b) => b.quantityRemaining > 0 && b.expiryDate > now && b.expiryDate.getTime() - now.getTime() < EXPIRING_SOON_MS
    );
    const expired = m.batches.filter((b) => b.quantityRemaining > 0 && b.expiryDate <= now);

    return {
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      lowStockThreshold: m.lowStockThreshold,
      totalRemaining,
      isLowStock: totalRemaining < m.lowStockThreshold,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      batches: m.batches.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()),
    };
  });
}

export async function getPendingPrescriptionItems() {
  return prisma.prescriptionItem.findMany({
    where: { dispensedAt: null },
    include: {
      medicine: true,
      prescription: {
        include: {
          consultation: {
            include: {
              patient: true,
              doctor: { include: { user: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export class InsufficientStockError extends Error {
  constructor(medicineName: string, available: number, requested: number) {
    super(`Only ${available} unit(s) of ${medicineName} in stock, but ${requested} requested.`);
    this.name = "InsufficientStockError";
  }
}

async function deductStockFefo(tx: Prisma.TransactionClient, medicineId: string, quantity: number) {
  const medicine = await tx.medicine.findUniqueOrThrow({ where: { id: medicineId } });
  const batches = await tx.medicineBatch.findMany({
    where: { medicineId, quantityRemaining: { gt: 0 } },
    orderBy: { expiryDate: "asc" },
  });

  const available = batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
  if (available < quantity) {
    throw new InsufficientStockError(medicine.name, available, quantity);
  }

  let remaining = quantity;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantityRemaining, remaining);
    await tx.medicineBatch.update({
      where: { id: batch.id },
      data: { quantityRemaining: batch.quantityRemaining - take },
    });
    remaining -= take;
  }
}

export async function dispenseItem(input: { itemId: string; quantity: number }) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.prescriptionItem.findUniqueOrThrow({ where: { id: input.itemId } });
    if (item.dispensedAt) {
      throw new Error("This item has already been dispensed.");
    }

    if (item.medicineId) {
      await deductStockFefo(tx, item.medicineId, input.quantity);
    }

    return tx.prescriptionItem.update({
      where: { id: input.itemId },
      data: { quantityDispensed: input.quantity, dispensedAt: new Date() },
    });
  });
}
