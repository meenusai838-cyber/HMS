"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, undefined);
  const [confirmNew, setConfirmNew] = useState(false);
  const values = state?.values;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Patient registration</CardTitle>
        <CardDescription>Create your account to book appointments and view your records.</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.duplicates && state.duplicates.length > 0 && !confirmNew ? (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-medium">We found an existing record that may be you:</p>
              <ul className="mt-2 space-y-1">
                {state.duplicates.map((d) => (
                  <li key={d.id}>
                    {d.name} &middot; DOB {d.dob} &middot; MRN {d.mrn}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                If one of these is you, please sign in or contact the front desk to link your
                account instead of creating a duplicate record.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
              >
                Go to sign in
              </Link>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmNew(true)}>
                This is a different person
              </Button>
            </div>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            {confirmNew && <input type="hidden" name="confirmNew" value="true" />}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required defaultValue={values?.name} />
              {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required defaultValue={values?.email} />
              {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
              {state?.errors?.password && (
                <p className="text-sm text-destructive">{state.errors.password[0]}</p>
              )}
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
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
