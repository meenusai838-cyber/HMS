import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FRONT_DESK_NAV } from "@/app/_nav";

export default async function FrontDeskPatientsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole(["FRONT_DESK"]);
  const { q } = await props.searchParams;

  const patients = await prisma.patientProfile.findMany({
    where: {
      mergedIntoId: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { mrn: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Patients</h1>
          <Button render={<Link href="/front-desk/patients/new">Register walk-in</Link>} />
        </div>

        <Card>
          <CardHeader>
            <form className="flex gap-2">
              <Input name="q" placeholder="Search by name, MRN, or phone" defaultValue={q} />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No patients found.
                    </TableCell>
                  </TableRow>
                )}
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/front-desk/patients/${p.id}`} className="underline underline-offset-4">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.mrn}</TableCell>
                    <TableCell>{p.dob.toISOString().slice(0, 10)}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
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
