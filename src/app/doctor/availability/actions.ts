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

async function getOwnDoctorProfile(userId: string) {
  return prisma.doctorProfile.findUniqueOrThrow({ where: { userId } });
}

export async function addAvailabilityBlockAction(
  _prevState: AddBlockState,
  formData: FormData
): Promise<AddBlockState> {
  const session = await requireRole(["DOCTOR"]);

  const parsed = AvailabilityBlockSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotMinutes: formData.get("slotMinutes"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const doctorProfile = await getOwnDoctorProfile(session.user.id);

  try {
    await addAvailabilityBlock({ doctorId: doctorProfile.id, ...parsed.data });
  } catch (error) {
    if (error instanceof AvailabilityOverlapError) return { error: error.message };
    throw error;
  }

  revalidatePath("/doctor/availability");
}

export async function removeAvailabilityBlockAction(formData: FormData) {
  const session = await requireRole(["DOCTOR"]);
  const doctorProfile = await getOwnDoctorProfile(session.user.id);

  const id = String(formData.get("id") ?? "");
  await removeAvailabilityBlock(id, doctorProfile.id);
  revalidatePath("/doctor/availability");
}
