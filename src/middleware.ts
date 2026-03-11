import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (user.role === "VOLUNTEER") {
    if (pathname.endsWith("/new") || pathname.includes("/edit")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chapters/:path*",
    "/projects/:path*",
    "/volunteers/:path*",
    "/partners/:path*",
  ],
};
