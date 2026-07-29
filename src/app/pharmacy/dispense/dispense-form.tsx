"use client";

import { useActionState } from "react";
import { dispenseItemAction, type DispenseState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DispenseForm({ itemId }: { itemId: string }) {
  const [state, action, pending] = useActionState<DispenseState, FormData>(
    dispenseItemAction,
    undefined
  );

  return (
    <div className="space-y-1">
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="itemId" value={itemId} />
        <Input name="quantity" type="number" min={1} placeholder="Qty" className="w-20" required />
        <Button size="sm" type="submit" disabled={pending}>
          {pending ? "Dispensing..." : "Dispense"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
