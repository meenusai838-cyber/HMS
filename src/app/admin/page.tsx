import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getBedOccupancyStats } from "@/lib/ward";
import { getStockOverview } from "@/lib/pharmacy";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, ROLES } from "@/lib/roles";

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

export default async function AdminPage() {
  const session = await requireRole(["ADMIN"]);
  const now = new Date();

  const [totalPatients, todaysAppointments, upcomingAppointments, staffCounts, bedStats, stock] =
    await Promise.all([
      prisma.patientProfile.count({ where: { mergedIntoId: null } }),
      prisma.appointment.count({
        where: {
          scheduledStart: { gte: startOfDay(now), lte: endOfDay(now) },
          status: { in: ["SCHEDULED", "COMPLETED"] },
        },
      }),
      prisma.appointment.count({
        where: { scheduledStart: { gt: now }, status: "SCHEDULED" },
      }),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      getBedOccupancyStats(),
      getStockOverview(),
    ]);

  const staffCountByRole = Object.fromEntries(staffCounts.map((s) => [s.role, s._count.role]));
  const lowStockCount = stock.filter((m) => m.isLowStock).length;

  return (
    <RoleShell
      role="ADMIN"
      userName={session.user.name ?? "Admin"}
      navItems={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/staff/new", label: "Add staff" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <Button render={<Link href="/admin/staff/new">Add staff account</Link>} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total patients</CardDescription>
              <CardTitle className="text-3xl">{totalPatients}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Appointments today</CardDescription>
              <CardTitle className="text-3xl">{todaysAppointments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Upcoming appointments</CardDescription>
              <CardTitle className="text-3xl">{upcomingAppointments}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Bed occupancy</CardDescription>
              <CardTitle className="text-3xl">
                {bedStats.occupancyRate}%
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({bedStats.occupied}/{bedStats.total} beds)
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Medicines below low-stock threshold</CardDescription>
              <CardTitle className="text-3xl">{lowStockCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff by role</CardTitle>
            <CardDescription>Revenue tracking arrives with the Billing module.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ROLES.filter((r) => r !== "PATIENT").map((role) => (
                <div key={role} className="rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">{ROLE_LABEL[role]}</p>
                  <p className="text-xl font-semibold">{staffCountByRole[role] ?? 0}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
