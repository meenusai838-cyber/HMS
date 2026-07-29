import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FRONT_DESK_NAV } from "@/app/_nav";
import { MergeForm } from "./merge-form";

export default async function MergePatientsPage() {
  const session = await requireRole(["FRONT_DESK", "ADMIN"]);

  const patients = await prisma.patientProfile.findMany({
    where: { mergedIntoId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, mrn: true, dob: true },
  });

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Merge duplicate patients</CardTitle>
          <CardDescription>
            The duplicate&apos;s appointments and allergies move to the surviving profile. The
            duplicate is kept (not deleted) and redirects to the survivor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MergeForm
            patients={patients.map((p) => ({
              ...p,
              dob: p.dob.toISOString().slice(0, 10),
            }))}
          />
        </CardContent>
      </Card>
    </RoleShell>
  );
}
