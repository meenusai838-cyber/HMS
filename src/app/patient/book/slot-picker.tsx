"use client";

import { useActionState, useState } from "react";
import { bookMySlotAction, type BookState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SlotDTO = { start: string; end: string; available: boolean };

export function SlotPicker({
  slots,
  doctorId,
  date,
}: {
  slots: SlotDTO[];
  doctorId: string;
  date: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [state, action, pending] = useActionState<BookState, FormData>(bookMySlotAction, undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground">No availability configured for this day.</p>
        )}
        {slots.map((slot) => {
          const time = new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const isSelected = selected === slot.start;
          return (
            <button
              key={slot.start}
              type="button"
              disabled={!slot.available}
              onClick={() => setSelected(slot.start)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                !slot.available
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>

      {selected && (
        <form action={action} className="space-y-3 rounded-md border p-4">
          <input type="hidden" name="doctorId" value={doctorId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="startTime" value={new Date(selected).toTimeString().slice(0, 5)} />
          <input type="hidden" name="durationMinutes" value={15} />
          <p className="text-sm font-medium">Booking {new Date(selected).toLocaleString()}</p>
          <div className="space-y-1">
            <Label htmlFor="repeatWeeks">Repeat weekly for (weeks) — for ongoing treatment</Label>
            <Input id="repeatWeeks" name="repeatWeeks" type="number" min={1} max={12} defaultValue={1} className="w-24" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Reason for visit</Label>
            <Input id="notes" name="notes" />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Booking..." : "Confirm booking"}
          </Button>
        </form>
      )}
    </div>
  );
}
