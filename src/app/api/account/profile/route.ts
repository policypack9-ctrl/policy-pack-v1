import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateUserDisplayName } from "@/lib/auth-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please log in to update your profile." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      displayName?: unknown;
    };
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";

    if (displayName.length < 2) {
      return NextResponse.json(
        { error: "Display name must be at least 2 characters long." },
        { status: 400 },
      );
    }

    const profile = await updateUserDisplayName(session.user.id, displayName);

    return NextResponse.json({
      ok: true,
      profile: {
        name: profile?.name ?? displayName,
        email: profile?.email ?? session.user.email ?? null,
      },
      message: "Your profile has been updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update your profile right now.",
      },
      { status: 500 },
    );
  }
}
