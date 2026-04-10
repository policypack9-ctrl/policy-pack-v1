"use client";

import Link from "next/link";
import { ChevronDown, FileStack, LoaderCircle, LogOut, Settings2, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";

export function NavbarAuthControls() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({ redirectTo: "/" });
    } finally {
      setIsSigningOut(false);
      setIsMenuOpen(false);
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
          href="/login?callbackUrl=/dashboard"
          className="inline-flex h-11 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Login
        </Link>
        <PremiumButton
          render={<Link href="/register?callbackUrl=/dashboard" />}
          nativeButton={false}
          className="h-11 px-4 text-sm sm:px-5"
        >
          Register
        </PremiumButton>
      </div>
    );
  }

  const userLabel =
    session.user.name?.trim() ||
    session.user.email?.split("@")[0] ||
    "Account";

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsMenuOpen((current) => !current)}
        className="h-11 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white/76 hover:bg-white/[0.05] hover:text-white"
      >
        <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-teal-200">
          <UserRound className="size-4" />
        </span>
        {userLabel}
        <ChevronDown className="size-4 text-white/46" />
      </Button>

      {isMenuOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 rounded-[24px] border border-white/[0.08] bg-[#111111] p-2 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <p className="text-sm font-medium text-white">{userLabel}</p>
            <p className="mt-1 truncate text-sm text-white/46">
              {session.user.email}
            </p>
          </div>

          <div className="mt-2 space-y-1">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-white/68 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <Settings2 className="size-4" />
              Settings
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-white/68 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <FileStack className="size-4" />
              My Documents
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm text-white/68 transition-colors hover:bg-white/[0.04] hover:text-white disabled:opacity-60"
            >
              {isSigningOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
