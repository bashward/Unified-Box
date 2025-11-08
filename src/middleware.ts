import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasCookie = getSessionCookie(req);
  if (!hasCookie)
    return NextResponse.redirect(new URL("auth/sign-in", req.url));
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!api/|_next/|favicon.ico).*)",
    "/inbox",
    "/dashboard",
    "/settings",
  ],
};
