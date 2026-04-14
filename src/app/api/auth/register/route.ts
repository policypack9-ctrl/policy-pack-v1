import { NextResponse } from "next/server";
import { z } from "zod";

import { createCredentialsUser, getSupabaseAuthHealth } from "@/lib/auth-data";
import { getSupabaseConfigStatus } from "@/lib/auth-env";
import { sendAdminNotification, sendWelcomeEmail } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "");
}

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Enter a valid email address.").transform(normalizeEmail),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function POST(request: Request) {
  // Apply a basic rate limit for the register endpoint
  const rateLimitResponse = rateLimit(request, "register", { limit: 5, windowMs: 60000 });
  if (rateLimitResponse) return rateLimitResponse;

  const configStatus = getSupabaseConfigStatus();

  if (!configStatus.isConfigured) {
    return NextResponse.json(
      {
        error:
          "Account sign-up is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  const authHealth = await getSupabaseAuthHealth();

  if (!authHealth.ok) {
    return NextResponse.json(
      {
        error:
          "Account sign-up is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const validated = parseResult.data;

    const result = await createCredentialsUser(validated);

    if (!result.ok) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const notificationResult = await sendAdminNotification({
      kind: "registration",
      subject: "New PolicyPack registration",
      summary:
        "A new account has been created on PolicyPack and is ready for follow-up.",
      details: [
        { label: "Name", value: result.profile?.name ?? validated.name },
        { label: "Email", value: result.profile?.email ?? validated.email },
        {
          label: "User ID",
          value: result.profile?.userId ?? "Not returned",
        },
        {
          label: "Created At",
          value: new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
        },
      ],
    });

    if (!notificationResult.ok) {
      console.error("Registration notification could not be delivered.");
    }

    const welcomeResult = await sendWelcomeEmail(
      result.profile?.email ?? validated.email,
      result.profile?.name ?? validated.name
    );

    if (!welcomeResult.ok) {
      console.error("Welcome email could not be delivered.");
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result.profile?.userId ?? null,
        email: result.profile?.email ?? validated.email,
        name: result.profile?.name ?? validated.name,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to create account.",
      },
      { status: 500 },
    );
  }
}
