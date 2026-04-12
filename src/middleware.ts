import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { proxy } from "@/proxy";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/admin",
];

export async function middleware(request: NextRequest) {
  // 1. Domain redirect (www → apex, http → https)
  const proxyResponse = proxy(request);
  if (proxyResponse.status === 308) {
    return proxyResponse;
  }

  // 2. Auth guard for protected routes
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected) {
    const session = await auth();
    if (!session?.user?.id) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|api/).*)",
  ],
};
