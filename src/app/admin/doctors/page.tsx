import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDoctorsPage() {
  const session = await requireRole(["ADMIN"]);

  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true },
    orderBy: { specialty: "asc" },
  });

  return (
    <RoleShell
      role="ADMIN"
      userName={session.user.name ?? "Admin"}
      navItems={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/doctors", label: "Doctors" },
        { href: "/admin/staff/new", label: "Add staff" },
      ]}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Doctors</h1>

        <Card>
          <CardHeader>
            <CardTitle>Manage weekly availability</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No doctors yet.
                    </TableCell>
                  </TableRow>
                )}
                {doctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>Dr. {d.user.name}</TableCell>
                    <TableCell>{d.specialty}</TableCell>
                    <TableCell>{d.department ?? "—"}</TableCell>
                    <TableCell>
                      <Link href={`/admin/doctors/${d.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        Manage availability
                      </Link>
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
