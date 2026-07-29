"use client";

import { useActionState } from "react";
import { fileClaimAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClaimForm({ billId, defaultAmount }: { billId: string; defaultAmount: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(fileClaimAction, undefined);

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="billId" value={billId} />
      <div className="space-y-1">
        <Label htmlFor="insurerName">Insurer</Label>
        <Input id="insurerName" name="insurerName" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="policyNumber">Policy number</Label>
        <Input id="policyNumber" name="policyNumber" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="claimedAmount">Claimed amount</Label>
        <Input
          id="claimedAmount"
          name="claimedAmount"
          type="number"
          min={0.01}
          step="0.01"
          defaultValue={defaultAmount.toFixed(2)}
          required
        />
      </div>
      {state?.errors && (
        <p className="col-span-full text-sm text-destructive">
          {Object.values(state.errors).flat().join(" ")}
        </p>
      )}
      {state?.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
      <div className="col-span-full">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Filing..." : "File claim"}
        </Button>
      </div>
    </form>
  );
}
