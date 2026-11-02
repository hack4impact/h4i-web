import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Runs on the Edge runtime, so it cannot query the database. It only checks
 * that a session cookie exists; requireSession() in (protected)/layout.tsx
 * and the guards in server actions and route handlers are the real check.
 */
export default function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const { pathname, search } = request.nextUrl;

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    if (pathname !== "/") {
      signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Lets requireSession build a callbackUrl when the cookie is stale.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Every page except sign-in. /api/* handlers return 401 themselves.
  matcher: [
    "/((?!sign-in|api/|_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js|map|txt|xml)$).*)",
  ],
};
