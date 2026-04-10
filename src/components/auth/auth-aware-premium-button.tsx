"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { PremiumButton } from "@/components/ui/premium-button";
import { loadStoredPolicySession } from "@/lib/db";
import {
  buildAuthRedirectHref,
  type AuthEntryRoute,
} from "@/lib/auth-routing";

type AuthAwarePremiumButtonProps = Omit<
  React.ComponentProps<typeof PremiumButton>,
  "render" | "nativeButton"
> & {
  authenticatedHref: string;
  unauthenticatedRoute?: AuthEntryRoute;
  callbackHref?: string;
  preferSavedWorkspaceHref?: string;
};

export function AuthAwarePremiumButton({
  authenticatedHref,
  unauthenticatedRoute = "register",
  callbackHref,
  preferSavedWorkspaceHref,
  children,
  ...props
}: AuthAwarePremiumButtonProps) {
  const { data: session } = useSession();
  const savedSession =
    typeof window === "undefined" ? null : loadStoredPolicySession();
  const resolvedAuthenticatedHref =
    session?.user && savedSession && preferSavedWorkspaceHref
      ? preferSavedWorkspaceHref
      : authenticatedHref;
  const href = session?.user
    ? resolvedAuthenticatedHref
    : buildAuthRedirectHref(
        unauthenticatedRoute,
        callbackHref ?? authenticatedHref,
      );

  return (
    <PremiumButton
      render={<Link href={href} />}
      nativeButton={false}
      {...props}
    >
      {children}
    </PremiumButton>
  );
}
