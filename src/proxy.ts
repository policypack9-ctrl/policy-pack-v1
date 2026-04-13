import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { PRIMARY_DOMAIN, WWW_DOMAIN } from "@/lib/site-config";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/profile", "/admin"];

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

  // 2. Auth guard — JWT-only, no DB call
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "",
    });
    // Valid token must have a userId (cleared tokens mean deleted user)
    if (!token?.userId && !token?.sub) {
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
