import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getSlotsForDoctorOnDate } from "@/lib/appointments";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FRONT_DESK_NAV } from "@/app/_nav";
import { SlotPicker } from "./slot-picker";
import { WaitlistForm } from "./waitlist-form";
import { bookEmergencyNowAction } from "./actions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function FrontDeskBookPage(props: {
  searchParams: Promise<{ patientId?: string; doctorId?: string; date?: string; waitlistId?: string }>;
}) {
  const session = await requireRole(["FRONT_DESK", "ADMIN"]);
  const sp = await props.searchParams;

  if (!sp.patientId) {
    return (
      <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Book an appointment</CardTitle>
            <CardDescription>Find a patient first, then book from their profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/front-desk/patients" className={buttonVariants()}>
              Find patient
            </Link>
          </CardContent>
        </Card>
      </RoleShell>
    );
  }

  const [patient, doctors] = await Promise.all([
    prisma.patientProfile.findUnique({ where: { id: sp.patientId } }),
    prisma.doctorProfile.findMany({ include: { user: true }, orderBy: { specialty: "asc" } }),
  ]);

  if (!patient) {
    return (
      <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
        <p>Patient not found.</p>
      </RoleShell>
    );
  }

  const doctorId = sp.doctorId ?? doctors[0]?.id;
  const date = sp.date ?? todayStr();
  const slots = doctorId
    ? (await getSlotsForDoctorOnDate(doctorId, new Date(`${date}T00:00:00`))).map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        available: s.available,
      }))
    : [];

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Book appointment</h1>
          <p className="text-sm text-muted-foreground">
            For{" "}
            <Link href={`/front-desk/patients/${patient.id}`} className="underline underline-offset-4">
              {patient.name}
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose doctor and date</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="patientId" value={patient.id} />
              {sp.waitlistId && <input type="hidden" name="waitlistId" value={sp.waitlistId} />}
              <div className="space-y-1">
                <Label htmlFor="doctorId">Doctor</Label>
                <select
                  id="doctorId"
                  name="doctorId"
                  defaultValue={doctorId}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={date}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <Button type="submit" variant="outline">
                View slots
              </Button>
            </form>
          </CardContent>
        </Card>

        {doctorId && (
          <Card>
            <CardHeader>
              <CardTitle>Available slots — {date}</CardTitle>
              <CardDescription>Grey slots are already booked.</CardDescription>
            </CardHeader>
            <CardContent>
              <SlotPicker
                slots={slots}
                patientId={patient.id}
                doctorId={doctorId}
                date={date}
                waitlistId={sp.waitlistId}
              />
            </CardContent>
          </Card>
        )}

        {doctorId && !sp.waitlistId && (
          <Card>
            <CardHeader>
              <CardTitle>No slot works?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <WaitlistForm patientId={patient.id} doctorId={doctorId} />
              <form action={bookEmergencyNowAction}>
                <input type="hidden" name="patientId" value={patient.id} />
                <input type="hidden" name="doctorId" value={doctorId} />
                <Button type="submit" variant="destructive">
                  Book emergency now (bypasses schedule)
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleShell>
  );
}
