import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  name: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "FRONT_DESK" | "LAB" | "PHARMACY" | "BILLING";
  password: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      email: params.email,
      name: params.name,
      role: params.role,
      passwordHash,
    },
  });
}

async function main() {
  console.log("Seeding...");

  await upsertUser({ email: "admin@hms.dev", name: "Ava Admin", role: "ADMIN", password: "password123" });
  await upsertUser({ email: "frontdesk@hms.dev", name: "Fred Frontdesk", role: "FRONT_DESK", password: "password123" });
  await upsertUser({ email: "nurse@hms.dev", name: "Nora Nurse", role: "NURSE", password: "password123" });
  await upsertUser({ email: "lab@hms.dev", name: "Leo Lab", role: "LAB", password: "password123" });
  await upsertUser({ email: "pharmacy@hms.dev", name: "Pia Pharmacy", role: "PHARMACY", password: "password123" });
  await upsertUser({ email: "billing@hms.dev", name: "Ben Billing", role: "BILLING", password: "password123" });

  const doctorDefs = [
    { email: "dr.patel@hms.dev", name: "Dr. Anita Patel", specialty: "Cardiology", consultationFee: 150 },
    { email: "dr.kim@hms.dev", name: "Dr. Soo Kim", specialty: "Pediatrics", consultationFee: 100 },
    { email: "dr.garcia@hms.dev", name: "Dr. Luis Garcia", specialty: "General Medicine", consultationFee: 80 },
  ];

  for (const def of doctorDefs) {
    const user = await upsertUser({ email: def.email, name: def.name, role: "DOCTOR", password: "password123" });

    const existingProfile = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
    const doctorProfile = existingProfile
      ? await prisma.doctorProfile.update({
          where: { id: existingProfile.id },
          data: { consultationFee: def.consultationFee },
        })
      : await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            specialty: def.specialty,
            department: def.specialty,
            consultationFee: def.consultationFee,
          },
        });

    const existingAvailability = await prisma.doctorAvailability.findFirst({
      where: { doctorId: doctorProfile.id },
    });
    if (!existingAvailability) {
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await prisma.doctorAvailability.create({
          data: {
            doctorId: doctorProfile.id,
            dayOfWeek,
            startTime: "09:00",
            endTime: "13:00",
            slotMinutes: 15,
          },
        });
      }
    }
  }

  const patientDefs = [
    { email: "john.doe@hms.dev", name: "John Doe", dob: "1990-05-14", gender: "Male", phone: "555-0101" },
    { email: "jane.smith@hms.dev", name: "Jane Smith", dob: "1985-11-02", gender: "Female", phone: "555-0102" },
  ];

  for (const def of patientDefs) {
    const existing = await prisma.user.findUnique({ where: { email: def.email } });
    if (existing) continue;

    const passwordHash = await bcrypt.hash("password123", 10);
    const patientCount = await prisma.patientProfile.count();
    const mrn = `MRN-${new Date().getFullYear()}-${String(patientCount + 1).padStart(5, "0")}`;

    await prisma.user.create({
      data: {
        email: def.email,
        name: def.name,
        role: "PATIENT",
        passwordHash,
        phone: def.phone,
        patientProfile: {
          create: {
            mrn,
            name: def.name,
            dob: new Date(def.dob),
            gender: def.gender,
            phone: def.phone,
          },
        },
      },
    });
  }

  const medicineDefs = [
    { name: "Amoxicillin", genericName: "Penicillin", unitPrice: 1.5 },
    { name: "Penicillin V", genericName: "Penicillin", unitPrice: 1.2 },
    { name: "Ibuprofen", genericName: "Ibuprofen", unitPrice: 0.3 },
    { name: "Aspirin", genericName: "Acetylsalicylic acid", unitPrice: 0.2 },
    { name: "Warfarin", genericName: "Warfarin", unitPrice: 0.8 },
    { name: "Paracetamol", genericName: "Paracetamol", unitPrice: 0.25 },
    { name: "Sulfamethoxazole", genericName: "Sulfonamide", unitPrice: 1.0 },
  ];

  const medicines: Record<string, { id: string }> = {};
  for (const def of medicineDefs) {
    medicines[def.name] = await prisma.medicine.upsert({
      where: { name: def.name },
      update: { unitPrice: def.unitPrice },
      create: def,
    });
  }

  const interactionDefs: {
    a: string;
    b: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    description: string;
  }[] = [
    { a: "Aspirin", b: "Warfarin", severity: "SEVERE", description: "Significantly increased bleeding risk." },
    {
      a: "Ibuprofen",
      b: "Warfarin",
      severity: "MODERATE",
      description: "Increased bleeding risk and reduced anticoagulant efficacy.",
    },
    {
      a: "Amoxicillin",
      b: "Warfarin",
      severity: "MILD",
      description: "May enhance the anticoagulant effect of warfarin.",
    },
  ];

  for (const def of interactionDefs) {
    const medicineAId = medicines[def.a].id;
    const medicineBId = medicines[def.b].id;
    await prisma.drugInteraction.upsert({
      where: { medicineAId_medicineBId: { medicineAId, medicineBId } },
      update: {},
      create: { medicineAId, medicineBId, severity: def.severity, description: def.description },
    });
  }

  const labTestDefs = [
    { name: "Complete Blood Count", description: "CBC panel", price: 45 },
    { name: "Lipid Panel", description: "Cholesterol and triglycerides", price: 60 },
    { name: "Urinalysis", description: "Routine urine test", price: 25 },
    { name: "Blood Glucose", description: "Fasting blood sugar", price: 20 },
    { name: "Rapid Strep Test", description: "Throat swab for streptococcus", price: 35 },
  ];
  for (const def of labTestDefs) {
    await prisma.labTest.upsert({ where: { name: def.name }, update: { price: def.price }, create: def });
  }

  const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const batchDefs: {
    medicine: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
  }[] = [
    { medicine: "Amoxicillin", batchNumber: "AMX-2601", expiryDate: daysFromNow(365), quantity: 100 },
    // Deliberately below the default low-stock threshold (20) to exercise the low-stock alert.
    { medicine: "Ibuprofen", batchNumber: "IBU-2601", expiryDate: daysFromNow(300), quantity: 10 },
    { medicine: "Aspirin", batchNumber: "ASP-2601", expiryDate: daysFromNow(365), quantity: 50 },
    // Deliberately expiring soon (within 30 days) to exercise the expiring-soon alert.
    { medicine: "Warfarin", batchNumber: "WAR-2512", expiryDate: daysFromNow(15), quantity: 30 },
    { medicine: "Paracetamol", batchNumber: "PCM-2601", expiryDate: daysFromNow(400), quantity: 200 },
    { medicine: "Penicillin V", batchNumber: "PNV-2601", expiryDate: daysFromNow(200), quantity: 40 },
    { medicine: "Sulfamethoxazole", batchNumber: "SFX-2601", expiryDate: daysFromNow(250), quantity: 25 },
  ];

  for (const def of batchDefs) {
    const medicine = medicines[def.medicine];
    const existing = await prisma.medicineBatch.findFirst({
      where: { medicineId: medicine.id, batchNumber: def.batchNumber },
    });
    if (!existing) {
      await prisma.medicineBatch.create({
        data: {
          medicineId: medicine.id,
          batchNumber: def.batchNumber,
          expiryDate: def.expiryDate,
          quantityReceived: def.quantity,
          quantityRemaining: def.quantity,
        },
      });
    }
  }

  const johnDoe = await prisma.patientProfile.findFirst({ where: { name: "John Doe" } });
  if (johnDoe) {
    const existingAllergy = await prisma.allergy.findFirst({
      where: { patientId: johnDoe.id, substance: "Penicillin" },
    });
    if (!existingAllergy) {
      await prisma.allergy.create({
        data: { patientId: johnDoe.id, substance: "Penicillin", severity: "SEVERE", notes: "Hives on exposure" },
      });
    }
  }

  const wardDefs = [
    { name: "General Ward", floor: "2", bedCount: 6, dailyRate: 200 },
    { name: "ICU", floor: "3", bedCount: 4, dailyRate: 800 },
    { name: "Pediatric Ward", floor: "1", bedCount: 4, dailyRate: 250 },
  ];

  for (const def of wardDefs) {
    const ward = await prisma.ward.upsert({
      where: { name: def.name },
      update: { dailyRate: def.dailyRate },
      create: { name: def.name, floor: def.floor, dailyRate: def.dailyRate },
    });
    for (let i = 1; i <= def.bedCount; i++) {
      const bedNumber = String(i).padStart(2, "0");
      await prisma.bed.upsert({
        where: { wardId_bedNumber: { wardId: ward.id, bedNumber } },
        update: {},
        create: { wardId: ward.id, bedNumber },
      });
    }
  }

  await prisma.operationTheatre.upsert({ where: { name: "OT-1" }, update: {}, create: { name: "OT-1" } });
  await prisma.operationTheatre.upsert({ where: { name: "OT-2" }, update: {}, create: { name: "OT-2" } });

  const janeSmith = await prisma.patientProfile.findFirst({ where: { name: "Jane Smith" } });
  const drGarcia = await prisma.doctorProfile.findFirst({ where: { user: { email: "dr.garcia@hms.dev" } } });
  if (janeSmith && drGarcia) {
    const existingAdmission = await prisma.admission.findFirst({
      where: { patientId: janeSmith.id, status: "ADMITTED" },
    });
    if (!existingAdmission) {
      const generalWard = await prisma.ward.findUniqueOrThrow({ where: { name: "General Ward" } });
      const bed = await prisma.bed.findFirstOrThrow({
        where: { wardId: generalWard.id, bedNumber: "01" },
      });
      const admission = await prisma.admission.create({
        data: {
          patientId: janeSmith.id,
          admittingDoctorId: drGarcia.id,
          reason: "Observation after minor procedure",
        },
      });
      await prisma.bedAssignment.create({ data: { admissionId: admission.id, bedId: bed.id } });
      await prisma.bed.update({ where: { id: bed.id }, data: { status: "OCCUPIED" } });
    }
  }

  const johnDoeForBilling = await prisma.patientProfile.findFirst({ where: { name: "John Doe" } });
  if (johnDoeForBilling && drGarcia) {
    const existingBillableAppt = await prisma.appointment.findFirst({
      where: { patientId: johnDoeForBilling.id, doctorId: drGarcia.id, status: "COMPLETED" },
    });
    if (!existingBillableAppt) {
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const appointment = await prisma.appointment.create({
        data: {
          patientId: johnDoeForBilling.id,
          doctorId: drGarcia.id,
          scheduledStart: start,
          scheduledEnd: new Date(start.getTime() + 15 * 60 * 1000),
          status: "COMPLETED",
        },
      });
      const consultation = await prisma.consultation.create({
        data: {
          appointmentId: appointment.id,
          patientId: johnDoeForBilling.id,
          doctorId: drGarcia.id,
          symptoms: "Sore throat, mild fever",
          diagnosis: "Streptococcal pharyngitis",
          treatmentNotes: "Prescribed antibiotics, follow up in 1 week if symptoms persist.",
        },
      });
      const strepTest = await prisma.labTest.findUnique({ where: { name: "Rapid Strep Test" } });
      await prisma.labOrder.create({
        data: {
          consultationId: consultation.id,
          patientId: johnDoeForBilling.id,
          testId: strepTest?.id,
          testName: "Rapid Strep Test",
          status: "COMPLETED",
          sampleCollectedAt: start,
          completedAt: start,
          resultSummary: "Positive",
        },
      });
      const paracetamol = medicines["Paracetamol"];
      const prescription = await prisma.prescription.create({ data: { consultationId: consultation.id } });
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicineId: paracetamol.id,
          medicineName: "Paracetamol",
          dosage: "500mg",
          frequency: "3x daily",
          durationDays: 5,
          quantityDispensed: 15,
          dispensedAt: start,
        },
      });
    }
  }

  console.log("Seed complete. All seeded accounts use password: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
