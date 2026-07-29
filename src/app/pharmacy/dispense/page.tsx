import { requireRole } from "@/lib/dal";
import { getPendingPrescriptionItems } from "@/lib/pharmacy";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PHARMACY_NAV } from "@/app/_nav";
import { DispenseForm } from "./dispense-form";

export default async function DispensePage() {
  const session = await requireRole(["PHARMACY"]);
  const items = await getPendingPrescriptionItems();

  return (
    <RoleShell role="PHARMACY" userName={session.user.name ?? "Pharmacy"} navItems={PHARMACY_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Pending prescriptions</h1>

        <Card>
          <CardHeader>
            <CardTitle>Awaiting dispense ({items.length})</CardTitle>
            <CardDescription>Stock is deducted first-expiry-first-out across batches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage / frequency</TableHead>
                  <TableHead>Prescribed by</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nothing waiting to be dispensed.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.prescription.consultation.patient.name}</TableCell>
                    <TableCell>
                      {item.medicineName}
                      {!item.medicineId && (
                        <Badge variant="outline" className="ml-2">
                          Not in catalog
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.dosage}, {item.frequency}
                      {item.durationDays ? `, ${item.durationDays}d` : ""}
                    </TableCell>
                    <TableCell>Dr. {item.prescription.consultation.doctor.user.name}</TableCell>
                    <TableCell>
                      <DispenseForm itemId={item.id} />
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
