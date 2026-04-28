import NextAuth from "next-auth";
import { authConfig } from "@/lib/authn.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const { pathname } = req.nextUrl;
  const { role } = req.auth.user;

  if (
    role === "VOLUNTEER" &&
    (pathname.endsWith("/new") || pathname.includes("/edit"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|sign-in|favicon.ico).*)"],
};
