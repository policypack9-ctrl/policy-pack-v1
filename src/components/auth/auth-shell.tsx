import Link from "next/link";
import { Scale, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footerLabel: string;
  footerHref: string;
  footerAction: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footerLabel,
  footerHref,
  footerAction,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.85fr)]">
        <section className="soft-panel hidden rounded-[36px] p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-100/76">
              <ShieldCheck className="size-4 text-teal-200" />
              {eyebrow}
            </div>

            <div className="mt-10 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
                <Scale className="size-5" />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                  PolicyPack
                </p>
                <p className="text-sm text-white/48">
                  Clear, trustworthy legal coverage for modern SaaS teams.
                </p>
              </div>
            </div>

            <h1 className="mt-12 max-w-xl text-5xl font-semibold tracking-[-0.06em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
              {description}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              "Sign in with Google or email",
              "Your documents stay saved to your account",
              "Secure downloads when you're ready to upgrade",
              "One workspace for every policy and update",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-sm leading-6 text-white/66"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[36px] p-6 sm:p-8 lg:p-10">
          {children}

          <div className="mt-8 border-t border-white/[0.08] pt-6 text-sm text-white/52">
            {footerLabel}{" "}
            <Link
              href={footerHref}
              className="font-medium text-teal-200 transition-colors hover:text-white"
            >
              {footerAction}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
