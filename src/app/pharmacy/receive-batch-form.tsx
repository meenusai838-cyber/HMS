"use client";

import { useActionState } from "react";
import { receiveBatchAction, type ReceiveBatchState } from "./actions";
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

type MedicineOption = { id: string; name: string };

export function ReceiveBatchForm({ medicines }: { medicines: MedicineOption[] }) {
  const [state, action, pending] = useActionState<ReceiveBatchState, FormData>(
    receiveBatchAction,
    undefined
  );

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="medicineId">Medicine</Label>
        <Select name="medicineId">
          <SelectTrigger id="medicineId">
            <SelectValue placeholder="Select medicine" />
          </SelectTrigger>
          <SelectContent>
            {medicines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="batchNumber">Batch number</Label>
        <Input id="batchNumber" name="batchNumber" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="expiryDate">Expiry date</Label>
        <Input id="expiryDate" name="expiryDate" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" name="quantity" type="number" min={1} required />
      </div>
      {state?.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Receive stock"}
        </Button>
      </div>
    </form>
  );
}
