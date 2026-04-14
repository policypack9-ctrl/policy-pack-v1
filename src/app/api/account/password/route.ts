import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { updateUserPassword } from "@/lib/auth-data";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Please complete all password fields."),
  newPassword: z.string().min(8, "Your new password must be at least 8 characters long."),
  confirmPassword: z.string().min(1, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Your new passwords do not match.",
  path: ["confirmPassword"],
});

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
    const body = await request.json();
    const parseResult = passwordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

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
