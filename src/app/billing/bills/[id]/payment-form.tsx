"use client";

import { useActionState } from "react";
import { recordPaymentAction, type FormState } from "./actions";
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

const METHODS = ["CASH", "CARD", "ONLINE", "INSURANCE"] as const;

export function PaymentForm({ billId, balance }: { billId: string; balance: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordPaymentAction, undefined);

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="billId" value={billId} />
      <div className="space-y-1">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={0.01}
          step="0.01"
          max={balance}
          defaultValue={balance.toFixed(2)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Method</Label>
        <Select name="method" defaultValue="CASH">
          <SelectTrigger>
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" name="reference" placeholder="Optional" />
      </div>
      {state?.errors && (
        <p className="col-span-full text-sm text-destructive">
          {Object.values(state.errors).flat().join(" ")}
        </p>
      )}
      {state?.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
      <div className="col-span-full">
        <Button type="submit" size="sm" disabled={pending || balance <= 0}>
          {pending ? "Recording..." : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
