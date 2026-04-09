import { NextResponse } from "next/server";

import { createCredentialsUser } from "@/lib/auth-data";
import { isSupabaseConfigured } from "@/lib/auth-env";

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
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured for registration yet." },
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
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create account.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

