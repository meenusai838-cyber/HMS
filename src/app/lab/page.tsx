import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getPendingLabOrders } from "@/lib/lab";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LAB_NAV } from "@/app/_nav";
import { collectSampleAction, startProcessingAction } from "./actions";

export default async function LabPage() {
  const session = await requireRole(["LAB"]);
  const orders = await getPendingLabOrders();

  return (
    <RoleShell role="LAB" userName={session.user.name ?? "Lab"} navItems={LAB_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Test queue</h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending orders ({orders.length})</CardTitle>
            <CardDescription>Ordered by request time, oldest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending lab orders.</p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>
                  <span className="font-medium">{o.testName}</span> for {o.patient.name} &middot; ordered by Dr.{" "}
                  {o.consultation.doctor.user.name}
                  <Badge variant="outline" className="ml-2">
                    {o.status.replace("_", " ")}
                  </Badge>
                </span>
                <div className="flex gap-2">
                  {o.status === "ORDERED" && (
                    <form action={collectSampleAction}>
                      <input type="hidden" name="labOrderId" value={o.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Collect sample
                      </Button>
                    </form>
                  )}
                  {o.status === "SAMPLE_COLLECTED" && (
                    <form action={startProcessingAction}>
                      <input type="hidden" name="labOrderId" value={o.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Start processing
                      </Button>
                    </form>
                  )}
                  {o.status === "IN_PROGRESS" && (
                    <Link href={`/lab/orders/${o.id}`} className={buttonVariants({ size: "sm" })}>
                      Enter results
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
