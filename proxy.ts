import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLE_HOME, roleHomePath } from "@/lib/roles";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);
const ROLE_PREFIXES = Object.values(ROLE_HOME);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isPublic = PUBLIC_PATHS.has(nextUrl.pathname);

  if (!session?.user) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const home = roleHomePath(session.user.role);

  if (isPublic) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  const matchedPrefix = ROLE_PREFIXES.find((prefix) => nextUrl.pathname.startsWith(prefix));
  if (matchedPrefix && matchedPrefix !== home) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
