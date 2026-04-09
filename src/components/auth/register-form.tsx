"use client";

import { LoaderCircle, MailPlus, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PremiumButton } from "@/components/ui/premium-button";

type RegisterFormProps = {
  callbackUrl: string;
};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create account.");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (!result || result.error) {
        setError("Account created, but automatic login failed. Please log in.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
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
        <UserRound className="size-4 text-teal-200" />
        Register
      </div>

      <h2 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-white">
        Create your PolicyPack account.
      </h2>
      <p className="mt-4 text-base leading-7 text-white/62">
        Set up credentials for secure access, premium billing state, and document
        persistence across sessions.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
            Team name
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
            placeholder="PolicyPack Team"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
            placeholder="team@policypack.org"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
              placeholder="Minimum 8 characters"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-white/46">
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="soft-input h-12 w-full rounded-[18px] px-4 text-sm"
              placeholder="Repeat password"
            />
          </label>
        </div>

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
              <MailPlus className="size-4" />
            )
          }
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </PremiumButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs uppercase tracking-[0.24em] text-white/34">
          Or continue with
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <GoogleSignInButton
        callbackUrl={callbackUrl}
        className="w-full justify-center"
        label="Continue with Google"
      />
    </>
  );
}
