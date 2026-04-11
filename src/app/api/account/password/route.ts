import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateUserPassword } from "@/lib/auth-data";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const rateLimitResponse = rateLimit(request, "account_password", { limit: 5, windowMs: 60000 });
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please log in to update your password." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Please complete all password fields." },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Your new passwords do not match." },
        { status: 400 },
      );
    }

    await updateUserPassword({
      userId: session.user.id,
      currentPassword,
      nextPassword: newPassword,
    });

    return NextResponse.json({
      ok: true,
      message: "Your password has been updated.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update your password right now.",
      },
      { status: 500 },
    );
  }
}
