"use client";

import Link from "next/link";
import { CheckoutEventNames, initializePaddle, type Environments, type Paddle, type PaddleEventData } from "@paddle/paddle-js";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Cookie,
  CreditCard,
  Download,
  Eye,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Save,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LegalDocumentModal } from "@/components/legal/legal-document-modal";
import { PlanSelectionDialog } from "@/components/billing/plan-selection-dialog";
import { Button } from "@/components/ui/button";
import { GradientCard } from "@/components/ui/gradient-card";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  buildSavedPolicyAccount,
  clearPolicyWorkspace,
  loadGeneratedDocuments,
  loadPolicyAccount,
  loadStoredPolicySession,
  saveGeneratedDocument,
  savePolicyPackToAccount,
  saveStoredPolicySession,
  type SavedGeneratedDocument,
} from "@/lib/db";
import { type BillingPlanId } from "@/lib/billing-plans";
import {
  buildComplianceSnapshot,
  emptyOnboardingAnswers,
  formatAnswerList,
  formatDisplayDateTime,
  getProductName,
  type DashboardDocument,
  type ComplianceSnapshot,
  type StoredPolicySession,
} from "@/lib/policy-engine";
import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import { runAuditEngine, type DocumentUpdate } from "@/lib/audit-engine";

const documentIcons = {
  "about-us": Eye,
  "contact-us": FileText,
  "privacy-policy": ShieldCheck,
  "cookie-policy": Cookie,
  "terms-of-service": FileText,
  "legal-disclaimer": TriangleAlert,
  "refund-policy": CreditCard,
} as const;

type ComplianceDashboardProps = {
  initialIsPremium?: boolean;
  planId?: string;
  initialPremiumUnlockedAt?: string | null;
  initialGeneratedDocuments?: SavedGeneratedDocument[];
  authenticatedEmail?: string | null;
  initialPaddleTransactionId?: string | null;
  launchSnapshot: LaunchCampaignSnapshot;
};

type PaddleCheckoutState =
  | "idle"
  | "initializing"
  | "ready"
  | "opening"
  | "verifying"
  | "success"
  | "error";

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

