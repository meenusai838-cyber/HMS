import "server-only";
import { prisma } from "@/lib/prisma";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

/**
 * A new profile is a likely duplicate if an existing (non-merged) profile shares
 * the same date of birth AND (a similar name OR the same phone number).
 */
export async function findDuplicateCandidates(input: {
  name: string;
  dob: Date;
  phone?: string | null;
}) {
  const normalized = normalizeName(input.name);

  const sameDob = await prisma.patientProfile.findMany({
    where: {
      dob: input.dob,
      mergedIntoId: null,
    },
    include: { allergies: true },
  });

  return sameDob.filter((candidate) => {
    if (!sameDay(candidate.dob, input.dob)) return false;
    const nameMatch = normalizeName(candidate.name) === normalized;
    const phoneMatch = Boolean(input.phone) && candidate.phone === input.phone;
    return nameMatch || phoneMatch;
  });
}

export async function generateMrn(): Promise<string> {
  const count = await prisma.patientProfile.count();
  const year = new Date().getFullYear();
  return `MRN-${year}-${String(count + 1).padStart(5, "0")}`;
}

export async function mergePatients(survivorId: string, duplicateId: string) {
  if (survivorId === duplicateId) {
    throw new Error("Cannot merge a patient profile into itself");
  }

  await prisma.$transaction(async (tx) => {
    const [survivor, duplicate] = await Promise.all([
      tx.patientProfile.findUniqueOrThrow({ where: { id: survivorId } }),
      tx.patientProfile.findUniqueOrThrow({ where: { id: duplicateId } }),
    ]);

    if (survivor.mergedIntoId) {
      throw new Error("Survivor profile has itself been merged elsewhere");
    }
    if (duplicate.mergedIntoId) {
      throw new Error("Duplicate profile has already been merged");
    }

    await tx.appointment.updateMany({
      where: { patientId: duplicateId },
      data: { patientId: survivorId },
    });

    await tx.allergy.updateMany({
      where: { patientId: duplicateId },
      data: { patientId: survivorId },
    });

    await tx.patientProfile.update({
      where: { id: duplicateId },
      data: { mergedIntoId: survivorId },
    });
  });
}

/** Follows the merge chain so callers always land on the current survivor. */
export async function resolvePatientId(id: string): Promise<string> {
  let current = await prisma.patientProfile.findUniqueOrThrow({
    where: { id },
    select: { id: true, mergedIntoId: true },
  });
  const seen = new Set<string>([current.id]);
  while (current.mergedIntoId) {
    if (seen.has(current.mergedIntoId)) break; // guard against cycles
    current = await prisma.patientProfile.findUniqueOrThrow({
      where: { id: current.mergedIntoId },
      select: { id: true, mergedIntoId: true },
    });
    seen.add(current.id);
  }
  return current.id;
}
