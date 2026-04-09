import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { PremiumButton } from "@/components/ui/premium-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="glass-panel w-full max-w-md rounded-[32px] p-8 sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/76">
          <ShieldCheck className="size-4 text-teal-200" />
          Login Placeholder
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] text-white">
          Auth screen is ready for the next pass.
        </h1>
        <p className="mt-4 text-base leading-7 text-white/68">
          The landing page navigation now points to a real route instead of a
          dead end. If you want, I can build the full premium auth experience
          next.
        </p>

        <div className="mt-8">
          <PremiumButton render={<Link href="/" />} nativeButton={false}>
            Back to Landing Page
          </PremiumButton>
        </div>
      </div>
    </main>
  );
}
