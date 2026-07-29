import { requireRole } from "@/lib/dal";
import { getAdmissionDetail, getAvailableBeds } from "@/lib/ward";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NURSE_NAV } from "@/app/_nav";
import { TransferForm } from "./transfer-form";
import { dischargePatientAction } from "./actions";

export default async function AdmissionDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["NURSE"]);
  const { id } = await props.params;

  const [admission, availableBeds] = await Promise.all([getAdmissionDetail(id), getAvailableBeds()]);

  if (!admission) {
    return (
      <RoleShell role="NURSE" userName={session.user.name ?? "Nurse"} navItems={NURSE_NAV}>
        <p className="text-sm text-muted-foreground">Admission not found.</p>
      </RoleShell>
    );
  }

  const currentAssignment = admission.assignments.find((a) => a.endedAt === null);

  return (
    <RoleShell role="NURSE" userName={session.user.name ?? "Nurse"} navItems={NURSE_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{admission.patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              MRN {admission.patient.mrn} &middot; Admitted {admission.admittedAt.toLocaleString()} by Dr.{" "}
              {admission.admittingDoctor.user.name}
            </p>
          </div>
          <Badge variant={admission.status === "ADMITTED" ? "destructive" : "secondary"}>
            {admission.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reason for admission</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{admission.reason}</CardContent>
        </Card>

        {admission.status === "ADMITTED" && currentAssignment && (
          <Card>
            <CardHeader>
              <CardTitle>
                Currently in {currentAssignment.bed.ward.name} — Bed {currentAssignment.bed.bedNumber}
              </CardTitle>
              <CardDescription>Transfer to a different bed or discharge the patient.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TransferForm
                admissionId={admission.id}
                beds={availableBeds.map((b) => ({ id: b.id, label: `${b.ward.name} — Bed ${b.bedNumber}` }))}
              />
              <form action={dischargePatientAction}>
                <input type="hidden" name="admissionId" value={admission.id} />
                <Button type="submit" variant="destructive">
                  Discharge patient
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bed history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {admission.assignments.map((a) => (
              <p key={a.id}>
                {a.bed.ward.name} — Bed {a.bed.bedNumber}: {a.startedAt.toLocaleString()} to{" "}
                {a.endedAt ? a.endedAt.toLocaleString() : "present"}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </RoleShell>
  );
}
