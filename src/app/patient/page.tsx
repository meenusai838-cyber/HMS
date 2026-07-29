import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getQueuePositionForAppointment } from "@/lib/queue";
import { getPatientVisitHistory } from "@/lib/consultations";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { VisitHistory } from "@/components/visit-history";
import { PATIENT_NAV } from "@/app/_nav";

export default async function PatientHomePage() {
  const session = await requireRole(["PATIENT"]);

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      allergies: true,
      appointments: {
        where: { status: "SCHEDULED", scheduledStart: { gte: new Date() } },
        include: { doctor: { include: { user: true } } },
        orderBy: { scheduledStart: "asc" },
        take: 5,
      },
    },
  });

  if (!patient) {
    return (
      <RoleShell role="PATIENT" userName={session.user.name ?? "Patient"} navItems={PATIENT_NAV}>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find your patient profile. Please contact the front desk.
        </p>
      </RoleShell>
    );
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const checkedInToday = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      checkedInAt: { gte: todayStart },
      queueStatus: { in: ["WAITING", "IN_PROGRESS"] },
    },
    include: { doctor: { include: { user: true } } },
  });
  const queuePosition = checkedInToday ? await getQueuePositionForAppointment(checkedInToday.id) : null;
  const visits = await getPatientVisitHistory(patient.id);

  return (
    <RoleShell role="PATIENT" userName={session.user.name ?? "Patient"} navItems={PATIENT_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Welcome, {patient.name}</h1>
          <Link href="/patient/book" className={buttonVariants()}>
            Book appointment
          </Link>
        </div>

        {checkedInToday && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>You&apos;re checked in — Dr. {checkedInToday.doctor.user.name}</CardTitle>
              <CardDescription>
                {checkedInToday.queueStatus === "IN_PROGRESS"
                  ? "You are being seen now."
                  : "Live queue status"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6 text-sm">
              <span>
                Token <span className="text-lg font-semibold">#{checkedInToday.tokenNumber}</span>
              </span>
              {checkedInToday.queueStatus === "WAITING" && queuePosition && (
                <>
                  <span>
                    Position <span className="font-semibold">{queuePosition.position}</span> in line
                  </span>
                  <span>
                    Estimated wait{" "}
                    <span className="font-semibold">~{queuePosition.estimatedWaitMinutes} min</span>
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My profile</CardTitle>
              <CardDescription>MRN {patient.mrn}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>DOB: {patient.dob.toISOString().slice(0, 10)}</p>
              <p>Gender: {patient.gender}</p>
              <p>Phone: {patient.phone ?? "—"}</p>
              <p>Address: {patient.address ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>
              See <Link href="/patient/appointments" className="underline underline-offset-4">all appointments</Link> to reschedule or cancel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.appointments.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            )}
            {patient.appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  {a.scheduledStart.toLocaleString()} with Dr. {a.doctor.user.name}
                </span>
                {a.isEmergency && <Badge variant="destructive">Emergency</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        <VisitHistory visits={visits} />
      </div>
    </RoleShell>
  );
}
