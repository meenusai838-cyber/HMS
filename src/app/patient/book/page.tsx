import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getSlotsForDoctorOnDate } from "@/lib/appointments";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PATIENT_NAV } from "@/app/_nav";
import { SlotPicker } from "./slot-picker";
import { WaitlistForm } from "./waitlist-form";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function PatientBookPage(props: {
  searchParams: Promise<{ doctorId?: string; date?: string }>;
}) {
  const session = await requireRole(["PATIENT"]);
  const sp = await props.searchParams;

  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true },
    orderBy: { specialty: "asc" },
  });

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
    <RoleShell role="PATIENT" userName={session.user.name ?? "Patient"} navItems={PATIENT_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Book an appointment</h1>

        <Card>
          <CardHeader>
            <CardTitle>Choose doctor and date</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="flex flex-wrap items-end gap-3">
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
            </CardHeader>
            <CardContent>
              <SlotPicker slots={slots} doctorId={doctorId} date={date} />
            </CardContent>
          </Card>
        )}

        {doctorId && (
          <Card>
            <CardHeader>
              <CardTitle>No slot works?</CardTitle>
              <CardDescription>Join the waitlist and front desk will offer you an opening.</CardDescription>
            </CardHeader>
            <CardContent>
              <WaitlistForm doctorId={doctorId} />
            </CardContent>
          </Card>
        )}
      </div>
    </RoleShell>
  );
}
