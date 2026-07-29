"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { RegisterPatientSchema } from "@/lib/validation";
import { findDuplicateCandidates, generateMrn } from "@/lib/patients";

export type RegisterState = {
  errors?: Record<string, string[]>;
  message?: string;
  duplicates?: { id: string; name: string; mrn: string; dob: string; phone: string | null }[];
  values?: Record<string, string>;
} | undefined;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    confirmNew: String(formData.get("confirmNew") ?? ""),
  };

  const parsed = RegisterPatientSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, values: raw };
  }

  const data = parsed.data;
  const dob = new Date(data.dob);

  const existingEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existingEmail) {
    return {
      errors: { email: ["An account with this email already exists."] },
      values: raw,
    };
  }

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

  const passwordHash = await bcrypt.hash(data.password, 10);
  const mrn = await generateMrn();

  await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      role: "PATIENT",
      name: data.name,
      phone: data.phone || null,
      patientProfile: {
        create: {
          mrn,
          name: data.name,
          dob,
          gender: data.gender,
          phone: data.phone || null,
          address: data.address || null,
        },
      },
    },
  });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}
