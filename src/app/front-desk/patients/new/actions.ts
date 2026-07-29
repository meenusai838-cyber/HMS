"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { WalkInPatientSchema } from "@/lib/validation";
import { findDuplicateCandidates, generateMrn } from "@/lib/patients";

export type WalkInState = {
  errors?: Record<string, string[]>;
  duplicates?: { id: string; name: string; mrn: string; dob: string; phone: string | null }[];
  values?: Record<string, string>;
} | undefined;

export async function createWalkInPatientAction(
  _prevState: WalkInState,
  formData: FormData
): Promise<WalkInState> {
  await requireRole(["FRONT_DESK"]);

  const raw = {
    name: String(formData.get("name") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    confirmNew: String(formData.get("confirmNew") ?? ""),
  };

  const parsed = WalkInPatientSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values: raw };
  }

  const data = parsed.data;
  const dob = new Date(data.dob);

  if (data.confirmNew !== "true") {
    const duplicates = await findDuplicateCandidates({
      name: data.name,
      dob,
      phone: data.phone || null,
    });

    if (duplicates.length > 0) {
      return {
        duplicates: duplicates.map((d) => ({
          id: d.id,
          name: d.name,
          mrn: d.mrn,
          dob: d.dob.toISOString().slice(0, 10),
          phone: d.phone,
        })),
        values: raw,
      };
    }
  }

  const mrn = await generateMrn();

  const patient = await prisma.patientProfile.create({
    data: {
      mrn,
      name: data.name,
      dob,
      gender: data.gender,
      phone: data.phone || null,
      address: data.address || null,
    },
  });

  redirect(`/front-desk/patients/${patient.id}`);
}
