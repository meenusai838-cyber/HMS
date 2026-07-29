import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOrCreateConsultation(appointmentId: string) {
  const existing = await prisma.consultation.findUnique({ where: { appointmentId } });
  if (existing) return existing;

  const appointment = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
  return prisma.consultation.create({
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
    },
  });
}

export async function saveConsultationNotes(
  consultationId: string,
  data: { symptoms?: string; diagnosis?: string; treatmentNotes?: string }
) {
  return prisma.consultation.update({
    where: { id: consultationId },
    data,
  });
}

async function getOrCreatePrescription(consultationId: string) {
  const existing = await prisma.prescription.findUnique({ where: { consultationId } });
  if (existing) return existing;
  return prisma.prescription.create({ data: { consultationId } });
}

export type PrescriptionWarnings = {
  allergy: string[];
  interaction: string[];
};

async function computeWarnings(input: {
  patientId: string;
  prescriptionId: string;
  medicineId?: string;
  medicineName: string;
}): Promise<PrescriptionWarnings> {
  const [allergies, medicine, existingItems] = await Promise.all([
    prisma.allergy.findMany({ where: { patientId: input.patientId } }),
    input.medicineId ? prisma.medicine.findUnique({ where: { id: input.medicineId } }) : null,
    prisma.prescriptionItem.findMany({
      where: { prescriptionId: input.prescriptionId, medicineId: { not: null } },
      select: { medicineId: true },
    }),
  ]);

  const nameHaystack = [input.medicineName, medicine?.name, medicine?.genericName]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());

  const allergyWarnings = allergies
    .filter((allergy) => {
      const substance = allergy.substance.toLowerCase();
      return nameHaystack.some((n) => n.includes(substance) || substance.includes(n));
    })
    .map((a) => `Patient has a recorded ${a.severity.toLowerCase()} allergy to ${a.substance}.`);

  let interactionWarnings: string[] = [];
  if (input.medicineId) {
    const existingIds = existingItems
      .map((i) => i.medicineId)
      .filter((id): id is string => Boolean(id) && id !== input.medicineId);

    if (existingIds.length > 0) {
      const interactions = await prisma.drugInteraction.findMany({
        where: {
          OR: [
            { medicineAId: input.medicineId, medicineBId: { in: existingIds } },
            { medicineBId: input.medicineId, medicineAId: { in: existingIds } },
          ],
        },
        include: { medicineA: true, medicineB: true },
      });
      interactionWarnings = interactions.map(
        (i) =>
          `${i.severity} interaction between ${i.medicineA.name} and ${i.medicineB.name}: ${i.description}`
      );
    }
  }

  return { allergy: allergyWarnings, interaction: interactionWarnings };
}

export async function addPrescriptionItem(input: {
  consultationId: string;
  patientId: string;
  medicineId?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  instructions?: string;
}) {
  const prescription = await getOrCreatePrescription(input.consultationId);

  const warnings = await computeWarnings({
    patientId: input.patientId,
    prescriptionId: prescription.id,
    medicineId: input.medicineId,
    medicineName: input.medicineName,
  });

  const item = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescription.id,
      medicineId: input.medicineId,
      medicineName: input.medicineName,
      dosage: input.dosage,
      frequency: input.frequency,
      durationDays: input.durationDays,
      instructions: input.instructions,
    },
  });

  return { item, warnings };
}

export async function removePrescriptionItem(itemId: string) {
  return prisma.prescriptionItem.delete({ where: { id: itemId } });
}

export async function getPatientVisitHistory(patientId: string, opts?: { doctorId?: string }) {
  return prisma.consultation.findMany({
    where: { patientId, ...(opts?.doctorId ? { doctorId: opts.doctorId } : {}) },
    include: {
      appointment: { include: { doctor: { include: { user: true } } } },
      prescription: { include: { items: true } },
      labOrders: { orderBy: { orderedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}
