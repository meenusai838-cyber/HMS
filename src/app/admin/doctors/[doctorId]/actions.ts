"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  addAvailabilityBlock,
  removeAvailabilityBlock,
  AvailabilityOverlapError,
} from "@/lib/appointments";
import { AvailabilityBlockSchema } from "@/lib/validation";
import type { AddBlockState } from "@/components/availability-manager";

export async function adminAddAvailabilityBlockAction(
  doctorId: string,
  _prevState: AddBlockState,
  formData: FormData
): Promise<AddBlockState> {
  await requireRole(["ADMIN"]);
  await prisma.doctorProfile.findUniqueOrThrow({ where: { id: doctorId } });

  const parsed = AvailabilityBlockSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    await addAvailabilityBlock({ doctorId, ...parsed.data });
  } catch (error) {
    if (error instanceof AvailabilityOverlapError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/admin/doctors/${doctorId}`);
}

export async function adminRemoveAvailabilityBlockAction(doctorId: string, formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") ?? "");
  await removeAvailabilityBlock(id, doctorId);
  revalidatePath(`/admin/doctors/${doctorId}`);
}
