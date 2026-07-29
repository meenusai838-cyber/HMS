"use client";

import { useActionState } from "react";
import { addPrescriptionItemAction, type AddItemState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MedicineOption = { id: string; name: string; genericName: string | null };

export function PrescriptionForm({
  appointmentId,
  consultationId,
  medicines,
}: {
  appointmentId: string;
  consultationId: string;
  medicines: MedicineOption[];
}) {
  const [state, action, pending] = useActionState<AddItemState, FormData>(
    addPrescriptionItemAction,
    undefined
  );

  return (
    <div className="space-y-3">
      <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <input type="hidden" name="consultationId" value={consultationId} />

        <div className="space-y-1">
          <Label htmlFor="medicineId">Medicine</Label>
          <Select name="medicineId">
            <SelectTrigger id="medicineId">
              <SelectValue placeholder="From catalog (optional)" />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {m.genericName ? ` (${m.genericName})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="medicineName">Medicine name</Label>
          <Input id="medicineName" name="medicineName" required placeholder="e.g. Amoxicillin" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dosage">Dosage</Label>
          <Input id="dosage" name="dosage" required placeholder="e.g. 500mg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="frequency">Frequency</Label>
          <Input id="frequency" name="frequency" required placeholder="e.g. Twice daily" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="durationDays">Duration (days)</Label>
          <Input id="durationDays" name="durationDays" type="number" min={1} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="instructions">Instructions</Label>
          <Input id="instructions" name="instructions" placeholder="e.g. After food" />
        </div>
        <div className="col-span-full">
          <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add to prescription"}
          </Button>
        </div>
      </form>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state?.warnings && (state.warnings.allergy.length > 0 || state.warnings.interaction.length > 0) && (
        <div className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <p className="font-medium">Warning — review before dispensing:</p>
          <ul className="list-inside list-disc">
            {state.warnings.allergy.map((w, i) => (
              <li key={`a${i}`}>{w}</li>
            ))}
            {state.warnings.interaction.map((w, i) => (
              <li key={`i${i}`}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
