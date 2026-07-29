"use client";

import { useActionState, useState } from "react";
import { createWalkInPatientAction, type WalkInState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WalkInForm() {
  const [state, action, pending] = useActionState<WalkInState, FormData>(
    createWalkInPatientAction,
    undefined
  );
  const [confirmNew, setConfirmNew] = useState(false);
  const values = state?.values;

  if (state?.duplicates && state.duplicates.length > 0 && !confirmNew) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">This may already be an existing patient:</p>
          <ul className="mt-2 space-y-1">
            {state.duplicates.map((d) => (
              <li key={d.id}>
                {d.name} &middot; DOB {d.dob} &middot; MRN {d.mrn}{" "}
                <a href={`/front-desk/patients/${d.id}`} className="underline underline-offset-4">
                  View profile
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="secondary" onClick={() => setConfirmNew(true)}>
          This is a different person, register anyway
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {confirmNew && <input type="hidden" name="confirmNew" value="true" />}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required defaultValue={values?.name} />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" name="dob" type="date" required defaultValue={values?.dob} />
          {state?.errors?.dob && <p className="text-sm text-destructive">{state.errors.dob[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input id="gender" name="gender" required defaultValue={values?.gender} />
          {state?.errors?.gender && <p className="text-sm text-destructive">{state.errors.gender[0]}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={values?.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={values?.address} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Registering..." : "Register patient"}
      </Button>
    </form>
  );
}
