import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getStockOverview } from "@/lib/pharmacy";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PHARMACY_NAV } from "@/app/_nav";
import { ReceiveBatchForm } from "./receive-batch-form";

export default async function PharmacyPage() {
  const session = await requireRole(["PHARMACY"]);

  const [stock, medicines] = await Promise.all([
    getStockOverview(),
    prisma.medicine.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const lowStockCount = stock.filter((m) => m.isLowStock).length;

  return (
    <RoleShell role="PHARMACY" userName={session.user.name ?? "Pharmacy"} navItems={PHARMACY_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Medicine stock</h1>

        {lowStockCount > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {lowStockCount} medicine(s) are below their low-stock threshold.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Receive stock</CardTitle>
            <CardDescription>Record a new batch with its expiry date.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiveBatchForm medicines={medicines} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current stock</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nearest expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.name}
                      {m.genericName ? ` (${m.genericName})` : ""}
                    </TableCell>
                    <TableCell>{m.totalRemaining}</TableCell>
                    <TableCell className="space-x-1">
                      {m.isLowStock && <Badge variant="destructive">Low stock</Badge>}
                      {m.expiringSoonCount > 0 && <Badge variant="outline">{m.expiringSoonCount} batch(es) expiring soon</Badge>}
                      {m.expiredCount > 0 && <Badge variant="destructive">{m.expiredCount} expired batch(es)</Badge>}
                      {!m.isLowStock && m.expiringSoonCount === 0 && m.expiredCount === 0 && (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.batches[0] ? m.batches[0].expiryDate.toISOString().slice(0, 10) : "—"}
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
