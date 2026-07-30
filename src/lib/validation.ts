import { z } from "zod";

export const RegisterPatientSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  dob: z.string().min(1, { error: "Date of birth is required." }),
  gender: z.string().min(1, { error: "Gender is required." }),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  confirmNew: z.string().optional(),
});

export const WalkInPatientSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  dob: z.string().min(1, { error: "Date of birth is required." }),
  gender: z.string().min(1, { error: "Gender is required." }),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  confirmNew: z.string().optional(),
});

export const StaffCreateSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(["DOCTOR", "NURSE", "FRONT_DESK", "LAB", "PHARMACY", "BILLING", "ADMIN"]),
  specialty: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

export const AllergySchema = z.object({
  patientId: z.string().min(1),
  substance: z.string().min(1, { error: "Substance is required." }).trim(),
  severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
  notes: z.string().trim().optional(),
});

export const BookAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string().min(1, { error: "Date is required." }),
  startTime: z.string().min(1, { error: "Start time is required." }),
  isEmergency: z.string().optional(),
  repeatWeeks: z.coerce.number().int().min(1).max(12).optional(),
  notes: z.string().trim().optional(),
});

export const WaitlistSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  preferredDate: z.string().min(1, { error: "Preferred date is required." }),
  notes: z.string().trim().optional(),
});

export const BillItemSchema = z.object({
  billId: z.string().min(1),
  category: z.enum(["CONSULTATION", "LAB_TEST", "MEDICINE", "ROOM", "OTHER"]),
  description: z.string().min(1, { error: "Description is required." }).trim(),
  quantity: z.coerce.number().int().min(1, { error: "Quantity must be at least 1." }),
  unitPrice: z.coerce.number().min(0, { error: "Unit price can't be negative." }),
});

export const PaymentSchema = z.object({
  billId: z.string().min(1),
  amount: z.coerce.number().positive({ error: "Amount must be greater than 0." }),
  method: z.enum(["CASH", "CARD", "ONLINE", "INSURANCE"]),
  reference: z.string().trim().optional(),
});

export const InsuranceClaimSchema = z.object({
  billId: z.string().min(1),
  insurerName: z.string().min(1, { error: "Insurer name is required." }).trim(),
  policyNumber: z.string().min(1, { error: "Policy number is required." }).trim(),
  claimedAmount: z.coerce.number().positive({ error: "Claimed amount must be greater than 0." }),
});

export const ClaimUpdateSchema = z.object({
  claimId: z.string().min(1),
  status: z.enum(["SUBMITTED", "APPROVED", "PARTIALLY_APPROVED", "REJECTED"]),
  approvedAmount: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
});

export const AvailabilityBlockSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, { error: "Enter a valid start time." }),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, { error: "Enter a valid end time." }),
    slotMinutes: z.coerce.number().int().min(5, { error: "Slots must be at least 5 minutes." }).max(240),
  })
  .refine((data) => data.startTime < data.endTime, {
    error: "End time must be after start time.",
    path: ["endTime"],
  });
