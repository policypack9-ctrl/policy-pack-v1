"use client";

import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { PremiumButton } from "@/components/ui/premium-button";

export function GoogleSignInButton({
  callbackUrl = "/dashboard",
  className,
  label = "Sign in with Google",
}: {
  callbackUrl?: string;
  className?: string;
  label?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await signIn("google", { redirectTo: callbackUrl });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <PremiumButton
      type="button"
      onClick={() => void handleClick()}
      disabled={isPending}
      className={className}
      icon={
        isPending ? <LoaderCircle className="size-4 animate-spin" /> : undefined
      }
    >
      {label}
    </PremiumButton>
  );
}
