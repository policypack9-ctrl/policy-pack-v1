import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import {
  exchangeLinkedInCodeForAccessToken,
  fetchLinkedInUserInfo,
  LINKEDIN_ACCESS_TOKEN_COOKIE,
  LINKEDIN_EXPIRES_AT_COOKIE,
  LINKEDIN_MEMBER_NAME_COOKIE,
  LINKEDIN_MEMBER_SUB_COOKIE,
  LINKEDIN_OAUTH_STATE_COOKIE,
} from "@/lib/linkedin";
import { saveLinkedInConnection } from "@/lib/linkedin-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  const sessionEmail = session?.user?.email ?? "";
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const oauthError = url.searchParams.get("error")?.trim() ?? "";

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(LINKEDIN_OAUTH_STATE_COOKIE)?.value ?? "";

  cookieStore.delete(LINKEDIN_OAUTH_STATE_COOKIE);

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/admin/linkedin?error=${encodeURIComponent(oauthError)}`, request.url),
    );
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/admin/linkedin?error=state_mismatch", request.url),
    );
  }

  try {
    const token = await exchangeLinkedInCodeForAccessToken(code);
    const userInfo = await fetchLinkedInUserInfo(token.access_token);
    const expiresAt = Date.now() + token.expires_in * 1000;

    await saveLinkedInConnection({
      accessToken: token.access_token,
      expiresAt,
      memberSub: userInfo.sub,
      memberName:
        userInfo.name?.trim() || userInfo.given_name?.trim() || "LinkedIn member",
      updatedBy:
        session?.user?.id && isAdminEmailAllowed(sessionEmail) ? sessionEmail : null,
      connectedAt: new Date().toISOString(),
    });

    cookieStore.set(LINKEDIN_ACCESS_TOKEN_COOKIE, token.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in,
    });
    cookieStore.set(LINKEDIN_EXPIRES_AT_COOKIE, String(expiresAt), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in,
    });
    cookieStore.set(LINKEDIN_MEMBER_SUB_COOKIE, userInfo.sub, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: token.expires_in,
    });
    cookieStore.set(
      LINKEDIN_MEMBER_NAME_COOKIE,
      userInfo.name?.trim() || userInfo.given_name?.trim() || "LinkedIn member",
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: token.expires_in,
      },
    );

    return NextResponse.redirect(new URL("/admin/linkedin?connected=1", request.url));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "linkedin_callback_failed";

    return NextResponse.redirect(
      new URL(`/admin/linkedin?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
