import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { resolvePatientId } from "@/lib/patients";
import { getPatientVisitHistory } from "@/lib/consultations";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VisitHistory } from "@/components/visit-history";
import { FRONT_DESK_NAV } from "@/app/_nav";
import { AllergyForm } from "./allergy-form";
import { cancelAppointmentAction } from "./actions";

export default async function PatientDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["FRONT_DESK", "ADMIN"]);
  const { id } = await props.params;

  const survivorId = await resolvePatientId(id);
  if (survivorId !== id) {
    redirect(`/front-desk/patients/${survivorId}`);
  }

  const [patient, visits] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id },
      include: {
        allergies: { orderBy: { createdAt: "desc" } },
        appointments: {
          include: { doctor: { include: { user: true } } },
          orderBy: { scheduledStart: "desc" },
          take: 25,
        },
        mergedFrom: true,
      },
    }),
    getPatientVisitHistory(id),
  ]);

  if (!patient) {
    return (
      <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
        <p>Patient not found.</p>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              MRN {patient.mrn} &middot; DOB {patient.dob.toISOString().slice(0, 10)} &middot; {patient.gender}
            </p>
          </div>
          <Link
            href={`/front-desk/book?patientId=${patient.id}`}
            className={buttonVariants()}
          >
            Book appointment
          </Link>
        </div>

        {patient.mergedFrom.length > 0 && (
          <div className="rounded-md border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {patient.mergedFrom.length} duplicate record(s) have been merged into this profile.
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Phone: {patient.phone ?? "—"}</p>
              <p>Address: {patient.address ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Checked automatically during prescribing (once Consultation ships).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {patient.allergies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No known allergies recorded.</p>
                )}
                {patient.allergies.map((a) => (
                  <Badge
                    key={a.id}
                    variant={a.severity === "SEVERE" ? "destructive" : "secondary"}
                  >
                    {a.substance} ({a.severity.toLowerCase()})
                  </Badge>
                ))}
              </div>
              <AllergyForm patientId={patient.id} />
            </CardContent>
          </Card>
        </div>

        <VisitHistory visits={visits} />

        <Card>
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
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
                {patient.appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No appointments yet.
                    </TableCell>
                  </TableRow>
                )}
                {patient.appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.status === "WAITLISTED"
                        ? `Waitlisted (preferred ${a.scheduledStart.toLocaleDateString()})`
                        : a.scheduledStart.toLocaleString()}
                    </TableCell>
                    <TableCell>{a.doctor.user.name}</TableCell>
                    <TableCell>
                      {a.isEmergency && <Badge variant="destructive">Emergency</Badge>}{" "}
                      <Badge variant="secondary">{a.status}</Badge>
                      {a.recurrenceGroupId && <Badge variant="outline">Series</Badge>}
                    </TableCell>
                    <TableCell>
                      {(a.status === "SCHEDULED") && (
                        <form action={cancelAppointmentAction} className="flex gap-2">
                          <input type="hidden" name="appointmentId" value={a.id} />
                          <input type="hidden" name="patientId" value={patient.id} />
                          <input type="hidden" name="recurrenceGroupId" value={a.recurrenceGroupId ?? ""} />
                          <Button size="sm" variant="outline" type="submit">
                            Cancel
                          </Button>
                          {a.recurrenceGroupId && (
                            <Button
                              size="sm"
                              variant="outline"
                              type="submit"
                              name="cancelSeries"
                              value="true"
                            >
                              Cancel series
                            </Button>
                          )}
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
