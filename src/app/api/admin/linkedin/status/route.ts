import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { getAuthBaseUrl, isAdminEmailAllowed } from "@/lib/auth-env";
import {
  getLinkedInConfig,
  isLinkedInConfigured,
  LINKEDIN_ACCESS_TOKEN_COOKIE,
  LINKEDIN_EXPIRES_AT_COOKIE,
  LINKEDIN_MEMBER_NAME_COOKIE,
  LINKEDIN_MEMBER_SUB_COOKIE,
} from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !isAdminEmailAllowed(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const config = getLinkedInConfig();
  const cookieStore = await cookies();
  const memberSub = cookieStore.get(LINKEDIN_MEMBER_SUB_COOKIE)?.value ?? "";
  const memberName = cookieStore.get(LINKEDIN_MEMBER_NAME_COOKIE)?.value ?? "";
  const expiresAtRaw = cookieStore.get(LINKEDIN_EXPIRES_AT_COOKIE)?.value ?? "";
  const expiresAt = Number(expiresAtRaw || "0");

  return NextResponse.json({
    configured: isLinkedInConfigured(),
    connected: Boolean(
      cookieStore.get(LINKEDIN_ACCESS_TOKEN_COOKIE)?.value && memberSub,
    ),
    memberSub,
    memberName,
    expiresAt: expiresAt || null,
    expiresAtIso: expiresAt ? new Date(expiresAt).toISOString() : null,
    connectUrl: `${getAuthBaseUrl()}/api/admin/linkedin/connect`,
    redirectUri: config.redirectUri || null,
  });
}