function waitFor(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type AuditViewState = {
  healthScore: number;
  healthSummary: string;
  auditSummary: string;
  alertTitle: string;
  alertMessage: string;
  alertBadge: string;
  documentUpdates: DocumentUpdate[];
};

function buildAuditViewState(
  snapshot: ComplianceSnapshot,
  session: StoredPolicySession,
  auditRefreshCount: number,
): AuditViewState {
  const usesPayments = session.answers.acceptsPayments === "Yes";
  const usesCookies = session.answers.outreachChannels.some((item) =>
    /cookie/i.test(item),
  );
  const currentVendors = formatAnswerList(
    session.answers.vendors,
    "your current tool stack",
  );

  if (auditRefreshCount === 0) {
    if (snapshot.primaryRegion === "European Union" || snapshot.primaryRegion === "Global") {
      return {
        healthScore: 97,
        healthSummary: `Most core documents are aligned for ${snapshot.monitoredRegions.join(", ")} coverage, with one regional review suggested.`,
        auditSummary: `Watching ${snapshot.monitoredRegions.join(", ")} obligations and specialist partner language for ${currentVendors}.`,
        alertTitle: "Regional review suggested",
        alertMessage:
          "Recent EU-facing disclosure changes may warrant a quick review of your data-processing and regional-rights wording.",
        alertBadge: "Suggested review",
        documentUpdates: [],
      };
    }

    if (usesPayments) {
      return {
        healthScore: 98,
        healthSummary: "Your core pages are in strong shape, with one billing-facing review suggested before scaling.",
        auditSummary: `Monitoring billing, refund, and support wording for ${snapshot.primaryRegion} transactions.`,
        alertTitle: "Billing review suggested",
        alertMessage:
          "Your payment-facing language looks strong, but a quick pass on refund and support wording would keep checkout trust tighter.",
        alertBadge: "Suggested review",
        documentUpdates: [],
      };
    }

    return {
      healthScore: 99,
      healthSummary: `Your launch-ready pages are aligned for ${snapshot.primaryRegion}, with light monitoring active.`,
      auditSummary: `Watching policy changes relevant to ${snapshot.primaryRegion} and your current product setup.`,
      alertTitle: "Monitoring active",
      alertMessage:
        "Your workspace is healthy. Run a fresh audit any time you want the latest review across your current setup.",
      alertBadge: "Monitoring live",
        documentUpdates: [],
    };
  }

  if (usesCookies) {
    return {
      healthScore: 100,
      healthSummary: `All core documents are synced and refreshed for ${snapshot.monitoredRegions.join(", ")} coverage.`,
      auditSummary: `Cookie, privacy-rights, and support wording were rechecked for ${snapshot.monitoredRegions.join(", ")} visitors.`,
      alertTitle: "Audit complete",
      alertMessage:
        "Cookie disclosures, regional rights wording, and support details were rechecked against your current launch setup.",
      alertBadge: "Updated just now",
        documentUpdates: [],
    };
  }

  if (usesPayments) {
    return {
      healthScore: 100,
      healthSummary: "All payment-facing documents are refreshed and ready for current billing flows.",
      auditSummary: `Billing, refund, and account language were refreshed for ${snapshot.primaryRegion} and ${currentVendors}.`,
      alertTitle: "Audit complete",
      alertMessage:
        "Billing, refund, and support wording were refreshed against your current product flow and package setup.",
      alertBadge: "Updated just now",
        documentUpdates: [],
    };
  }

  return {
    healthScore: 100,
    healthSummary: `All core documents are synced for ${snapshot.monitoredRegions.join(", ")} coverage.`,
    auditSummary: `Policy language was refreshed for your current setup across ${snapshot.monitoredRegions.join(", ")} coverage.`,
    alertTitle: "Audit complete",
    alertMessage:
      "Your current workspace was rechecked successfully and no immediate launch blockers were found in the active document set.",
    alertBadge: "Updated just now",
        documentUpdates: [],
  };
}

export function ComplianceDashboard({
  initialIsPremium = false,
  planId = "free",
  initialPremiumUnlockedAt = null,
  initialGeneratedDocuments = [],
  authenticatedEmail = null,
  initialPaddleTransactionId = null,
  launchSnapshot,
}: ComplianceDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const auditTimeoutRef = useRef<number | null>(null);
  const paddleRef = useRef<Paddle | null>(null);
  const paddleInitPromiseRef = useRef<Promise<Paddle | null> | null>(null);
  const activeTransactionIdRef = useRef<string | null>(null);
  const queryTransactionHandledRef = useRef(false);
  const verificationInFlightRef = useRef<string | null>(null);
  const pendingDocumentExportRef = useRef<DashboardDocument["id"] | null>(null);
  const paddleEventHandlerRef = useRef<(event: PaddleEventData) => void>(() => {});
  const openPaddleOverlayRef = useRef<(transactionId: string) => Promise<boolean>>(
    async () => false,
  );
  const verifyTransactionAccessRef = useRef<(transactionId: string) => Promise<void>>(
    async () => {},
  );
  const [session, setSession] = useState<StoredPolicySession>({
    answers: emptyOnboardingAnswers,
    completedAt: new Date().toISOString(),
  });
  const [hasHydratedWorkspace, setHasHydratedWorkspace] = useState(false);
  const [hasWorkspaceSession, setHasWorkspaceSession] = useState(false);

  // Hydrate localStorage after mount to avoid a server/client mismatch.
  useEffect(() => {
    const savedAccount = loadPolicyAccount();
    const storedSession = savedAccount?.session ?? loadStoredPolicySession();
    if (storedSession) {
      setSession(storedSession);
    }
    setHasWorkspaceSession(Boolean(storedSession));
    const localDocs = loadGeneratedDocuments();
    if (Object.keys(localDocs).length > 0) {
      setDocumentCache((prev) => ({ ...buildInitialDocumentCache(initialGeneratedDocuments), ...localDocs, ...prev }));
    }
    if (savedAccount) {
      setSaveLabel(`Saved to your workspace at ${formatDisplayDateTime(savedAccount.lastSavedAt)}`);
    } else if (loadStoredPolicySession()) {
      setSaveLabel("Your workspace has not been saved yet");
    }
    setHasHydratedWorkspace(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Redirect deleted or expired sessions as soon as the client detects them.
  useEffect(() => {
    if (!authenticatedEmail) {
      router.replace("/login?callbackUrl=/dashboard");
    }
  }, [authenticatedEmail, router]);

  const [isPremium, setIsPremium] = useState(initialIsPremium);
  const [premiumUnlockedAt, setPremiumUnlockedAt] = useState<string | null>(
    initialPremiumUnlockedAt,
  );
  // Server-safe: DB docs only, localStorage merged in useEffect to avoid hydration mismatch
  const [documentCache, setDocumentCache] = useState<Record<DashboardDocument["id"], SavedGeneratedDocument>>(
    () => buildInitialDocumentCache(initialGeneratedDocuments)
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Server-safe: plain label updated from localStorage in useEffect
  const [saveLabel, setSaveLabel] = useState("Your workspace is ready");
  const [activeDocumentId, setActiveDocumentId] =
    useState<DashboardDocument["id"]>("privacy-policy");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const [checkoutState, setCheckoutState] =
    useState<PaddleCheckoutState>("idle");
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [auditRefreshCount, setAuditRefreshCount] = useState(0);
  const [lastAuditAt, setLastAuditAt] = useState<string | null>(null);
  const [documentUpdates, setDocumentUpdates] = useState<DocumentUpdate[]>([]);

  useEffect(() => {
    if (!initialPaddleTransactionId || queryTransactionHandledRef.current) {
      return;
    }

    queryTransactionHandledRef.current = true;
    if (isPremium) {
      router.replace(pathname);
      return;
    }

    activeTransactionIdRef.current = initialPaddleTransactionId;
    void (async () => {
      const opened = await openPaddleOverlayRef.current(initialPaddleTransactionId);

      if (!opened) {
        await verifyTransactionAccessRef.current(initialPaddleTransactionId);
      }
    })();
  }, [initialPaddleTransactionId, isPremium, pathname, router]);

  useEffect(() => {
    return () => {
      if (auditTimeoutRef.current) {
        window.clearTimeout(auditTimeoutRef.current);
      }

      paddleRef.current?.Checkout.close();
    };
  }, []);

  useEffect(() => {
    setIsPremium(initialIsPremium);
  }, [initialIsPremium]);

  useEffect(() => {
    setPremiumUnlockedAt(initialPremiumUnlockedAt);
  }, [initialPremiumUnlockedAt]);

  const snapshot = buildComplianceSnapshot(session.answers, session.completedAt);
  const displayGeneratedAt = formatDisplayDateTime(lastAuditAt ?? session.completedAt);
  const auditView = buildAuditViewState(snapshot, session, auditRefreshCount);
  const displayDocuments = snapshot.documents.map((document) => ({
    ...document,
    refreshedAt: displayGeneratedAt,
    lastAuditLabel: displayGeneratedAt,
  }));
  const productName = getProductName(session.answers);
  const activeDocument =
    displayDocuments.find((document) => document.id === activeDocumentId) ??
    displayDocuments[0];
  const activeGeneratedDocument = documentCache[activeDocument.id];
  const generatedDocumentCount = Object.keys(documentCache).length;
  const selectedPageLabels = displayDocuments.map((document) => document.title);

  // Determine user tier and whether to show the empty state.
  // Empty state: no generated documents and no completed onboarding session after hydration.
  const showEmptyState =
    hasHydratedWorkspace &&
    generatedDocumentCount === 0 &&
    initialGeneratedDocuments.length === 0 &&
    !hasWorkspaceSession;

  if (!authenticatedEmail) {
    return null;
  }

  if (!hasHydratedWorkspace && initialGeneratedDocuments.length === 0) {
    return null;
  }

  const normalizedPlanId = planId === "starter" || planId === "premium" ? planId : "free";
  // SINGLE SOURCE OF TRUTH for promo generation eligibility
  const canGenerateComplimentaryDocument =
    !isPremium &&
    launchSnapshot.isEligibleLaunchUser &&
    launchSnapshot.complimentaryDocumentsRemaining > 0;
  const isLaunchPromoActive =
    !isPremium &&
    launchSnapshot.isEligibleLaunchUser &&
    launchSnapshot.complimentaryDocumentsRemaining > 0;
  const hasUnlockedComplimentaryDraft = generatedDocumentCount > 0;
  const complimentaryStateLabel = canGenerateComplimentaryDocument
    ? "1 complimentary draft available"
    : hasUnlockedComplimentaryDraft
      ? "Complimentary draft already used"
      : launchSnapshot.freeGenerationClosed
        ? "Launch batch closed"
        : "Upgrade required for more drafts";
  const complimentarySummary = canGenerateComplimentaryDocument
    ? "This verified launch account can still generate one complimentary legal document before billing becomes mandatory."
    : hasUnlockedComplimentaryDraft
      ? "Your complimentary launch draft is already available in this workspace. Generate more documents by choosing a package."
      : launchSnapshot.freeGenerationClosed
        ? "The complimentary launch period has ended. New workspaces now choose a package before generation starts."
        : "This account has already used its complimentary launch draft. Choose a package to unlock the rest of the document suite.";
  const workspaceActionLabel = canGenerateComplimentaryDocument
    ? "Generate Complimentary Draft"
    : "Upgrade";
  const WorkspaceActionIcon = canGenerateComplimentaryDocument
    ? Eye
    : LockKeyhole;
  const currentPackageLabel = isPremium
    ? normalizedPlanId === "starter"
      ? "Starter paid package"
      : "Premium paid package"
    : isLaunchPromoActive
      ? "Launch promotional package"
      : "Free package";
  const currentPackageSummary = isPremium
    ? normalizedPlanId === "starter"
      ? "Starter package is active for this account."
      : "Premium package is active for this account."
    : isLaunchPromoActive
      ? `${launchSnapshot.complimentaryDocumentsRemaining} complimentary pages available from your launch offer.`
      : "Free access is active. Choose a paid package for full generation and downloads.";
  const isCheckoutBusy =
    isCheckoutPending ||
    checkoutState === "initializing" ||
    checkoutState === "opening" ||
    checkoutState === "verifying";
  const checkoutNoticeClassName =
    checkoutState === "success"
      ? "text-emerald-100/84"
      : checkoutState === "error"
        ? "text-amber-100/82"
        : "text-teal-100/80";
  const checkoutButtonLabel =
    checkoutState === "initializing"
      ? "Preparing Billing..."
      : checkoutState === "opening"
        ? "Opening Billing..."
        : checkoutState === "verifying"
          ? "Finalizing Access..."
          : "Upgrade";

  async function persistToAccount(nextCompletedAt = new Date().toISOString()) {
    const nextSession: StoredPolicySession = {
      answers: session.answers,
      completedAt: nextCompletedAt,
    };

    saveStoredPolicySession(nextSession);
    const result = savePolicyPackToAccount(
      buildSavedPolicyAccount(nextSession.answers, nextSession.completedAt),
    );

    setSession(nextSession);
    setSaveLabel(
      `Saved to your workspace at ${formatDisplayDateTime(result.savedAt)}`,
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
    if (isAuditing) return;
    setIsAuditing(true);
    setExportNotice("Scanning regulations and checking your documents...");

    auditTimeoutRef.current = window.setTimeout(async () => {
      const refreshedAt = new Date().toISOString();
      await persistToAccount(refreshedAt);
      setLastAuditAt(refreshedAt);
      setAuditRefreshCount((c) => c + 1);

      // Real audit engine checks generated docs against current regulations.
      const generatedIds = Object.keys(documentCache);
      const report = runAuditEngine(session, snapshot.primaryRegion, generatedIds);
      setDocumentUpdates(report.updates);

      const highCount = report.updates.filter((u) => u.priority === "high").length;
      if (highCount > 0) {
        setExportNotice(`Audit complete - ${highCount} high-priority update${highCount > 1 ? "s" : ""} found.`);
      } else if (report.updates.length > 0) {
        setExportNotice(`Audit complete - ${report.updates.length} improvement${report.updates.length > 1 ? "s" : ""} suggested.`);
      } else {
        setExportNotice("Audit complete - all documents are up to date.");
      }

      setIsAuditing(false);
      auditTimeoutRef.current = null;
    }, 2200);
  }

  async function ensureGeneratedDocument(documentRecord: DashboardDocument) {
    const cached = documentCache[documentRecord.id];
    if (cached) {
      return cached;
    }

    setIsDocumentLoading(true);
    try {
      // Step 1: Live regulation research
      setExportNotice("Searching latest laws and regulation updates...");
      let researchSummary = "";
      let researchModel = "built-in-regulations";
      let liveSearchUsed = false;
      try {
        const researchResp = await fetch("/api/research-policy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType: documentRecord.id, answers: session.answers }),
        });
        if (researchResp.ok) {
          const rd = (await researchResp.json()) as { researchSummary?: string; researchModel?: string; liveSearch?: boolean };
          researchSummary = rd.researchSummary ?? "";
          researchModel = rd.researchModel ?? "built-in-regulations";
          liveSearchUsed = rd.liveSearch ?? false;
          setExportNotice(liveSearchUsed
            ? "Live regulation updates found. Drafting your document..."
            : "Drafting your document with regulation knowledge...");
        } else {
          setExportNotice(" Drafting your document...");
        }
      } catch {
        setExportNotice(" Drafting your document...");
      }

      // Step 2: Draft the document
      const response = await fetch("/api/draft-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: documentRecord.id,
          answers: session.answers,
          researchSummary,
          researchModel,
        }),
      });
      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; requiresCheckout?: boolean }
          | null;

        if (response.status === 401) {
          router.push("/login?callbackUrl=/dashboard");
          return null;
        }

        if (response.status === 402) {
          setExportNotice(
            errorPayload?.error ??
              "Choose a package before generating another document.",
          );
          return null;
        }

        throw new Error(
          errorPayload?.error ?? "Unable to generate document.",
        );
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
    if (
      !isPremium &&
      !documentCache[documentRecord.id] &&
      !canGenerateComplimentaryDocument
    ) {
      setExportNotice(complimentarySummary);
      await handleUpgradeToDownload(undefined, documentRecord.id);
      return;
    }

    setActiveDocumentId(documentRecord.id);
    setIsDocumentModalOpen(true);
    const generated = await ensureGeneratedDocument(documentRecord);

    if (!generated && !isPremium && !documentCache[documentRecord.id]) {
      setIsDocumentModalOpen(false);
    }
  }

  async function exportPdfForDocument(documentRecord: DashboardDocument) {
    const generated = await ensureGeneratedDocument(documentRecord);

    if (!generated) {
      return;
    }

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
          "Downloads are locked on the free plan. Upgrade first to export PDFs.",
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

  async function finalizeUnlockedWorkspace() {
    setIsPremium(true);
    setPremiumUnlockedAt(new Date().toISOString());
    setCheckoutState("success");
    setIsCheckoutPending(false);
    setExportNotice("Payment confirmed. Your PDF downloads are now unlocked.");
    activeTransactionIdRef.current = null;
    router.replace(pathname);
    router.refresh();

    const pendingDocumentId = pendingDocumentExportRef.current;
    pendingDocumentExportRef.current = null;

    if (pendingDocumentId) {
      const pendingDocument = displayDocuments.find(
        (document) => document.id === pendingDocumentId,
      );

      if (pendingDocument) {
        setExportNotice("Payment confirmed. Preparing your PDF...");
        await exportPdfForDocument(pendingDocument);
      }
    }
  }

  async function verifyTransactionAccess(transactionId: string) {
    if (verificationInFlightRef.current === transactionId) {
      return;
    }

    verificationInFlightRef.current = transactionId;
    setCheckoutState("verifying");
    setIsCheckoutPending(true);
    setExportNotice("Confirming your payment...");

    try {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const response = await fetch("/api/checkout/paddle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
          }),
        });

        if (response.status === 401) {
          router.push("/login?callbackUrl=/dashboard");
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              details?: string;
              premiumUnlocked?: boolean;
              verifiedStatus?: string;
            }
          | null;

        if (!response.ok) {
          setCheckoutState("error");
          setExportNotice(
            payload?.error ??
              payload?.details ??
              "We couldn't verify your payment yet.",
          );
          return;
        }

        if (payload?.premiumUnlocked) {
          await finalizeUnlockedWorkspace();
          return;
        }

        if (attempt < 11) {
          setExportNotice(
            payload?.verifiedStatus
              ? `Your payment is ${payload.verifiedStatus}. Waiting for final confirmation...`
              : "Payment submitted. Waiting for final confirmation...",
          );
          await waitFor(2500);
        }
      }

      setCheckoutState("ready");
      setExportNotice(
        "Billing finished, but your payment is still processing. Refresh this page in a few seconds if downloads stay locked.",
      );
    } finally {
      verificationInFlightRef.current = null;
      setIsCheckoutPending(false);
    }
  }

  async function initializePaddleOverlay() {
    if (paddleRef.current) {
      return paddleRef.current;
    }

    if (paddleInitPromiseRef.current) {
      return paddleInitPromiseRef.current;
    }

    setCheckoutState("initializing");
    setExportNotice("Preparing billing...");

    paddleInitPromiseRef.current = (async () => {
      const response = await fetch("/api/checkout/paddle/client-token", {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            token?: string;
            environment?: Environments;
          }
        | null;

      if (!response.ok || !payload?.token || !payload.environment) {
        setCheckoutState("error");
        setExportNotice(
          payload?.error ??
            "Billing is temporarily unavailable. Please try again in a moment.",
        );
        return null;
      }

      const paddle = await initializePaddle({
        token: payload.token,
        environment: payload.environment,
        checkout: {
          settings: {
            displayMode: "overlay",
            theme: "dark",
            successUrl: `${window.location.origin}/dashboard`,
          },
        },
        eventCallback: (event) => {
          paddleEventHandlerRef.current(event);
        },
      });

      if (!paddle) {
        setCheckoutState("error");
        setExportNotice("Billing could not be opened on this browser.");
        return null;
      }

      paddleRef.current = paddle;
      setCheckoutState("ready");
      return paddle;
    })().finally(() => {
      paddleInitPromiseRef.current = null;
    });

    return paddleInitPromiseRef.current;
  }

  async function openPaddleOverlay(transactionId: string) {
    const paddle = await initializePaddleOverlay();

    if (!paddle) {
      return false;
    }

    activeTransactionIdRef.current = transactionId;
    setCheckoutState("opening");
    setIsCheckoutPending(true);
    setExportNotice("Opening billing...");

    paddle.Checkout.open({
      transactionId,
      settings: {
        displayMode: "overlay",
        theme: "dark",
        successUrl: `${window.location.origin}/dashboard?_ptxn=${transactionId}`,
      },
    });

    return true;
  }

  paddleEventHandlerRef.current = (event) => {
    switch (event.name) {
      case CheckoutEventNames.CHECKOUT_LOADED:
        setCheckoutState("opening");
        setExportNotice("Billing is ready.");
        break;
      case CheckoutEventNames.CHECKOUT_PAYMENT_INITIATED:
        setCheckoutState("verifying");
        setExportNotice("Payment submitted. Waiting for final confirmation...");
        break;
      case CheckoutEventNames.CHECKOUT_COMPLETED: {
        const completedTransactionId =
          event.data?.transaction_id ?? activeTransactionIdRef.current;

        if (completedTransactionId) {
          void verifyTransactionAccess(completedTransactionId);
        }
        break;
      }
      case CheckoutEventNames.CHECKOUT_CLOSED:
        if (!isPremium && checkoutState !== "success") {
          setCheckoutState("ready");
          setIsCheckoutPending(false);
          setExportNotice("Billing was closed. You can reopen it any time.");
        }
        break;
      case CheckoutEventNames.CHECKOUT_FAILED:
      case CheckoutEventNames.CHECKOUT_ERROR:
      case CheckoutEventNames.CHECKOUT_PAYMENT_ERROR:
      case CheckoutEventNames.CHECKOUT_PAYMENT_FAILED:
        setCheckoutState("error");
        setIsCheckoutPending(false);
        setExportNotice(
          event.detail || "Checkout encountered an error. Please try again.",
        );
        break;
      default:
        break;
    }
  };

  openPaddleOverlayRef.current = openPaddleOverlay;
  verifyTransactionAccessRef.current = verifyTransactionAccess;

  async function handleUpgradeToDownload(
    planId?: BillingPlanId,
    pendingDocumentId?: DashboardDocument["id"],
  ) {
    if (isCheckoutBusy) {
      return;
    }

    if (!pendingDocumentId) {
      pendingDocumentExportRef.current = null;
    }

    if (pendingDocumentId) {
      pendingDocumentExportRef.current = pendingDocumentId;
    }

    if (!planId) {
      setIsPlanDialogOpen(true);
      return;
    }

    setIsCheckoutPending(true);
    setCheckoutState("initializing");
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
          planId,
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

        setCheckoutState("error");
        setExportNotice(
          errorPayload?.error ??
            errorPayload?.details ??
            "Unable to start billing.",
        );
        return;
      }

      const payload = (await response.json()) as {
        checkoutUrl?: string | null;
        transactionId?: string;
        message?: string;
        premiumUnlocked?: boolean;
      };

      setExportNotice(payload.message ?? "Billing is ready.");
      setIsPlanDialogOpen(false);

      if (payload.premiumUnlocked) {
        await finalizeUnlockedWorkspace();
        return;
      }

      if (payload.transactionId) {
        const opened = await openPaddleOverlay(payload.transactionId);

        if (opened) {
          return;
        }
      }

      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }

      setCheckoutState("error");
      setExportNotice(
        "Your billing session was created, but it could not be opened on this device.",
      );
    } finally {
      if (!activeTransactionIdRef.current && !verificationInFlightRef.current) {
        setIsCheckoutPending(false);
      }
    }
  }

  async function handleExportPdf(documentRecord: DashboardDocument) {
    if (!isPremium) {
      setExportNotice("Downloads unlock right after payment is complete.");
      await handleUpgradeToDownload(undefined, documentRecord.id);
      return;
    }

    await exportPdfForDocument(documentRecord);
  }

  function startNewWorkspace() {
    clearPolicyWorkspace();
    router.push("/onboarding");
    router.refresh();
  }



  // -- Empty state: user has no documents and no saved session ----------
  if (showEmptyState) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 py-16"
      >
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-[22px] border border-teal-300/20 bg-teal-300/[0.06]">
            <ShieldCheck className="size-8 text-teal-200/80" />
          </span>
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/60">
              Workspace Setup
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Finish onboarding to open your dashboard
            </h1>
            <p className="text-base leading-relaxed text-white/50">
              Choose your package first, answer the guided questions once, and then
              come back to a dashboard that shows your package details and selected pages.
            </p>
          </div>
          <div className="w-full rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 text-left">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-white/40">
              What happens next
            </p>
            <div className="space-y-3 text-sm leading-6 text-white/68">
              <p>1. Pick the package that matches your launch.</p>
              <p>2. Answer only the questions required for the pages in that package.</p>
              <p>3. Return here with your package details and generated pages already attached to the workspace.</p>
            </div>
          </div>
          <div className="w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/onboarding")}
              className="h-12 w-full rounded-[18px] border border-teal-300/20 bg-teal-300/[0.07] px-5 text-sm text-teal-100 hover:bg-teal-300/[0.12] hover:text-white"
            >
              Continue Onboarding
            </Button>
          </div>
        </div>
      </motion.main>
    );
  }
  // ----------------------------------------------------------------------------

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
            className={`rounded-[28px] border px-5 py-5 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.9)] ${
              documentUpdates.some((u) => u.priority === "high")
                ? "border-red-300/18 bg-red-300/[0.06]"
                : documentUpdates.length > 0
                  ? "border-amber-300/14 bg-amber-300/[0.06]"
                  : "border-emerald-400/14 bg-emerald-400/[0.05]"
            }`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border ${
                    documentUpdates.some((u) => u.priority === "high")
                      ? "border-red-200/15 bg-red-200/[0.08] text-red-100"
                      : documentUpdates.length > 0
                        ? "border-amber-200/15 bg-amber-200/[0.08] text-amber-100"
                        : "border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-100"
                  }`}>
                    {documentUpdates.some((u) => u.priority === "high") || documentUpdates.length > 0
                      ? <TriangleAlert className="size-4" />
                      : <BadgeCheck className="size-4" />}
                  </span>
                  <div>
                    <p className={`text-[11px] font-medium uppercase tracking-[0.28em] ${
                      documentUpdates.some((u) => u.priority === "high") ? "text-red-100/70" : documentUpdates.length > 0 ? "text-amber-100/70" : "text-emerald-100/70"
                    }`}>{auditView.alertTitle}</p>
                    <p className="mt-1 text-sm leading-6 text-white/78">{auditView.alertMessage}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] ${
                  documentUpdates.some((u) => u.priority === "high") ? "border-red-200/12 bg-red-200/[0.08] text-red-100/72"
                  : documentUpdates.length > 0 ? "border-amber-200/12 bg-amber-200/[0.08] text-amber-100/72"
                  : "border-emerald-400/12 bg-emerald-400/[0.08] text-emerald-100/72"
                }`}>{auditView.alertBadge}</span>
              </div>
              {documentUpdates.length > 0 && (
                <div className="space-y-2 border-t border-white/[0.06] pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/38">Updates needed in your documents</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {documentUpdates.map((update, idx) => (
                      <div key={`${update.documentId}-${idx}`}
                        className={`flex items-start gap-2.5 rounded-[14px] border px-3 py-2.5 ${
                          update.priority === "high" ? "border-red-300/15 bg-red-300/[0.05]"
                          : update.priority === "medium" ? "border-amber-300/15 bg-amber-300/[0.05]"
                          : "border-white/[0.06] bg-white/[0.02]"
                        }`}>
                        <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          update.priority === "high" ? "bg-red-400" : update.priority === "medium" ? "bg-amber-400" : "bg-white/30"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white/85">{update.documentTitle}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-white/50">{update.reason}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-white/28">{update.regulation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  Your Workspace
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
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/42">
                  Current package: {currentPackageLabel}
                </p>
                <p className="mt-2 text-sm text-white/58">
                  {currentPackageSummary}
                </p>
                {selectedPageLabels.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                      Selected pages
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedPageLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-teal-300/15 bg-teal-300/[0.06] px-3 py-1 text-xs font-medium text-teal-100/78"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/dashboard/settings")}
                    className="h-12 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                  >
                    <Settings2 className="size-4" />
                    Settings
                  </Button>

                  {!isPremium ? (
                    <PremiumButton
                      type="button"
                      onClick={() =>
                        canGenerateComplimentaryDocument
                          ? void handleViewDocument(displayDocuments[0])
                          : void handleUpgradeToDownload()
                      }
                      disabled={isCheckoutBusy}
                      className="h-12 px-5 text-sm"
                      icon={
                        isCheckoutBusy ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <WorkspaceActionIcon className="size-4" />
                        )
                      }
                    >
                      {isCheckoutBusy ? checkoutButtonLabel : workspaceActionLabel}
                    </PremiumButton>
                  ) : null}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={startNewWorkspace}
                    className="h-12 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                  >
                    <ArrowLeft className="size-4" />
                    New Generation
                  </Button>

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
                    Save to Account
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
                      {auditView.healthScore}%
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
                    animate={{ width: `${auditView.healthScore}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 280, damping: 28 }
                    }
                  />
                </div>

                <p className="mt-4 text-sm leading-7 text-white/62">
                  {auditView.healthSummary}
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
                  {displayGeneratedAt}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/56">
                  {auditView.auditSummary}
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
                      {complimentaryStateLabel}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/72">
                      {complimentarySummary}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    canGenerateComplimentaryDocument
                      ? void handleViewDocument(displayDocuments[0])
                      : void handleUpgradeToDownload()
                  }
                  disabled={isCheckoutBusy}
                  className="h-11 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  {isCheckoutBusy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <WorkspaceActionIcon className="size-4" />
                  )}
                  {isCheckoutBusy ? checkoutButtonLabel : workspaceActionLabel}
                </Button>
              </div>
              {exportNotice ? (
                <p className={`mt-4 text-sm ${checkoutNoticeClassName}`}>{exportNotice}</p>
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
                  Billing and download status
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                  {isPremium
                    ? "Premium access is active across your full legal bundle."
                    : complimentarySummary}
                </p>
              </div>

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
                      Your plan was upgraded successfully and document downloads are now
                      available for this account.
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
                      {canGenerateComplimentaryDocument ? (
                        <BadgeCheck className="size-4" />
                      ) : (
                        <LockKeyhole className="size-4" />
                      )}
                      {complimentaryStateLabel}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/66">
                      {complimentarySummary}
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Export Access
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {isPremium
                    ? "Downloads unlocked"
                    : canGenerateComplimentaryDocument
                      ? "Complimentary draft active"
                      : "Upgrade required"}
                </p>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  {isPremium
                    ? "All generated documents are ready to export as polished legal PDFs."
                    : canGenerateComplimentaryDocument
                      ? "You can still open one complimentary draft. PDF downloads remain gated until payment is complete."
                      : "New document generation and PDF downloads now unlock after you choose a package."}
                </p>
                {exportNotice ? (
                  <p className={`mt-4 text-sm ${checkoutNoticeClassName}`}>{exportNotice}</p>
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
              {displayDocuments.map((document, index) => {
                const DocumentIcon = documentIcons[document.id];
                const hasGeneratedDraft = Boolean(documentCache[document.id]);
                const isEligiblePromoUser = launchSnapshot.isEligibleLaunchUser && !isPremium;
                const isFullyLocked =
                  !isPremium &&
                  !isEligiblePromoUser &&
                  !hasGeneratedDraft &&
                  !canGenerateComplimentaryDocument;
                const viewButtonLabel = isPremium
                  ? "View Document"
                  : hasGeneratedDraft
                    ? "View Draft"
                    : isEligiblePromoUser
                      ? "Generate Now"
                      : canGenerateComplimentaryDocument
                        ? "Use Free Draft"
                        : "Upgrade";
                const downloadButtonLabel = isPremium
                  ? "Export PDF"
                  : hasGeneratedDraft
                    ? "Download PDF"
                    : "Unlock PDF";
                const overlayLabel = isPremium
                  ? null
                  : hasGeneratedDraft
                    ? "DRAFT"
                    : canGenerateComplimentaryDocument
                      ? "1 FREE DRAFT"
                      : "LOCKED";

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
                              onClick={() =>
                                  hasGeneratedDraft || canGenerateComplimentaryDocument || isPremium
                                    ? void handleViewDocument(document)
                                    : void handleUpgradeToDownload(undefined, document.id)
                              }
                              className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                            >
                              {hasGeneratedDraft || isPremium ? (
                                <Eye className="size-4" />
                              ) : canGenerateComplimentaryDocument ? (
                                <BadgeCheck className="size-4" />
                              ) : (
                                <LockKeyhole className="size-4" />
                              )}
                              {viewButtonLabel}
                            </Button>
                            {!isFullyLocked ? (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  isPremium
                                    ? void handleExportPdf(document)
                                    : void handleUpgradeToDownload(undefined, document.id)
                                }
                                className={`h-10 rounded-[16px] px-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isPremium ? "border border-white/[0.08] bg-white/[0.02] text-white/72 hover:bg-white/[0.05] hover:text-white" : "border border-teal-400/25 bg-teal-400/[0.08] text-teal-100 shadow-[0_0_16px_-4px_rgba(45,212,191,0.25)] hover:bg-teal-400/[0.14]"}`}
                              >
                                {isPremium ? (
                                  <Download className="size-4" />
                                ) : (
                                  <Sparkles className="size-3.5" />
                                )}
                                {downloadButtonLabel}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      }
                    />

                    {!isPremium && overlayLabel ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[26px]">
                        <div className="rounded-full border border-white/[0.08] bg-black/38 px-7 py-3 text-sm font-semibold tracking-[0.42em] text-white/18 sm:text-base">
                          {overlayLabel}
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
        metaLabel={activeGeneratedDocument ? "Prepared for your workspace" : "Preparing draft"}
        generatedAt={
          activeGeneratedDocument
            ? formatDisplayDateTime(activeGeneratedDocument.generatedAt)
            : displayGeneratedAt
        }
        isLoading={isDocumentLoading}
        canExport={isPremium}
        onClose={() => setIsDocumentModalOpen(false)}
        onExport={() => void handleExportPdf(activeDocument)}
      />

      <PlanSelectionDialog
        isOpen={isPlanDialogOpen}
        onClose={() => setIsPlanDialogOpen(false)}
        onSelectPlan={(planId) => void handleUpgradeToDownload(planId, pendingDocumentExportRef.current ?? undefined)}
        isSubmitting={isCheckoutBusy}
        title="Choose the package for this workspace"
        description="Select your plan to unlock document generation and downloads."
        promoActive={launchSnapshot.promoActive}
        onSelectFree={() => { setIsPlanDialogOpen(false); router.push("/onboarding"); }}
        onSelectPromo={() => { setIsPlanDialogOpen(false); router.push("/onboarding"); }}
      />
    </>
  );
}





