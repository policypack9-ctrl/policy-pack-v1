import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { updateUserDisplayName } from "@/lib/auth-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name must be at least 2 characters long."),
});

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please log in to update your profile." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const parseResult = profileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { displayName } = parseResult.data;

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
