import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center dark:bg-black">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Hospital Management System</h1>
        <p className="text-muted-foreground">Sign in to your role-specific dashboard.</p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/login">Sign in</Link>} />
        <Button variant="outline" render={<Link href="/register">Register as a patient</Link>} />
      </div>
    </div>
  );
}
