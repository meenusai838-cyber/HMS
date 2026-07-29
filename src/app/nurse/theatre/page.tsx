import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getUpcomingSurgeries } from "@/lib/theatre";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NURSE_NAV } from "@/app/_nav";
import { ScheduleForm } from "./schedule-form";
import { startSurgeryAction, completeSurgeryAction, cancelSurgeryAction } from "./actions";

export default async function TheatrePage() {
  const session = await requireRole(["NURSE"]);

  const [surgeries, theatres, patients, surgeons] = await Promise.all([
    getUpcomingSurgeries(),
    prisma.operationTheatre.findMany({ orderBy: { name: "asc" } }),
    prisma.patientProfile.findMany({
      where: { mergedIntoId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, mrn: true },
    }),
    prisma.doctorProfile.findMany({ include: { user: true }, orderBy: { specialty: "asc" } }),
  ]);

  return (
    <RoleShell role="NURSE" userName={session.user.name ?? "Nurse"} navItems={NURSE_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Operation theatre schedule</h1>

        <Card>
          <CardHeader>
            <CardTitle>Schedule a surgery</CardTitle>
            <CardDescription>The theatre can&apos;t be double-booked for overlapping times.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleForm
              theatres={theatres.map((t) => ({ id: t.id, label: t.name }))}
              patients={patients.map((p) => ({ id: p.id, label: `${p.name} (${p.mrn})` }))}
              surgeons={surgeons.map((d) => ({ id: d.id, label: `${d.user.name} — ${d.specialty}` }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming &amp; in-progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {surgeries.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            )}
            {surgeries.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{s.theatre.name}</span> &middot; {s.procedureName} &middot;{" "}
                  {s.patient.name} &middot; Dr. {s.surgeon.user.name}
                  <br />
                  <span className="text-muted-foreground">
                    {s.scheduledStart.toLocaleString()} – {s.scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Badge variant={s.status === "IN_PROGRESS" ? "destructive" : "outline"} className="ml-2">
                    {s.status.replace("_", " ")}
                  </Badge>
                </span>
                <div className="flex gap-2">
                  {s.status === "SCHEDULED" && (
                    <form action={startSurgeryAction}>
                      <input type="hidden" name="surgeryId" value={s.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Start
                      </Button>
                    </form>
                  )}
                  {s.status === "IN_PROGRESS" && (
                    <form action={completeSurgeryAction}>
                      <input type="hidden" name="surgeryId" value={s.id} />
                      <Button size="sm" type="submit">
                        Complete
                      </Button>
                    </form>
                  )}
                  {s.status === "SCHEDULED" && (
                    <form action={cancelSurgeryAction}>
                      <input type="hidden" name="surgeryId" value={s.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
