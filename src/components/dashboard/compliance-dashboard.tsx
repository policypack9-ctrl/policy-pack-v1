"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Cookie,
  CreditCard,
  Download,
  Eye,
  FileText,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Save,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LegalDocumentModal } from "@/components/legal/legal-document-modal";
import { Button } from "@/components/ui/button";
import { GradientCard } from "@/components/ui/gradient-card";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  buildSavedPolicyAccount,
  clearGeneratedDocuments,
  loadGeneratedDocuments,
  loadPolicyAccount,
  loadStoredPolicySession,
  saveGeneratedDocument,
  savePolicyPackToAccount,
  saveStoredPolicySession,
  type SavedGeneratedDocument,
} from "@/lib/db";
import {
  buildComplianceSnapshot,
  demoOnboardingAnswers,
  formatDisplayDateTime,
  getProductName,
  type DashboardDocument,
  type StoredPolicySession,
} from "@/lib/policy-engine";

const documentIcons = {
  "privacy-policy": ShieldCheck,
  "terms-of-service": FileText,
  "cookie-policy": Cookie,
  "gdpr-addendum": Globe2,
} as const;

type ComplianceDashboardProps = {
  initialIsPremium?: boolean;
  initialPremiumUnlockedAt?: string | null;
  initialGeneratedDocuments?: SavedGeneratedDocument[];
  authenticatedEmail?: string | null;
};

function buildInitialDocumentCache(
  documents: SavedGeneratedDocument[] = [],
): Record<DashboardDocument["id"], SavedGeneratedDocument> {
  return documents.reduce(
    (cache, document) => ({
      ...cache,
      [document.id]: document,
    }),
    {} as Record<DashboardDocument["id"], SavedGeneratedDocument>,
  );
}

