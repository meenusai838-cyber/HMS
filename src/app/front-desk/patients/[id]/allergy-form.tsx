"use client";

import { useActionState } from "react";
import { addAllergyAction, type AddAllergyState } from "./actions";
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

export function AllergyForm({ patientId }: { patientId: string }) {
  const [state, action, pending] = useActionState<AddAllergyState, FormData>(
    addAllergyAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="space-y-1">
        <Label htmlFor="substance">Substance</Label>
        <Input id="substance" name="substance" className="w-40" required />
        {state?.errors?.substance && (
          <p className="text-xs text-destructive">{state.errors.substance[0]}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="severity">Severity</Label>
        <Select name="severity" defaultValue="MODERATE">
          <SelectTrigger id="severity" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MILD">Mild</SelectItem>
            <SelectItem value="MODERATE">Moderate</SelectItem>
            <SelectItem value="SEVERE">Severe</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" className="w-48" />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Adding..." : "Add allergy"}
      </Button>
    </form>
  );
}
