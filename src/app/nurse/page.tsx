import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getWardBoard } from "@/lib/ward";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NURSE_NAV } from "@/app/_nav";

export default async function NursePage() {
  const session = await requireRole(["NURSE"]);
  const wards = await getWardBoard();

  return (
    <RoleShell role="NURSE" userName={session.user.name ?? "Nurse"} navItems={NURSE_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Ward &amp; bed board</h1>

        {wards.map((ward) => (
          <Card key={ward.id}>
            <CardHeader>
              <CardTitle>{ward.name}</CardTitle>
              <CardDescription>
                {ward.beds.filter((b) => b.status === "AVAILABLE").length} of {ward.beds.length} beds available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ward.beds.map((bed) => {
                  const assignment = bed.assignments[0];
                  return (
                    <div key={bed.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Bed {bed.bedNumber}</span>
                        <Badge
                          variant={
                            bed.status === "AVAILABLE"
                              ? "secondary"
                              : bed.status === "OCCUPIED"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {bed.status}
                        </Badge>
                      </div>
                      {assignment && (
                        <Link
                          href={`/nurse/admissions/${assignment.admissionId}`}
                          className="mt-1 block text-muted-foreground underline underline-offset-4"
                        >
                          {assignment.admission.patient.name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </RoleShell>
  );
}
