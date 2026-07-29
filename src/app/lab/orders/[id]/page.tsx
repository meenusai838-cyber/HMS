import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LAB_NAV } from "@/app/_nav";
import { CompleteForm } from "./complete-form";

export default async function LabOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["LAB"]);
  const { id } = await props.params;

  const order = await prisma.labOrder.findUnique({
    where: { id },
    include: { patient: true, consultation: { include: { doctor: { include: { user: true } } } } },
  });

  if (!order) {
    return (
      <RoleShell role="LAB" userName={session.user.name ?? "Lab"} navItems={LAB_NAV}>
        <p className="text-sm text-muted-foreground">Order not found.</p>
      </RoleShell>
    );
  }

  return (
    <RoleShell role="LAB" userName={session.user.name ?? "Lab"} navItems={LAB_NAV}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{order.testName}</CardTitle>
          <CardDescription>
            {order.patient.name} &middot; ordered by Dr. {order.consultation.doctor.user.name}
            {order.notes ? ` — ${order.notes}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteForm labOrderId={order.id} />
        </CardContent>
      </Card>
    </RoleShell>
  );
}
