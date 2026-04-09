import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LegalDocumentRenderer } from "@/components/legal/legal-document-renderer";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  markdown: string;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  markdown,
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to landing page
        </Link>

        <section className="soft-panel mt-6 rounded-[32px] p-6 sm:p-10">
          <div className="border-b border-white/[0.08] pb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              {description}
            </p>
          </div>

          <LegalDocumentRenderer
            markdown={markdown}
            className="legal-doc prose-invert mt-8 max-w-none text-white/78"
          />
        </section>
      </div>
    </main>
  );
}
