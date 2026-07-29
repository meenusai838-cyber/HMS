"use client";

import { useActionState } from "react";
import { admitPatientAction, type AdmitState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PatientOption = { id: string; name: string; mrn: string };
type DoctorOption = { id: string; name: string; specialty: string };
type BedOption = { id: string; label: string };

export function AdmitForm({
  patients,
  doctors,
  beds,
}: {
  patients: PatientOption[];
  doctors: DoctorOption[];
  beds: BedOption[];
}) {
  const [state, action, pending] = useActionState<AdmitState, FormData>(admitPatientAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label>Patient</Label>
        <Select name="patientId">
          <SelectTrigger className="w-full">
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
      <div className="space-y-1">
        <Label>Admitting doctor</Label>
        <Select name="admittingDoctorId">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} — {d.specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Bed</Label>
        <Select name="bedId">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an available bed" />
          </SelectTrigger>
          <SelectContent>
            {beds.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {beds.length === 0 && (
          <p className="text-sm text-muted-foreground">No beds are currently available.</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="reason">Reason for admission</Label>
        <Textarea id="reason" name="reason" rows={3} required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || beds.length === 0}>
        {pending ? "Admitting..." : "Admit patient"}
      </Button>
    </form>
  );
}
