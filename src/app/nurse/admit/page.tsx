import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getAvailableBeds } from "@/lib/ward";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NURSE_NAV } from "@/app/_nav";
import { AdmitForm } from "./admit-form";

export default async function AdmitPatientPage() {
  const session = await requireRole(["NURSE"]);

  const [patients, doctors, beds] = await Promise.all([
    prisma.patientProfile.findMany({
      where: { mergedIntoId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, mrn: true },
    }),
    prisma.doctorProfile.findMany({
      include: { user: true },
      orderBy: { specialty: "asc" },
    }),
    getAvailableBeds(),
  ]);

  return (
    <RoleShell role="NURSE" userName={session.user.name ?? "Nurse"} navItems={NURSE_NAV}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Admit patient</CardTitle>
          <CardDescription>Assigns the patient directly to an available bed.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdmitForm
            patients={patients}
            doctors={doctors.map((d) => ({ id: d.id, name: d.user.name, specialty: d.specialty }))}
            beds={beds.map((b) => ({ id: b.id, label: `${b.ward.name} — Bed ${b.bedNumber}` }))}
          />
        </CardContent>
      </Card>
    </RoleShell>
  );
}
