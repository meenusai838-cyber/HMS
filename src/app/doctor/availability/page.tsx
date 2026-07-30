import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getDoctorAvailability } from "@/lib/appointments";
import { RoleShell } from "@/components/role-shell";
import { AvailabilityManager } from "@/components/availability-manager";
import { DOCTOR_NAV } from "@/app/_nav";
import { addAvailabilityBlockAction, removeAvailabilityBlockAction } from "./actions";

export default async function AvailabilityPage() {
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

  const blocks = await getDoctorAvailability(doctorProfile.id);

  return (
    <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Weekly availability</h1>
          <p className="text-sm text-muted-foreground">
            This template drives the slots patients and front desk can book you for each week.
          </p>
        </div>

        <AvailabilityManager
          blocks={blocks}
          addAction={addAvailabilityBlockAction}
          removeAction={removeAvailabilityBlockAction}
        />
      </div>
    </RoleShell>
  );
}
