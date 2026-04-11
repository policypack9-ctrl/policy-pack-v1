"use client";

import Link from "next/link";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";

type LoginFormProps = {
  callbackUrl: string;
  initialError?: string;
  showGoogle?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value
    .trim()
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "");
}

export function LoginForm({
  callbackUrl,
  initialError,
  showGoogle = true,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedEmail = normalizeEmail(email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/76">
        <LockKeyhole className="size-4 text-teal-200" />
        Login
      </div>

      <h2 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-white">
        Welcome back.
      </h2>
      <p className="mt-4 text-base leading-7 text-white/62">
        Sign in with your email and password, or continue with Google to open your
        documents and personal workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
            Email
          </span>
          <input
            type="text"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(normalizeEmail(event.target.value))}
            autoComplete="email"
            required
            className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
            placeholder="team@policypack.org"
          />
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
              Password
            </span>
            <Link
              href="/register"
              className="text-xs font-medium uppercase tracking-[0.18em] text-teal-200/76 transition-colors hover:text-white"
            >
              Need an account?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
            placeholder="••••••••"
          />
        </label>

        {error ? (
          <div className="rounded-[18px] border border-amber-300/14 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-50/90">
            {error}
          </div>
        ) : null}

        <PremiumButton
          type="submit"
          disabled={isSubmitting}
          className="w-full justify-center"
          icon={
            isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )
          }
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </PremiumButton>
      </form>

      {showGoogle ? (
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-xs uppercase tracking-[0.24em] text-white/34">
            Or continue with
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>
      ) : (
        <div className="mt-6 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/58">
          Google sign-in is temporarily unavailable. You can still use your email
          and password.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {showGoogle ? (
          <GoogleSignInButton
            callbackUrl={callbackUrl}
            className="w-full justify-center"
            label="Sign in with Google"
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/")}
          className="h-12 w-full rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-5 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
        >
          Back to Home
        </Button>
      </div>
    </>
  );
}
