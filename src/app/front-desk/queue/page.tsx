import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getDoctorQueueToday } from "@/lib/queue";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FRONT_DESK_NAV } from "@/app/_nav";
import { WalkInCheckinForm } from "./walkin-checkin-form";
import { checkInAction, skipAction, requeueAction, startAction, completeAction } from "./actions";

export default async function FrontDeskQueuePage(props: {
  searchParams: Promise<{ doctorId?: string }>;
}) {
  const session = await requireRole(["FRONT_DESK", "ADMIN"]);
  const sp = await props.searchParams;

  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true },
    orderBy: { specialty: "asc" },
  });
  const doctorId = sp.doctorId ?? doctors[0]?.id;

  const [queue, patients] = await Promise.all([
    doctorId ? getDoctorQueueToday(doctorId) : null,
    prisma.patientProfile.findMany({
      where: { mergedIntoId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, mrn: true },
    }),
  ]);

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Live queue</h1>

        <Card>
          <CardHeader>
            <CardTitle>Choose doctor</CardTitle>
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
              <Button type="submit" variant="outline">
                View queue
              </Button>
            </form>
          </CardContent>
        </Card>

        {doctorId && queue && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Walk-in check-in</CardTitle>
                <CardDescription>Issues the next token for this doctor.</CardDescription>
              </CardHeader>
              <CardContent>
                <WalkInCheckinForm doctorId={doctorId} patients={patients} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Arrived, not yet checked in</CardTitle>
                <CardDescription>Scheduled appointments today waiting for arrival.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {queue.notCheckedIn.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nobody pending arrival.</p>
                )}
                {queue.notCheckedIn.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span>
                      {a.patient.name} &middot; {a.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <form action={checkInAction}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <input type="hidden" name="doctorId" value={doctorId} />
                      <Button size="sm" type="submit">
                        Check in
                      </Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Waiting ({queue.waiting.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queue.waiting.length === 0 && (
                    <p className="text-sm text-muted-foreground">Queue is empty.</p>
                  )}
                  {queue.waiting.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2">#{a.tokenNumber}</Badge>
                        {a.patient.name}
                        {a.isEmergency && <Badge variant="destructive" className="ml-2">Emergency</Badge>}
                        {a.isWalkIn && <Badge variant="secondary" className="ml-2">Walk-in</Badge>}
                      </span>
                      <div className="flex gap-2">
                        <form action={startAction}>
                          <input type="hidden" name="appointmentId" value={a.id} />
                          <Button size="sm" variant="outline" type="submit">
                            Start
                          </Button>
                        </form>
                        <form action={skipAction}>
                          <input type="hidden" name="appointmentId" value={a.id} />
                          <Button size="sm" variant="outline" type="submit">
                            Skip
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>In consultation ({queue.inProgress.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queue.inProgress.length === 0 && (
                    <p className="text-sm text-muted-foreground">No one currently in consultation.</p>
                  )}
                  {queue.inProgress.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2">#{a.tokenNumber}</Badge>
                        {a.patient.name}
                      </span>
                      <form action={completeAction}>
                        <input type="hidden" name="appointmentId" value={a.id} />
                        <Button size="sm" type="submit">
                          Mark done
                        </Button>
                      </form>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skipped / late ({queue.skipped.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queue.skipped.length === 0 && (
                    <p className="text-sm text-muted-foreground">No skipped patients.</p>
                  )}
                  {queue.skipped.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2">#{a.tokenNumber}</Badge>
                        {a.patient.name}
                      </span>
                      <form action={requeueAction}>
                        <input type="hidden" name="appointmentId" value={a.id} />
                        <Button size="sm" variant="outline" type="submit">
                          Requeue (new token)
                        </Button>
                      </form>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Done today ({queue.done.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  {queue.done.length === 0 && <p>No completed visits yet.</p>}
                  {queue.done.map((a) => (
                    <p key={a.id}>
                      #{a.tokenNumber} {a.patient.name}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </RoleShell>
  );
}
