import type { Role } from "@prisma/client";

export const ROLES: Role[] = [
  "PATIENT",
  "DOCTOR",
  "NURSE",
  "FRONT_DESK",
  "LAB",
  "PHARMACY",
  "BILLING",
  "ADMIN",
];

export const ROLE_HOME: Record<Role, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  NURSE: "/nurse",
  FRONT_DESK: "/front-desk",
  LAB: "/lab",
  PHARMACY: "/pharmacy",
  BILLING: "/billing",
  ADMIN: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  FRONT_DESK: "Front Desk",
  LAB: "Lab",
  PHARMACY: "Pharmacy",
  BILLING: "Billing",
  ADMIN: "Admin",
};

export function roleHomePath(role: Role): string {
  return ROLE_HOME[role] ?? "/login";
}
