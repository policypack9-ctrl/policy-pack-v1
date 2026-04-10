import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteUserAccount } from "@/lib/auth-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please log in to manage your account." },
      { status: 401 },
    );
  }

  try {
    await deleteUserAccount(session.user.id);

    return NextResponse.json({
      ok: true,
      message: "Your account has been deleted.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete your account right now.",
      },
      { status: 500 },
    );
  }
}
