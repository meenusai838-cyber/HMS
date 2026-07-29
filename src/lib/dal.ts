import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { roleHomePath } from "@/lib/roles";

export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!allowed.includes(session.user.role)) {
    redirect(roleHomePath(session.user.role));
  }
  return session;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
