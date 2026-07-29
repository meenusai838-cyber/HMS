import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getOrCreateConsultation } from "@/lib/consultations";
import { startConsultation } from "@/lib/queue";
import { getLabOrdersForConsultation } from "@/lib/lab";
import { RoleShell } from "@/components/role-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCTOR_NAV } from "@/app/_nav";
import {
  saveNotesAction,
  removePrescriptionItemAction,
  orderLabTestAction,
  completeConsultationAction,
} from "./actions";
import { PrescriptionForm } from "./prescription-form";

export default async function ConsultationPage(props: { params: Promise<{ appointmentId: string }> }) {
  const session = await requireRole(["DOCTOR"]);
  const { appointmentId } = await props.params;

  const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id } });

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { include: { allergies: true } } },
  });

  if (!doctorProfile || !appointment || appointment.doctorId !== doctorProfile.id) {
    return (
      <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
        <p className="text-sm text-muted-foreground">
          This appointment doesn&apos;t belong to you, or can&apos;t be found.
        </p>
      </RoleShell>
    );
  }

  if (appointment.queueStatus === "WAITING") {
    await startConsultation(appointmentId);
  }

  const consultation = await getOrCreateConsultation(appointmentId);
  const [prescription, medicines, labTests, labOrders] = await Promise.all([
    prisma.prescription.findUnique({
      where: { consultationId: consultation.id },
      include: { items: true },
    }),
    prisma.medicine.findMany({ orderBy: { name: "asc" } }),
    prisma.labTest.findMany({ orderBy: { name: "asc" } }),
    getLabOrdersForConsultation(consultation.id),
  ]);

  return (
    <RoleShell role="DOCTOR" userName={session.user.name ?? "Doctor"} navItems={DOCTOR_NAV}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Consultation — {appointment.patient.name}</h1>
            <p className="text-sm text-muted-foreground">
              MRN {appointment.patient.mrn} &middot; DOB {appointment.patient.dob.toISOString().slice(0, 10)}
              {appointment.tokenNumber && <> &middot; Token #{appointment.tokenNumber}</>}
            </p>
          </div>
          <Button render={<Link href={`/doctor/patients/${appointment.patientId}`}>Full patient record</Link>} variant="outline" />
        </div>

        <Card className="border-amber-300 dark:border-amber-900">
          <CardHeader>
            <CardTitle>Allergies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {appointment.patient.allergies.length === 0 && (
              <p className="text-sm text-muted-foreground">No known allergies recorded.</p>
            )}
            {appointment.patient.allergies.map((a) => (
              <Badge key={a.id} variant={a.severity === "SEVERE" ? "destructive" : "secondary"}>
                {a.substance} ({a.severity.toLowerCase()})
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Symptoms, diagnosis &amp; treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveNotesAction} className="space-y-4">
              <input type="hidden" name="appointmentId" value={appointmentId} />
              <input type="hidden" name="consultationId" value={consultation.id} />
              <div className="space-y-1">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea id="symptoms" name="symptoms" defaultValue={consultation.symptoms ?? ""} rows={2} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea id="diagnosis" name="diagnosis" defaultValue={consultation.diagnosis ?? ""} rows={2} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="treatmentNotes">Treatment plan / notes</Label>
                <Textarea
                  id="treatmentNotes"
                  name="treatmentNotes"
                  defaultValue={consultation.treatmentNotes ?? ""}
                  rows={3}
                />
              </div>
              <Button type="submit" variant="outline">
                Save notes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescription</CardTitle>
            <CardDescription>
              Allergy and drug-interaction warnings appear automatically when you add a medicine.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(prescription?.items.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No medicines prescribed yet.</p>
              )}
              {prescription?.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>
                    <span className="font-medium">{item.medicineName}</span> — {item.dosage}, {item.frequency}
                    {item.durationDays ? `, ${item.durationDays} day(s)` : ""}
                    {item.instructions ? ` (${item.instructions})` : ""}
                  </span>
                  <form action={removePrescriptionItemAction}>
                    <input type="hidden" name="appointmentId" value={appointmentId} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button size="sm" variant="outline" type="submit">
                      Remove
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            <PrescriptionForm
              appointmentId={appointmentId}
              consultationId={consultation.id}
              medicines={medicines}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lab tests</CardTitle>
            <CardDescription>Orders appear on the lab team&apos;s queue immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {labOrders.length === 0 && (
                <p className="text-sm text-muted-foreground">No tests ordered yet.</p>
              )}
              {labOrders.map((o) => (
                <div key={o.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{o.testName}</span>
                    <Badge variant={o.status === "COMPLETED" ? "secondary" : "outline"}>
                      {o.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {o.status === "COMPLETED" && (
                    <div className="mt-1 space-y-1 text-muted-foreground">
                      {o.resultSummary && <p>{o.resultSummary}</p>}
                      {o.reportStoredName && (
                        <a
                          href={`/api/files/lab-reports/${o.reportStoredName}`}
                          className="underline underline-offset-4"
                        >
                          Download report{o.reportFileName ? ` (${o.reportFileName})` : ""}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form action={orderLabTestAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input type="hidden" name="appointmentId" value={appointmentId} />
              <input type="hidden" name="consultationId" value={consultation.id} />
              <div className="space-y-1">
                <Label htmlFor="testId">From catalog (optional)</Label>
                <Select name="testId">
                  <SelectTrigger id="testId">
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    {labTests.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="testName">Test name</Label>
                <Input id="testName" name="testName" required placeholder="e.g. Complete Blood Count" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="labNotes">Notes</Label>
                <Input id="labNotes" name="notes" placeholder="Clinical notes for lab" />
              </div>
              <div className="col-span-full">
                <Button type="submit" variant="outline">
                  Order test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <form action={completeConsultationAction}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <Button type="submit">Complete consultation</Button>
        </form>
      </div>
    </RoleShell>
  );
}
