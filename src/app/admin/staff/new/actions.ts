"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { StaffCreateSchema } from "@/lib/validation";

export type StaffCreateState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createStaffAction(
  _prevState: StaffCreateState,
  formData: FormData
): Promise<StaffCreateState> {
  await requireRole(["ADMIN"]);

  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
    specialty: String(formData.get("specialty") ?? ""),
    department: String(formData.get("department") ?? ""),
  };

  const parsed = StaffCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  if (data.role === "DOCTOR" && !data.specialty) {
    return { errors: { specialty: ["Specialty is required for doctors."] } };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      name: data.name,
      doctorProfile:
        data.role === "DOCTOR"
          ? {
              create: {
                specialty: data.specialty!,
                department: data.department || null,
              },
            }
          : undefined,
    },
  });

  redirect("/admin?staffCreated=true");
}
