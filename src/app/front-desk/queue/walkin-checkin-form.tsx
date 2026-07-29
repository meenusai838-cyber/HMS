"use client";

import { useActionState } from "react";
import { walkInCheckInAction, type WalkInVisitState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientOption = { id: string; name: string; mrn: string };

export function WalkInCheckinForm({
  doctorId,
  patients,
}: {
  doctorId: string;
  patients: PatientOption[];
}) {
  const [state, action, pending] = useActionState<WalkInVisitState, FormData>(
    walkInCheckInAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="doctorId" value={doctorId} />
      <div className="space-y-1">
        <Select name="patientId">
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} &middot; {p.mrn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Checking in..." : "Walk-in check-in"}
      </Button>
    </form>
  );
}
