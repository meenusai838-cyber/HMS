"use client";

import { useActionState } from "react";
import { scheduleSurgeryAction, type ScheduleState } from "./actions";
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

type Option = { id: string; label: string };

export function ScheduleForm({
  theatres,
  patients,
  surgeons,
}: {
  theatres: Option[];
  patients: Option[];
  surgeons: Option[];
}) {
  const [state, action, pending] = useActionState<ScheduleState, FormData>(
    scheduleSurgeryAction,
    undefined
  );

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label>Theatre</Label>
        <Select name="theatreId">
          <SelectTrigger>
            <SelectValue placeholder="Select theatre" />
          </SelectTrigger>
          <SelectContent>
            {theatres.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Patient</Label>
        <Select name="patientId">
          <SelectTrigger>
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Surgeon</Label>
        <Select name="surgeonId">
          <SelectTrigger>
            <SelectValue placeholder="Select surgeon" />
          </SelectTrigger>
          <SelectContent>
            {surgeons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="procedureName">Procedure</Label>
        <Input id="procedureName" name="procedureName" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="startTime">Start time</Label>
        <Input id="startTime" name="startTime" type="time" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="durationMinutes">Duration (minutes)</Label>
        <Input id="durationMinutes" name="durationMinutes" type="number" min={15} defaultValue={60} />
      </div>
      <div className="col-span-2 space-y-1 sm:col-span-3">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" />
      </div>
      {state?.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={pending}>
          {pending ? "Scheduling..." : "Schedule surgery"}
        </Button>
      </div>
    </form>
  );
}
