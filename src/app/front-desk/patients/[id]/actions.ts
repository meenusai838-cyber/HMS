"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AllergySchema } from "@/lib/validation";
import { cancelAppointment, cancelRecurringSeries } from "@/lib/appointments";

export type AddAllergyState = { errors?: Record<string, string[]> } | undefined;

export async function addAllergyAction(
  _prevState: AddAllergyState,
  formData: FormData
): Promise<AddAllergyState> {
  await requireRole(["FRONT_DESK", "ADMIN"]);

  const raw = {
    patientId: String(formData.get("patientId") ?? ""),
    substance: String(formData.get("substance") ?? ""),
    severity: String(formData.get("severity") ?? "MODERATE"),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = AllergySchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.allergy.create({
    data: {
      patientId: parsed.data.patientId,
      substance: parsed.data.substance,
      severity: parsed.data.severity,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/front-desk/patients/${parsed.data.patientId}`);
}

export async function cancelAppointmentAction(formData: FormData) {
  await requireRole(["FRONT_DESK", "ADMIN"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const patientId = String(formData.get("patientId") ?? "");
  const recurrenceGroupId = String(formData.get("recurrenceGroupId") ?? "");
  const cancelSeries = formData.get("cancelSeries") === "true";

  if (cancelSeries && recurrenceGroupId) {
    await cancelRecurringSeries(recurrenceGroupId);
  } else {
    await cancelAppointment(appointmentId);
  }

  revalidatePath(`/front-desk/patients/${patientId}`);
}
