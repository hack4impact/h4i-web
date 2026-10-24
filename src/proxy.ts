import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * First layer of route protection.
 *
 * This runs on the Edge runtime, before a matched request reaches a page, so
 * it CANNOT query the database — Prisma needs a TCP connection that the Edge
 * runtime does not provide. It therefore answers only one cheap question:
 * is there a session cookie at all?
 *
 * A forged or already-revoked cookie passes this check by design. The
 * authoritative check — does this session exist, has it expired, what role
 * does it carry — lives in (protected)/layout.tsx and in each server action,
 * which run on the Node runtime where Prisma works.
 *
 * Never make this the only check.
 */
export default function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);

    // Remember where they were headed so sign-in can send them back there
    // instead of dumping everyone on the dashboard. Only the path and query
    // are carried over, never a full URL, so this cannot be turned into an
    // open redirect to another site.
    const { pathname, search } = request.nextUrl;
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    return NextResponse.redirect(signInUrl);
  }

  // Forward the requested path so (protected)/layout.tsx can build its own
  // callbackUrl when the session turns out to be invalid or expired. Server
  // components cannot read the current URL on their own.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Both the bare path and its children are listed explicitly. "/settings"
  // alone was missing before, which left that page reachable while signed out.
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/settings",
    "/settings/:path*",
    "/chapters",
    "/chapters/:path*",
    "/projects",
    "/projects/:path*",
    "/volunteers",
    "/volunteers/:path*",
    "/partners",
    "/partners/:path*",
  ],
};
