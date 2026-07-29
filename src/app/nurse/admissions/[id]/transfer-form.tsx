"use client";

import { useActionState } from "react";
import { transferPatientAction, type TransferState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BedOption = { id: string; label: string };

export function TransferForm({ admissionId, beds }: { admissionId: string; beds: BedOption[] }) {
  const [state, action, pending] = useActionState<TransferState, FormData>(
    transferPatientAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="admissionId" value={admissionId} />
      <Select name="newBedId">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select new bed" />
        </SelectTrigger>
        <SelectContent>
          {beds.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" disabled={pending || beds.length === 0}>
        {pending ? "Transferring..." : "Transfer"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
