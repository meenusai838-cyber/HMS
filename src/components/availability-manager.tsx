"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { getDoctorAvailability } from "@/lib/appointments";

export type AddBlockState = { errors?: Record<string, string[]>; error?: string } | undefined;

type Block = Awaited<ReturnType<typeof getDoctorAvailability>>[number];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS = DAY_NAMES.map((label, value) => ({ value: String(value), label }));

export function AvailabilityManager({
  blocks,
  addAction,
  removeAction,
}: {
  blocks: Block[];
  addAction: (prevState: AddBlockState, formData: FormData) => Promise<AddBlockState>;
  removeAction: (formData: FormData) => void | Promise<void>;
}) {
  const [state, formAction, pending] = useActionState<AddBlockState, FormData>(
    addAction,
    undefined
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Working hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Slot length</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No availability set yet — add a block below to start accepting bookings.
                  </TableCell>
                </TableRow>
              )}
              {blocks.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{DAY_NAMES[b.dayOfWeek]}</TableCell>
                  <TableCell>{b.startTime}</TableCell>
                  <TableCell>{b.endTime}</TableCell>
                  <TableCell>{b.slotMinutes} min</TableCell>
                  <TableCell>
                    <form action={removeAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button size="sm" variant="outline" type="submit">
                        Remove
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a block</CardTitle>
          <CardDescription>Blocks on the same day can&apos;t overlap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
            <div className="space-y-1">
              <Label>Day</Label>
              <Select name="dayOfWeek" defaultValue="1">
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" name="startTime" type="time" required defaultValue="09:00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" name="endTime" type="time" required defaultValue="13:00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slotMinutes">Slot length (min)</Label>
              <Input
                id="slotMinutes"
                name="slotMinutes"
                type="number"
                min={5}
                max={240}
                defaultValue={15}
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
                {pending ? "Adding..." : "Add block"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
