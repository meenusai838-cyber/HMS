import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getUnbilledConsultations, getUnbilledAdmissions, getOpenBills } from "@/lib/billing";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BILLING_NAV } from "@/app/_nav";
import { generateBillFromConsultationAction, generateBillFromAdmissionAction } from "./actions";

export default async function BillingPage() {
  const session = await requireRole(["BILLING", "ADMIN"]);

  const [consultations, admissions, openBills] = await Promise.all([
    getUnbilledConsultations(),
    getUnbilledAdmissions(),
    getOpenBills(),
  ]);

  return (
    <RoleShell role="BILLING" userName={session.user.name ?? "Billing"} navItems={BILLING_NAV}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Billing dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle>Completed consultations awaiting a bill ({consultations.length})</CardTitle>
            <CardDescription>Generates a bill for the consultation fee, completed lab tests, and dispensed medicines.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nothing waiting to be billed.
                    </TableCell>
                  </TableRow>
                )}
                {consultations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.patient.name} <span className="text-muted-foreground">({c.patient.mrn})</span>
                    </TableCell>
                    <TableCell>Dr. {c.doctor.user.name}</TableCell>
                    <TableCell>{c.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <form action={generateBillFromConsultationAction}>
                        <input type="hidden" name="consultationId" value={c.id} />
                        <Button size="sm" type="submit">
                          Generate bill
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discharged admissions awaiting a bill ({admissions.length})</CardTitle>
            <CardDescription>Generates a bill for the room/bed charges across the stay.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Discharged</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nothing waiting to be billed.
                    </TableCell>
                  </TableRow>
                )}
                {admissions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.patient.name} <span className="text-muted-foreground">({a.patient.mrn})</span>
                    </TableCell>
                    <TableCell>{a.dischargedAt?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>
                      <form action={generateBillFromAdmissionAction}>
                        <input type="hidden" name="admissionId" value={a.id} />
                        <Button size="sm" type="submit">
                          Generate bill
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open bills ({openBills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {openBills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No open bills.
                    </TableCell>
                  </TableRow>
                )}
                {openBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      {bill.patient.name} <span className="text-muted-foreground">({bill.patient.mrn})</span>
                    </TableCell>
                    <TableCell>${bill.total.toFixed(2)}</TableCell>
                    <TableCell>${bill.paid.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={bill.balance > 0 ? "destructive" : "secondary"}>
                        ${bill.balance.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" render={<Link href={`/billing/bills/${bill.id}`}>View</Link>} />
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
