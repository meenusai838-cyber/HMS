import { requireRole } from "@/lib/dal";
import { getBillDetail, getBillTotals } from "@/lib/billing";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BILLING_NAV } from "@/app/_nav";
import { AddItemForm } from "./add-item-form";
import { PaymentForm } from "./payment-form";
import { ClaimForm } from "./claim-form";
import { ClaimUpdateForm } from "./claim-update-form";
import { removeBillItemAction } from "./actions";

export default async function BillDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["BILLING", "ADMIN"]);
  const { id } = await props.params;

  const bill = await getBillDetail(id);

  if (!bill) {
    return (
      <RoleShell role="BILLING" userName={session.user.name ?? "Billing"} navItems={BILLING_NAV}>
        <p className="text-sm text-muted-foreground">Bill not found.</p>
      </RoleShell>
    );
  }

  const { total, paid, balance } = getBillTotals(bill);
  const isOpen = bill.status === "OPEN";

  return (
    <RoleShell role="BILLING" userName={session.user.name ?? "Billing"} navItems={BILLING_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{bill.patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              MRN {bill.patient.mrn} &middot; Bill opened {bill.createdAt.toLocaleString()}
              {bill.consultation && <> &middot; Consultation with Dr. {bill.consultation.doctor.user.name}</>}
              {bill.admission && <> &middot; Admission charges</>}
            </p>
          </div>
          <Badge variant={bill.status === "OPEN" ? "outline" : bill.status === "PAID" ? "secondary" : "destructive"}>
            {bill.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">${total.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">${paid.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Balance</CardDescription>
              <CardTitle className="text-2xl">${balance.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Amount</TableHead>
                  {isOpen && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isOpen ? 6 : 5} className="text-center text-muted-foreground">
                      No items yet.
                    </TableCell>
                  </TableRow>
                )}
                {bill.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.category.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    {isOpen && (
                      <TableCell>
                        <form action={removeBillItemAction}>
                          <input type="hidden" name="billId" value={bill.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <Button size="sm" variant="outline" type="submit">
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isOpen && <AddItemForm billId={bill.id} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payments recorded.
                    </TableCell>
                  </TableRow>
                )}
                {bill.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paidAt.toLocaleString()}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.reference ?? "—"}</TableCell>
                    <TableCell>${p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isOpen && balance > 0 && <PaymentForm billId={bill.id} balance={balance} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insurance claim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!bill.insuranceClaim && isOpen && <ClaimForm billId={bill.id} defaultAmount={balance} />}
            {!bill.insuranceClaim && !isOpen && (
              <p className="text-sm text-muted-foreground">No claim was filed for this bill.</p>
            )}
            {bill.insuranceClaim && (
              <div className="space-y-3 text-sm">
                <p>
                  {bill.insuranceClaim.insurerName} &middot; Policy {bill.insuranceClaim.policyNumber}
                </p>
                <p>
                  Claimed: ${bill.insuranceClaim.claimedAmount.toFixed(2)}
                  {bill.insuranceClaim.approvedAmount != null && (
                    <> &middot; Approved: ${bill.insuranceClaim.approvedAmount.toFixed(2)}</>
                  )}
                </p>
                <Badge
                  variant={
                    bill.insuranceClaim.status === "APPROVED"
                      ? "secondary"
                      : bill.insuranceClaim.status === "REJECTED"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {bill.insuranceClaim.status.replace("_", " ")}
                </Badge>
                {bill.insuranceClaim.notes && (
                  <p className="text-muted-foreground">{bill.insuranceClaim.notes}</p>
                )}
                {bill.insuranceClaim.status === "SUBMITTED" && (
                  <ClaimUpdateForm
                    billId={bill.id}
                    claimId={bill.insuranceClaim.id}
                    claimedAmount={bill.insuranceClaim.claimedAmount}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
