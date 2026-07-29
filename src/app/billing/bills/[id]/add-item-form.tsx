"use client";

import { useActionState } from "react";
import { addBillItemAction, type FormState } from "./actions";
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

const CATEGORIES = ["CONSULTATION", "LAB_TEST", "MEDICINE", "ROOM", "OTHER"] as const;

export function AddItemForm({ billId }: { billId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addBillItemAction, undefined);

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
      <input type="hidden" name="billId" value={billId} />
      <div className="space-y-1">
        <Label>Category</Label>
        <Select name="category" defaultValue="OTHER">
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="quantity">Qty</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="unitPrice">Unit price</Label>
        <Input id="unitPrice" name="unitPrice" type="number" min={0} step="0.01" defaultValue={0} />
      </div>
      {state?.errors && (
        <p className="col-span-full text-sm text-destructive">
          {Object.values(state.errors).flat().join(" ")}
        </p>
      )}
      {state?.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
      <div className="col-span-full">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Adding..." : "Add item"}
        </Button>
      </div>
    </form>
  );
}
