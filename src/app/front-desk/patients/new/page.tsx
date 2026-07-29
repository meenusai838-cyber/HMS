import { requireRole } from "@/lib/dal";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FRONT_DESK_NAV } from "@/app/_nav";
import { WalkInForm } from "./walkin-form";

export default async function NewWalkInPatientPage() {
  const session = await requireRole(["FRONT_DESK"]);

  return (
    <RoleShell role="FRONT_DESK" userName={session.user.name ?? "Front Desk"} navItems={FRONT_DESK_NAV}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Register walk-in patient</CardTitle>
          <CardDescription>We&apos;ll check for existing records before creating a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <WalkInForm />
        </CardContent>
      </Card>
    </RoleShell>
  );
}
