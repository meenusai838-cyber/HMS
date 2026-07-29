"use client";

import { useActionState } from "react";
import { joinWaitlistAction, type BookState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WaitlistForm({ patientId, doctorId }: { patientId: string; doctorId: string }) {
  const [state, action, pending] = useActionState<BookState, FormData>(joinWaitlistAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="doctorId" value={doctorId} />
      <div className="space-y-1">
        <Label htmlFor="preferredDate">Preferred date</Label>
        <Input id="preferredDate" name="preferredDate" type="date" required className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wnotes">Notes</Label>
        <Input id="wnotes" name="notes" className="w-48" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Joining..." : "Join waitlist for this doctor"}
      </Button>
    </form>
  );
}
