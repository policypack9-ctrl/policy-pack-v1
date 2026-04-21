import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAuthBaseUrl, isAdminEmailAllowed } from "@/lib/auth-env";
import {
  getLinkedInConfig,
  isLinkedInConfigured,
} from "@/lib/linkedin";
import { getStoredLinkedInConnection } from "@/lib/linkedin-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !isAdminEmailAllowed(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const config = getLinkedInConfig();
  const storedConnection = await getStoredLinkedInConnection();
  const memberSub = storedConnection?.memberSub ?? "";
  const memberName = storedConnection?.memberName ?? "";
  const expiresAt = storedConnection?.expiresAt ?? 0;

  return NextResponse.json({
    configured: isLinkedInConfigured(),
    connected: Boolean(storedConnection?.accessToken && memberSub),
    memberSub,
    memberName,
    expiresAt: expiresAt || null,
    expiresAtIso: expiresAt ? new Date(expiresAt).toISOString() : null,
    connectUrl: `${getAuthBaseUrl()}/api/admin/linkedin/connect`,
    redirectUri: config.redirectUri || null,
  });
}
