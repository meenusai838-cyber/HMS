"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { cancelAppointment } from "@/lib/appointments";

export async function cancelMyAppointmentAction(formData: FormData) {
  const session = await requireRole(["PATIENT"]);
  const appointmentId = String(formData.get("appointmentId") ?? "");

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true },
  });

  if (!appointment || appointment.patient.userId !== session.user.id) {
    throw new Error("Not authorized to cancel this appointment.");
  }

  await cancelAppointment(appointmentId);
  revalidatePath("/patient/appointments");
}
