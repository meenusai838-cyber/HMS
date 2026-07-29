"use client";

import { useActionState, useState } from "react";
import { createStaffAction, type StaffCreateState } from "./actions";
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
import { ROLE_LABEL } from "@/lib/roles";

const STAFF_ROLES = ["DOCTOR", "NURSE", "FRONT_DESK", "LAB", "PHARMACY", "BILLING", "ADMIN"] as const;

export function StaffForm() {
  const [state, action, pending] = useActionState<StaffCreateState, FormData>(
    createStaffAction,
    undefined
  );
  const [role, setRole] = useState<(typeof STAFF_ROLES)[number]>("DOCTOR");

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="role" value={role} />
      </div>
      {role === "DOCTOR" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Input id="specialty" name="specialty" required />
            {state?.errors?.specialty && (
              <p className="text-sm text-destructive">{state.errors.specialty[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" />
          </div>
        </>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Create staff account"}
      </Button>
    </form>
  );
}
