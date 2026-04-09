import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LegalDocumentRenderer } from "@/components/legal/legal-document-renderer";
import { demoOnboardingAnswers } from "@/lib/policy-engine";
import { generatePolicyDocument } from "@/lib/policy-generator";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const generated = await generatePolicyDocument({
    documentType: "privacy-policy",
    answers: demoOnboardingAnswers,
  });

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
              PolicyPack Legal
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              This page is generated through the same PolicyPack drafting pipeline used
              for customer documents.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/36">
              Provider: {generated.provider} | Model: {generated.model}
            </p>
          </div>

          <LegalDocumentRenderer
            markdown={generated.markdown}
            className="legal-doc prose-invert mt-8 text-white/78"
          />
        </section>
      </div>
    </main>
  );
}
