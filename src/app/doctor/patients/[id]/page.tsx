import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPatientVisitHistory } from "@/lib/consultations";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VisitHistory } from "@/components/visit-history";
import { DOCTOR_NAV } from "@/app/_nav";

export default async function DoctorPatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["DOCTOR"]);
  const { id } = await props.params;

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });

  const hasRelationship = doctorProfile
    ? await prisma.appointment.findFirst({ where: { doctorId: doctorProfile.id, patientId: id } })
    : null;

  if (!doctorProfile || !hasRelationship) {
    return (
      <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
        <p className="text-sm text-muted-foreground">
          This patient has no appointment with you, or the record can&apos;t be found.
        </p>
      </RoleShell>
    );
  }

  const [patient, visits] = await Promise.all([
    prisma.patientProfile.findUniqueOrThrow({
      where: { id },
      include: {
        allergies: true,
        appointments: {
          where: { doctorId: doctorProfile.id },
          orderBy: { scheduledStart: "desc" },
          take: 25,
        },
      },
    }),
    getPatientVisitHistory(id, { doctorId: doctorProfile.id }),
  ]);

  return (
    <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            MRN {patient.mrn} &middot; DOB {patient.dob.toISOString().slice(0, 10)} &middot; {patient.gender}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Allergies</CardTitle>
            <CardDescription>Check before prescribing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {patient.allergies.length === 0 && (
              <p className="text-sm text-muted-foreground">No known allergies recorded.</p>
            )}
            {patient.allergies.map((a) => (
              <Badge key={a.id} variant={a.severity === "SEVERE" ? "destructive" : "secondary"}>
                {a.substance} ({a.severity.toLowerCase()})
              </Badge>
            ))}
          </CardContent>
        </Card>

        <VisitHistory visits={visits} />

        <Card>
          <CardHeader>
            <CardTitle>Appointments with you</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.scheduledStart.toLocaleString()}</TableCell>
                    <TableCell>
                      {a.isEmergency && <Badge variant="destructive">Emergency</Badge>} <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
