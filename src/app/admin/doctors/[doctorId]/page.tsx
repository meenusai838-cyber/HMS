import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getDoctorAvailability } from "@/lib/appointments";
import { RoleShell } from "@/components/role-shell";
import { AvailabilityManager } from "@/components/availability-manager";
import { adminAddAvailabilityBlockAction, adminRemoveAvailabilityBlockAction } from "./actions";

export default async function AdminDoctorAvailabilityPage(props: {
  params: Promise<{ doctorId: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { doctorId } = await props.params;

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/staff/new", label: "Add staff" },
  ];

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    include: { user: true },
  });

  if (!doctorProfile) {
    return (
      <RoleShell role="ADMIN" userName={session.user.name ?? "Admin"} navItems={navItems}>
        <p className="text-sm text-muted-foreground">Doctor not found.</p>
      </RoleShell>
    );
  }

  const blocks = await getDoctorAvailability(doctorProfile.id);

  return (
    <RoleShell role="ADMIN" userName={session.user.name ?? "Admin"} navItems={navItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Dr. {doctorProfile.user.name}&apos;s weekly availability
          </h1>
          <p className="text-sm text-muted-foreground">
            This template drives the slots patients and front desk can book this doctor for each week.
          </p>
        </div>

        <AvailabilityManager
          blocks={blocks}
          addAction={adminAddAvailabilityBlockAction.bind(null, doctorProfile.id)}
          removeAction={adminRemoveAvailabilityBlockAction.bind(null, doctorProfile.id)}
        />
      </div>
    </RoleShell>
  );
}
