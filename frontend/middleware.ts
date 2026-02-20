import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_API = /^\/api\/(?!health)/;
const PROTECTED_PAGES = ["/dashboard", "/register", "/agents"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has("privy-id-token");

  // Protected API routes → 401 JSON
  if (PROTECTED_API.test(pathname) && !hasToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected pages → redirect to home
  if (PROTECTED_PAGES.some((p) => pathname.startsWith(p)) && !hasToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/register/:path*", "/agents", "/agents/:path*"],
};
