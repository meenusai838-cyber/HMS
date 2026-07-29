"use client";

import { useActionState } from "react";
import { completeOrderAction, type CompleteOrderState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CompleteForm({ labOrderId }: { labOrderId: string }) {
  const [state, action, pending] = useActionState<CompleteOrderState, FormData>(
    completeOrderAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="labOrderId" value={labOrderId} />
      <div className="space-y-1">
        <Label htmlFor="resultSummary">Result summary</Label>
        <Textarea id="resultSummary" name="resultSummary" rows={4} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="report">Report file (PDF or image, optional)</Label>
        <input
          id="report"
          name="report"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="block w-full text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Complete order"}
      </Button>
    </form>
  );
}
