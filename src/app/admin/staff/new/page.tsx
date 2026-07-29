import { requireRole } from "@/lib/dal";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffForm } from "./staff-form";

export default async function NewStaffPage() {
  const session = await requireRole(["ADMIN"]);

  return (
    <RoleShell
      role="ADMIN"
      userName={session.user.name ?? "Admin"}
      navItems={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/staff/new", label: "Add staff" },
      ]}
    >
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Add staff account</CardTitle>
          <CardDescription>
            Create a login for a doctor, nurse, front desk, lab, pharmacy, billing, or admin user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffForm />
        </CardContent>
      </Card>
    </RoleShell>
  );
}
