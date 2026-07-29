import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FRONT_DESK_NAV } from "@/app/_nav";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function FrontDeskPage() {
  const session = await requireRole(["FRONT_DESK"]);
  const now = new Date();

  const [todaysAppointments, waitlisted] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        scheduledStart: { gte: startOfDay(now), lte: endOfDay(now) },
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      include: { patient: true, doctor: { include: { user: true } } },
      orderBy: [{ isEmergency: "desc" }, { scheduledStart: "asc" }],
    }),
    prisma.appointment.findMany({
      where: { status: "WAITLISTED" },
      include: { patient: true, doctor: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Front desk</h1>
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/front-desk/patients">Find patient</Link>} />
            <Button render={<Link href="/front-desk/patients/new">Register walk-in</Link>} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <CardDescription>Emergency bookings are shown first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysAppointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No appointments today.
                    </TableCell>
                  </TableRow>
                )}
                {todaysAppointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/front-desk/patients/${a.patientId}`} className="underline underline-offset-4">
                        {a.patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{a.doctor.user.name}</TableCell>
                    <TableCell>
                      {a.isEmergency && <Badge variant="destructive">Emergency</Badge>}
                      {!a.isEmergency && <Badge variant="secondary">{a.status}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waitlist</CardTitle>
            <CardDescription>Offer an open slot from a patient&apos;s booking page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Preferred date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlisted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No one is waitlisted.
                    </TableCell>
                  </TableRow>
                )}
                {waitlisted.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.patient.name}</TableCell>
                    <TableCell>{w.doctor.user.name}</TableCell>
                    <TableCell>{w.scheduledStart.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link
                            href={`/front-desk/book?patientId=${w.patientId}&doctorId=${w.doctorId}&waitlistId=${w.id}`}
                          >
                            Offer slot
                          </Link>
                        }
                      />
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