export function ComplianceDashboard({
  initialIsPremium = false,
  initialPremiumUnlockedAt = null,
  initialGeneratedDocuments = [],
  authenticatedEmail = null,
}: ComplianceDashboardProps) {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const auditTimeoutRef = useRef<number | null>(null);
  const [session, setSession] = useState<StoredPolicySession>(() => {
    const fallbackSession: StoredPolicySession = {
      answers: demoOnboardingAnswers,
      completedAt: new Date().toISOString(),
    };

    if (typeof window === "undefined") {
      return fallbackSession;
    }

    return (
      loadPolicyAccount()?.session ?? loadStoredPolicySession() ?? fallbackSession
    );
  });
  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [premiumUnlockedAt, setPremiumUnlockedAt] = useState<string | null>(
    initialPremiumUnlockedAt,
  );
  const [documentCache, setDocumentCache] = useState<
    Record<DashboardDocument["id"], SavedGeneratedDocument>
  >(() => {
    const serverCache = buildInitialDocumentCache(initialGeneratedDocuments);

    if (typeof window === "undefined") {
      return serverCache;
    }

    return {
      ...serverCache,
      ...loadGeneratedDocuments(),
    };
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveLabel, setSaveLabel] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "Local fallback active";
    }

    const account = loadPolicyAccount();
    return account
      ? `Saved locally at ${formatDisplayDateTime(account.lastSavedAt)}`
      : "Workspace snapshot not saved yet";
  });
  const [activeDocumentId, setActiveDocumentId] =
    useState<DashboardDocument["id"]>("gdpr-addendum");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);

  useEffect(() => {
    return () => {
      if (auditTimeoutRef.current) {
        window.clearTimeout(auditTimeoutRef.current);
      }
    };
  }, []);

  const snapshot = buildComplianceSnapshot(session.answers, session.completedAt);
  const productName = getProductName(session.answers);
  const activeDocument =
    snapshot.documents.find((document) => document.id === activeDocumentId) ??
    snapshot.documents[0];
  const activeGeneratedDocument = documentCache[activeDocument.id];

  async function persistToAccount(nextCompletedAt = new Date().toISOString()) {
    const nextSession: StoredPolicySession = {
      answers: session.answers,
      completedAt: nextCompletedAt,
    };

    saveStoredPolicySession(nextSession);
    const result = savePolicyPackToAccount(
      buildSavedPolicyAccount(nextSession.answers, nextSession.completedAt),
    );
    clearGeneratedDocuments();
    setDocumentCache({} as Record<DashboardDocument["id"], SavedGeneratedDocument>);

    setSession(nextSession);
    setSaveLabel(
      result.mode === "local-storage"
        ? `Saved locally at ${formatDisplayDateTime(result.savedAt)}`
        : `Database ready at ${formatDisplayDateTime(result.savedAt)}`,
    );
  }

  async function saveToAccount() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await persistToAccount();
    } finally {
      setIsSaving(false);
    }
  }

  function runAudit() {
    if (isAuditing) {
      return;
    }

    setIsAuditing(true);

    auditTimeoutRef.current = window.setTimeout(async () => {
      await persistToAccount();
      setIsAuditing(false);
      auditTimeoutRef.current = null;
    }, 1800);
  }

  async function handleUpgradeToDownload() {
    if (isCheckoutPending) {
      return;
    }

    setIsCheckoutPending(true);
    setExportNotice("");

    try {
      const response = await fetch("/api/checkout/paddle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authenticatedEmail,
          productName,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; details?: string }
          | null;
        if (response.status === 401) {
          router.push("/login?callbackUrl=/dashboard");
          return;
        }

        setExportNotice(
          errorPayload?.error ??
            errorPayload?.details ??
            "Unable to start Paddle checkout.",
        );
        return;
      }

      const payload = (await response.json()) as {
        checkoutUrl?: string | null;
        message?: string;
        premiumUnlocked?: boolean;
      };

      setExportNotice(payload.message ?? "Paddle checkout response received.");

      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      if (payload.premiumUnlocked) {
        setIsPremium(true);
        setPremiumUnlockedAt(new Date().toISOString());
        router.refresh();
      }
    } finally {
      setIsCheckoutPending(false);
    }
  }

  async function ensureGeneratedDocument(documentRecord: DashboardDocument) {
    const cached = documentCache[documentRecord.id];
    if (cached) {
      return cached;
    }

    setIsDocumentLoading(true);

    try {
      const response = await fetch("/api/generate-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType: documentRecord.id,
          answers: session.answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate document.");
      }

      const generated = (await response.json()) as {
        markdown: string;
        provider: string;
        model: string;
        title: string;
        generatedAt: string;
        research: {
          model: string;
          summary: string;
        };
      };

      const savedDocument: SavedGeneratedDocument = {
        id: documentRecord.id,
        title: generated.title,
        markdown: generated.markdown,
        provider: generated.provider,
        model: generated.model,
        generatedAt: generated.generatedAt,
      };

      saveGeneratedDocument(savedDocument);
      setDocumentCache((current) => ({
        ...current,
        [savedDocument.id]: savedDocument,
      }));

      return savedDocument;
    } finally {
      setIsDocumentLoading(false);
    }
  }

  async function handleViewDocument(documentRecord: DashboardDocument) {
    setActiveDocumentId(documentRecord.id);
    setIsDocumentModalOpen(true);
    await ensureGeneratedDocument(documentRecord);
  }

  async function handleExportPdf(documentRecord: DashboardDocument) {
    if (!isPremium) {
      setExportNotice("Premium export is locked until Paddle sandbox checkout completes.");
      await handleUpgradeToDownload();
      return;
    }

    const generated = await ensureGeneratedDocument(documentRecord);
    const renderResponse = await fetch("/api/render-policy-html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markdown: generated.markdown,
        title: generated.title,
        productName,
        websiteUrl: snapshot.websiteUrl,
        generatedAt: formatDisplayDateTime(generated.generatedAt),
      }),
    });

    if (!renderResponse.ok) {
      if (renderResponse.status === 401) {
        router.push("/login?callbackUrl=/dashboard");
        return;
      }

      if (renderResponse.status === 402) {
        setExportNotice(
          "PDF export is locked for draft accounts. Unlock premium access first.",
        );
        return;
      }

      throw new Error("Unable to render PDF export HTML.");
    }

    const htmlBlob = await renderResponse.blob();
    const blobUrl = window.URL.createObjectURL(htmlBlob);
    const printWindow = window.open(
      blobUrl,
      "_blank",
      "noopener,noreferrer,width=1080,height=820",
    );

    if (!printWindow) {
      window.URL.revokeObjectURL(blobUrl);
      return;
    }

    window.setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 60_000);
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12"
      >
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to landing page
            </Link>
            <div className="text-sm text-white/44">Dashboard</div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[28px] border border-amber-300/14 bg-amber-300/[0.06] px-5 py-4 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.9)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/8 text-amber-100">
                  <TriangleAlert className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber-100/70">
                    {snapshot.alertTitle}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-50/88">
                    {snapshot.alertMessage}
                  </p>
                </div>
              </div>
              <div className="rounded-full border border-amber-200/12 bg-amber-200/8 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-amber-100/72">
                2-minute refresh
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="soft-panel rounded-[30px] p-6 sm:p-8"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                  Compliance Workspace
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  Welcome back, {productName} Team
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Your documents are monitored against {snapshot.monitoredRegions.join(", ")}
                  {" "}requirements and recent regulatory changes.
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-white/34">
                  {saveLabel}
                </p>
                {authenticatedEmail ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/28">
                    Signed in as {authenticatedEmail}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3.5 py-2 text-sm font-medium text-emerald-100">
                  <BadgeCheck className="size-4" />
                  100% Compliant
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isPremium ? (
                    <PremiumButton
                      type="button"
                      onClick={() => void handleUpgradeToDownload()}
                      disabled={isCheckoutPending}
                      className="h-12 px-5 text-sm"
                      icon={
                        isCheckoutPending ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <LockKeyhole className="size-4" />
                        )
                      }
                    >
                      {isCheckoutPending ? "Opening Checkout..." : "Unlock PDF Export"}
                    </PremiumButton>
                  ) : null}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={saveToAccount}
                    disabled={isSaving}
                    className="h-12 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                  >
                    {isSaving ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save Workspace
                  </Button>

                  <PremiumButton
                    type="button"
                    onClick={runAudit}
                    disabled={isAuditing}
                    className="h-12 px-5 text-sm"
                    icon={
                      isAuditing ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <ScanSearch className="size-4" />
                      )
                    }
                  >
                    {isAuditing ? "Running audit..." : "Run Global Audit"}
                  </PremiumButton>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                      Compliance Health Score
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-white">
                      {snapshot.healthScore}%
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                    <BadgeCheck className="size-4" />
                    100% Compliant
                  </span>
                </div>

                <div className="mt-5 h-3 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.92),rgba(74,222,128,0.84))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${snapshot.healthScore}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 280, damping: 28 }
                    }
                  />
                </div>

                <p className="mt-4 text-sm leading-7 text-white/62">
                  {snapshot.healthSummary}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Monitored Regions
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {snapshot.monitoredRegions.map((region) => (
                    <span
                      key={region}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/74"
                    >
                      {region}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/56">
                  Primary user region: {snapshot.primaryRegion}.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Last Refresh
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {snapshot.generatedAt}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/56">
                  {snapshot.auditSummary}
                </p>
              </div>
            </div>
          </motion.section>

          {!isPremium ? (
            <motion.section
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] px-5 py-4 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.9)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-teal-200">
                    <LockKeyhole className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/52">
                      Draft Mode
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/72">
                      Your documents are readable and stored, but formal PDF export
                      stays locked until Paddle sandbox checkout marks this account as
                      premium.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleUpgradeToDownload()}
                  disabled={isCheckoutPending}
                  className="h-11 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  {isCheckoutPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="size-4" />
                  )}
                  Upgrade to Download
                </Button>
              </div>
              {exportNotice ? (
                <p className="mt-4 text-sm text-amber-100/82">{exportNotice}</p>
              ) : null}
            </motion.section>
          ) : null}

          <section className="soft-panel rounded-[30px] p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                  Payment History
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Billing and unlock status
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  Paddle sandbox checkout controls whether PDF export is available for this
                  workspace. Upgrade once to unlock the complete legal bundle.
                </p>
              </div>

              {!isPremium ? (
                <PremiumButton
                  type="button"
                  onClick={() => void handleUpgradeToDownload()}
                  disabled={isCheckoutPending}
                  className="h-12 px-5 text-sm"
                  icon={
                    isCheckoutPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )
                  }
                >
                  {isCheckoutPending ? "Opening Checkout..." : "Upgrade to Download"}
                </PremiumButton>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Latest Payment Event
                </p>

                {isPremium ? (
                  <>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                      <BadgeCheck className="size-4" />
                      Premium unlocked
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/66">
                      Paddle sandbox checkout completed and PDF export was unlocked for
                      this account.
                    </p>
                    <p className="mt-3 text-sm text-white/48">
                      {premiumUnlockedAt
                        ? `Unlocked at ${formatDisplayDateTime(premiumUnlockedAt)}`
                        : "Unlocked just now"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/66">
                      <LockKeyhole className="size-4" />
                      No completed payments
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/66">
                      This workspace is still in draft mode. Complete the sandbox upgrade
                      to enable PDF download and formal export.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Export Access
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {isPremium ? "Unlocked" : "Upgrade required"}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  {isPremium
                    ? "All generated documents can now be exported with the formal legal PDF renderer."
                    : "Document viewing is available, but download remains disabled until the payment state is upgraded."}
                </p>
                {exportNotice ? (
                  <p className="mt-4 text-sm text-teal-100/80">{exportNotice}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                Legal Stack
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                Your active legal document set
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {snapshot.documents.map((document, index) => {
                const DocumentIcon = documentIcons[document.id];

                return (
                  <div
                    key={document.id}
                    className={`relative ${document.isPrimary ? "lg:col-span-2" : ""}`}
                  >
                    <GradientCard
                      icon={DocumentIcon}
                      eyebrow={document.isPrimary ? "Primary document" : "Managed document"}
                      title={document.title}
                      description={document.summary}
                      delay={index * 0.05}
                      className="h-full"
                      visual={
                        <div className="flex flex-wrap gap-2.5">
                          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                            <BadgeCheck className="size-3.5" />
                            Status: {document.status}
                          </div>
                          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/62">
                            Last Audit: {document.lastAuditLabel}
                          </div>
                        </div>
                      }
                      contentClassName="gap-5"
                      footerContent={
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs uppercase tracking-[0.24em] text-white/38">
                            Audited {document.refreshedAt}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void handleViewDocument(document)}
                              className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                            >
                              <Eye className="size-4" />
                              View Document
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                isPremium
                                  ? void handleExportPdf(document)
                                  : void handleUpgradeToDownload()
                              }
                              className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:text-white/34"
                            >
                              {isPremium ? (
                                <Download className="size-4" />
                              ) : (
                                <CreditCard className="size-4" />
                              )}
                              {isPremium ? "Export PDF" : "Upgrade to Download"}
                            </Button>
                          </div>
                        </div>
                      }
                    />

                    {!isPremium ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[26px]">
                        <div className="rounded-full border border-white/[0.08] bg-black/38 px-7 py-3 text-sm font-semibold tracking-[0.42em] text-white/18 sm:text-base">
                          DRAFT
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </motion.main>

      <LegalDocumentModal
        isOpen={isDocumentModalOpen}
        title={activeGeneratedDocument?.title ?? activeDocument.title}
        markdown={activeGeneratedDocument?.markdown ?? ""}
        providerLabel={
          activeGeneratedDocument
            ? `${activeGeneratedDocument.provider} | ${activeGeneratedDocument.model}`
            : "Awaiting generation"
        }
        generatedAt={
          activeGeneratedDocument
            ? formatDisplayDateTime(activeGeneratedDocument.generatedAt)
            : snapshot.generatedAt
        }
        isLoading={isDocumentLoading}
        canExport={isPremium}
        onClose={() => setIsDocumentModalOpen(false)}
        onExport={() => void handleExportPdf(activeDocument)}
      />
    </>
  );
}
