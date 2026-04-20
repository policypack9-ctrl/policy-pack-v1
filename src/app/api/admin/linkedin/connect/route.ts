import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import {
  buildLinkedInAuthorizationUrl,
  createLinkedInOAuthState,
  isLinkedInConfigured,
  LINKEDIN_OAUTH_STATE_COOKIE,
} from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";

  if (!session?.user?.id || !isAdminEmailAllowed(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!isLinkedInConfigured()) {
    return NextResponse.json(
      { error: "LinkedIn OAuth is not configured." },
      { status: 503 },
    );
  }

  const state = createLinkedInOAuthState();
  const cookieStore = await cookies();
  cookieStore.set(LINKEDIN_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(buildLinkedInAuthorizationUrl(state));
}

