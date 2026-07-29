"use client";

import { useActionState } from "react";
import { updateClaimStatusAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
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

const STATUSES = ["SUBMITTED", "APPROVED", "PARTIALLY_APPROVED", "REJECTED"] as const;

export function ClaimUpdateForm({
  billId,
  claimId,
  claimedAmount,
}: {
  billId: string;
  claimId: string;
  claimedAmount: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateClaimStatusAction,
    undefined
  );

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="billId" value={billId} />
      <input type="hidden" name="claimId" value={claimId} />
      <div className="space-y-1">
        <Label>Status</Label>
        <Select name="status" defaultValue="APPROVED">
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="approvedAmount">Approved amount</Label>
        <Input
          id="approvedAmount"
          name="approvedAmount"
          type="number"
          min={0}
          step="0.01"
          defaultValue={claimedAmount.toFixed(2)}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={1} />
      </div>
      {state?.errors && (
        <p className="col-span-full text-sm text-destructive">
          {Object.values(state.errors).flat().join(" ")}
        </p>
      )}
      <div className="col-span-full">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Updating..." : "Update claim"}
        </Button>
      </div>
    </form>
  );
}
