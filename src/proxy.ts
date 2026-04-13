import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { PRIMARY_DOMAIN, WWW_DOMAIN } from "@/lib/site-config";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/profile", "/admin"];

// These are always public — never redirect them
const PUBLIC_PREFIXES = ["/login", "/register", "/api", "/_next", "/favicon"];

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") ?? "";
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const isProductionHost = host === PRIMARY_DOMAIN || host === WWW_DOMAIN;

  // 1. Domain redirect (www → apex, http → https)
  if (isProductionHost) {
    const shouldRedirectToApex = host === WWW_DOMAIN;
    const shouldRedirectToHttps = forwardedProto !== "https";
    if (shouldRedirectToApex || shouldRedirectToHttps) {
      url.hostname = PRIMARY_DOMAIN;
      url.protocol = "https:";
      url.port = "";
      return NextResponse.redirect(url, 308);
    }
  }

  const pathname = request.nextUrl.pathname;

  // 2. Skip auth check for public routes to prevent redirect loops
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // 3. Auth guard for protected routes only
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
