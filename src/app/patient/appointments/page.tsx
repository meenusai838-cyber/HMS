import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PATIENT_NAV } from "@/app/_nav";
import { cancelMyAppointmentAction } from "./actions";

export default async function PatientAppointmentsPage() {
  const session = await requireRole(["PATIENT"]);

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
        include: { doctor: { include: { user: true } } },
        orderBy: { scheduledStart: "desc" },
      },
    },
  });

  return (
    <RoleShell role="PATIENT" userName={session.user.name ?? "Patient"} navItems={PATIENT_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My appointments</h1>
          <Link href="/patient/book" className={buttonVariants()}>
            Book new
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!patient || patient.appointments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No appointments yet.
                    </TableCell>
                  </TableRow>
                )}
                {patient?.appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.status === "WAITLISTED"
                        ? `Waitlisted (preferred ${a.scheduledStart.toLocaleDateString()})`
                        : a.scheduledStart.toLocaleString()}
                    </TableCell>
                    <TableCell>Dr. {a.doctor.user.name}</TableCell>
                    <TableCell>
                      {a.isEmergency && <Badge variant="destructive">Emergency</Badge>}{" "}
                      <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {a.status === "SCHEDULED" && (
                        <form action={cancelMyAppointmentAction}>
                          <input type="hidden" name="appointmentId" value={a.id} />
                          <Button size="sm" variant="outline" type="submit">
                            Cancel
                          </Button>
                        </form>
                      )}
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
