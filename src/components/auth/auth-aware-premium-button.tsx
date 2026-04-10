"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { PremiumButton } from "@/components/ui/premium-button";
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
};

export function AuthAwarePremiumButton({
  authenticatedHref,
  unauthenticatedRoute = "register",
  callbackHref,
  children,
  ...props
}: AuthAwarePremiumButtonProps) {
  const { data: session } = useSession();
  const href = session?.user
    ? authenticatedHref
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
