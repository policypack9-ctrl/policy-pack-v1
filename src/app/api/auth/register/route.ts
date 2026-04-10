import { NextResponse } from "next/server";

import { createCredentialsUser, getSupabaseAuthHealth } from "@/lib/auth-data";
import { getSupabaseConfigStatus } from "@/lib/auth-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateRegistrationInput(body: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }

  if (!email.includes("@") || email.length < 6) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  return { name, email, password };
}

export async function POST(request: Request) {
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
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
    };
    const validated = validateRegistrationInput(body);

    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const result = await createCredentialsUser(validated);

    if (!result.ok) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
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
