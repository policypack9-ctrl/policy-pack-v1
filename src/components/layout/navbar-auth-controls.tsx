"use client";

import Link from "next/link";
import { LayoutDashboard, LoaderCircle, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";

export function NavbarAuthControls() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({ redirectTo: "/" });
    } finally {
      setIsSigningOut(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white/60">
        <LoaderCircle className="size-4 animate-spin" />
        Checking session
      </div>
    );
  }

  if (!session?.user) {
    return (
      <GoogleSignInButton
        callbackUrl="/dashboard"
        className="h-11 px-4 text-sm sm:px-5"
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <LayoutDashboard className="size-4" />
        Dashboard
      </Link>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="h-11 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/66 hover:bg-white/[0.05] hover:text-white"
      >
        {isSigningOut ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        Sign out
      </Button>
    </div>
  );
}
