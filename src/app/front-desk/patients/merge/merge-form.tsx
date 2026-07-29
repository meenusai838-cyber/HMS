"use client";

import { useActionState } from "react";
import { mergePatientsAction, type MergeState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientOption = { id: string; name: string; mrn: string; dob: string };

export function MergeForm({ patients }: { patients: PatientOption[] }) {
  const [state, action, pending] = useActionState<MergeState, FormData>(
    mergePatientsAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label>Surviving profile (kept)</Label>
        <Select name="survivorId">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} &middot; {p.mrn} &middot; {p.dob}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Duplicate profile (merged away)</Label>
        <Select name="duplicateId">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} &middot; {p.mrn} &middot; {p.dob}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Merging..." : "Merge profiles"}
      </Button>
    </form>
  );
}
