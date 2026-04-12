"use client";

import Link from "next/link";
import { LoaderCircle, LogOut, LayoutDashboard } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { PremiumButton } from "@/components/ui/premium-button";
import { buildAuthRedirectHref } from "@/lib/auth-routing";

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
      <div className="flex items-center gap-2">
        <Link
          href={buildAuthRedirectHref("login", "/dashboard")}
          className="inline-flex h-11 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Login
        </Link>
        <Link
          href={buildAuthRedirectHref("register", "/dashboard")}
          className="inline-flex h-11 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Register
        </Link>
        <PremiumButton
          render={<Link href={buildAuthRedirectHref("register", "/dashboard")} />}
          nativeButton={false}
          className="h-11 px-4 text-sm sm:px-5"
        >
          Get Started
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <PremiumButton
        render={<Link href="/dashboard" />}
        nativeButton={false}
        className="h-11 px-4 text-sm sm:px-5"
        icon={<LayoutDashboard className="size-4" />}
      >
        Go to Dashboard
      </PremiumButton>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-60"
      >
        {isSigningOut ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        Logout
      </button>
    </div>
  );
}
