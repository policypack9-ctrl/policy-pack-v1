import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { PRIMARY_DOMAIN, WWW_DOMAIN } from "@/lib/site-config";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") ?? "";
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const isProductionHost = host === PRIMARY_DOMAIN || host === WWW_DOMAIN;

  if (!isProductionHost) {
    return NextResponse.next();
  }

  const shouldRedirectToApex = host === WWW_DOMAIN;
  const shouldRedirectToHttps = forwardedProto !== "https";

  if (!shouldRedirectToApex && !shouldRedirectToHttps) {
    return NextResponse.next();
  }

  url.hostname = PRIMARY_DOMAIN;
  url.protocol = "https:";
  url.port = "";

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
