import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { getPatientVisitHistory } from "@/lib/consultations";

type Visit = Awaited<ReturnType<typeof getPatientVisitHistory>>[number];

export function VisitHistory({ visits }: { visits: Visit[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit history, prescriptions &amp; lab reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visits.length === 0 && <p className="text-sm text-muted-foreground">No past visits yet.</p>}
        {visits.map((v) => (
          <div key={v.id} className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {v.appointment.scheduledStart.toLocaleDateString()} — Dr. {v.appointment.doctor.user.name}
              </span>
              {v.diagnosis && <Badge variant="secondary">{v.diagnosis}</Badge>}
            </div>
            {v.symptoms && (
              <p>
                <span className="text-muted-foreground">Symptoms:</span> {v.symptoms}
              </p>
            )}
            {v.treatmentNotes && (
              <p>
                <span className="text-muted-foreground">Treatment:</span> {v.treatmentNotes}
              </p>
            )}
            {v.prescription && v.prescription.items.length > 0 && (
              <div>
                <p className="text-muted-foreground">Prescription:</p>
                <ul className="list-inside list-disc">
                  {v.prescription.items.map((item) => (
                    <li key={item.id}>
                      {item.medicineName} — {item.dosage}, {item.frequency}
                      {item.durationDays ? `, ${item.durationDays} day(s)` : ""}
                      {item.instructions ? ` (${item.instructions})` : ""}{" "}
                      <Badge variant={item.dispensedAt ? "secondary" : "outline"}>
                        {item.dispensedAt ? "Dispensed" : "Not yet dispensed"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {v.labOrders.length > 0 && (
              <div>
                <p className="text-muted-foreground">Lab tests:</p>
                <ul className="list-inside list-disc">
                  {v.labOrders.map((o) => (
                    <li key={o.id}>
                      {o.testName}{" "}
                      <Badge variant={o.status === "COMPLETED" ? "secondary" : "outline"}>
                        {o.status.replace("_", " ")}
                      </Badge>
                      {o.status === "COMPLETED" && o.resultSummary && <> — {o.resultSummary}</>}
                      {o.reportStoredName && (
                        <>
                          {" "}
                          <a
                            href={`/api/files/lab-reports/${o.reportStoredName}`}
                            className="underline underline-offset-4"
                          >
                            Download report
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
