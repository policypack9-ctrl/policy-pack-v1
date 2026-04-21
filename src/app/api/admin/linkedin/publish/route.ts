import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { isAdminEmailAllowed } from "@/lib/auth-env";
import {
  createLinkedInTextPost,
  isLinkedInConfigured,
  LINKEDIN_ACCESS_TOKEN_COOKIE,
  LINKEDIN_MEMBER_SUB_COOKIE,
} from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PublishBody = {
  content?: string;
};

export async function POST(request: Request) {
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

  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get(LINKEDIN_ACCESS_TOKEN_COOKIE)?.value?.trim() ?? "";
  const memberSub =
    cookieStore.get(LINKEDIN_MEMBER_SUB_COOKIE)?.value?.trim() ?? "";

  if (!accessToken || !memberSub) {
    return NextResponse.json(
      { error: "LinkedIn profile is not connected." },
      { status: 409 },
    );
  }

  let body: PublishBody;

  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = body.content?.trim() ?? "";

  if (!content) {
    return NextResponse.json({ error: "Post content is required." }, { status: 400 });
  }

  try {
    const result = await createLinkedInTextPost(accessToken, memberSub, content);

    return NextResponse.json({
      ok: true,
      postId: result.postId,
      feedUrl: result.feedUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "linkedin_publish_failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
