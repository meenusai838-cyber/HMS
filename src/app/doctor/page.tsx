import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getDoctorQueueToday } from "@/lib/queue";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DOCTOR_NAV } from "@/app/_nav";
import { completeAction } from "../front-desk/queue/actions";

export default async function DoctorPage() {
  const session = await requireRole(["DOCTOR"]);

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctorProfile) {
    return (
      <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
        <p className="text-sm text-muted-foreground">
          Your doctor profile hasn&apos;t been set up yet. Contact an admin.
        </p>
      </RoleShell>
    );
  }

  const queue = await getDoctorQueueToday(doctorProfile.id);
  const now = new Date();

  return (
    <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Today&apos;s queue</h1>
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} &middot;
          Emergency and already-in-progress patients are prioritized.
        </p>

        {queue.inProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>In consultation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {queue.inProgress.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>
                    <Badge variant="outline" className="mr-2">#{a.tokenNumber}</Badge>
                    <Link href={`/doctor/patients/${a.patientId}`} className="underline underline-offset-4">
                      {a.patient.name}
                    </Link>
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/doctor/consultations/${a.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Open consultation
                    </Link>
                    <form action={completeAction}>
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <Button size="sm" type="submit">
                        Mark done
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Waiting ({queue.waiting.length})</CardTitle>
            <CardDescription>Ordered by emergency priority, then token number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {queue.waiting.length === 0 && (
              <p className="text-sm text-muted-foreground">No one waiting right now.</p>
            )}
            {queue.waiting.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <Badge variant="outline" className="mr-2">#{a.tokenNumber}</Badge>
                  <Link href={`/doctor/patients/${a.patientId}`} className="underline underline-offset-4">
                    {a.patient.name}
                  </Link>
                  {a.isEmergency && <Badge variant="destructive" className="ml-2">Emergency</Badge>}
                  {a.isWalkIn && <Badge variant="secondary" className="ml-2">Walk-in</Badge>}
                </span>
                <Link
                  href={`/doctor/consultations/${a.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  Start consultation
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled, not yet arrived</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {queue.notCheckedIn.length === 0 && <p>Everyone scheduled has checked in.</p>}
            {queue.notCheckedIn.map((a) => (
              <p key={a.id}>
                {a.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {a.patient.name}
              </p>
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
    </RoleShell>
  );
}
