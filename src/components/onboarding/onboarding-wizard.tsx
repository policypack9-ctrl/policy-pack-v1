"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Globe2,
  FileText,
  LockKeyhole,
  Mail,
  MapPinned,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  buildSavedPolicyAccount,
  clearPolicyWorkspace,
  clearGeneratedDocuments,
  clearUnlockState,
  loadStoredPolicySession,
  savePolicyPackToAccount,
  saveStoredPolicySession,
} from "@/lib/db";
import {
  CUSTOM_INPUT_FIELDS,
  CUSTOM_MULTI_INPUT_FIELDS,
  OTHER_OPTION_VALUE,
  emptyOnboardingAnswers,
  getResolvedCompanyLocation,
  getResolvedMultiAnswerValues,
  getProductName,
  getGenerationMessages,
  getQuestionsForSelectedPages,
  normalizeAnswers,
  resolvePrimaryRegion,
  type CustomInputField,
  type CustomMultiQuestionId,
  type OnboardingAnswers,
  type OnboardingQuestionId,
  type StoredPolicySession,
} from "@/lib/policy-engine";
import type { DashboardDocument } from "@/lib/policy-engine";
import { cn } from "@/lib/utils";

type ChoiceOption = {
  value: string;
  label: string;
  hint: string;
};

type WizardQuestionId = Exclude<keyof OnboardingAnswers, CustomInputField>;
type TextQuestionId =
  | "businessName"
  | "websiteUrl"
  | "productDescription";
type SingleQuestionId =
  | "aiTransparencyLevel"
  | "companyLocation"
  | "userAccounts"
  | "acceptsPayments";

type BaseQuestion<TId extends WizardQuestionId> = {
  id: TId;
  title: string;
  description: string;
  icon: LucideIcon;
};

type TextQuestion = BaseQuestion<TextQuestionId> & {
  kind: "text" | "textarea";
  placeholder: string;
  inputType?: "text" | "url";
};

type SingleChoiceQuestion = BaseQuestion<SingleQuestionId> & {
  kind: "single";
  options: ChoiceOption[];
};

type MultiChoiceQuestion = BaseQuestion<CustomMultiQuestionId | "selectedPages"> & {
  kind: "multi";
  options: ChoiceOption[];
};

type Question = TextQuestion | SingleChoiceQuestion | MultiChoiceQuestion;

const customInputCopy = {
  companyLocation: {
    label: "Custom jurisdiction",
    placeholder: "Egypt",
  },
  customerRegions: {
    label: "Custom region",
    placeholder: "Middle East, Australia, or LATAM",
  },
  collectedData: {
    label: "Custom data category",
    placeholder: "Phone numbers or government IDs",
  },
  vendors: {
    label: "Custom third-party service",
    placeholder: "HubSpot, Firebase, or Intercom",
  },
  outreachChannels: {
    label: "Custom channel",
    placeholder: "SMS alerts or in-app notifications",
  },
} as const;

const questions: Question[] = [
  {
    id: "businessName",
    kind: "text",
    title: "What is your company or product name?",
    description: "We use this across your Privacy Policy and Terms of Service.",
    icon: Building2,
    placeholder: "PolicyPack",
  },
  {
    id: "websiteUrl",
    kind: "text",
    inputType: "url",
    title: "Which website should these policies cover?",
    description: "Use the main public URL where customers access your product.",
    icon: Globe2,
    placeholder: "https://policypack.app",
  },
  {
    id: "productDescription",
    kind: "textarea",
    title: "What does your product do?",
    description: "A short plain-English description helps tailor the document scope.",
    icon: Sparkles,
    placeholder:
      "We help SaaS founders generate and maintain legal documents for their product.",
  },
  {
    id: "aiTransparencyLevel",
    kind: "single",
    title: "How should specialist processing partners be described?",
    description:
      "Choose whether your pages name specialist partners directly or describe them in broader professional categories.",
    icon: Sparkles,
    options: [
      {
        value: "Named Providers",
        label: "Detailed / Named",
        hint: "List key partners directly when relevant",
      },
      {
        value: "Professional/Generic",
        label: "Professional / Generic",
        hint: "Use broader professional categories instead",
      },
    ],
  },
  {
    id: "companyLocation",
    kind: "single",
    title: "Where is your business based?",
    description: "Jurisdiction affects governing law and disclosure language.",
    icon: MapPinned,
    options: [
      { value: "United States", label: "United States", hint: "US company" },
      { value: "European Union", label: "European Union", hint: "EU entity" },
      { value: "United Kingdom", label: "United Kingdom", hint: "UK company" },
      { value: "Canada", label: "Canada", hint: "Canadian company" },
      { value: "Other", label: "Other", hint: "Custom jurisdiction" },
    ],
  },
  {
    id: "customerRegions",
    kind: "multi",
    title: "Where are your customers located?",
    description: "Pick every region you actively serve today.",
    icon: Globe2,
    options: [
      { value: "United States", label: "United States", hint: "US customers" },
      { value: "European Union", label: "European Union", hint: "EU customers" },
      { value: "United Kingdom", label: "United Kingdom", hint: "UK customers" },
      { value: "Canada", label: "Canada", hint: "Canadian customers" },
      { value: "Global", label: "Global", hint: "Worldwide audience" },
      { value: OTHER_OPTION_VALUE, label: "Other", hint: "Custom region" },
    ],
  },
  {
    id: "collectedData",
    kind: "multi",
    title: "What user data do you collect?",
    description: "We use this to shape privacy disclosures and data rights language.",
    icon: ShieldCheck,
    options: [
      { value: "Names and emails", label: "Names and emails", hint: "Signup info" },
      { value: "Billing details", label: "Billing details", hint: "Payments" },
      { value: "IP or device data", label: "IP or device data", hint: "Security" },
      { value: "Analytics and cookies", label: "Analytics and cookies", hint: "Tracking" },
      { value: "User-generated content", label: "User content", hint: "Uploads or posts" },
      { value: "Support conversations", label: "Support data", hint: "Help desk messages" },
      { value: OTHER_OPTION_VALUE, label: "Other", hint: "Custom data type" },
    ],
  },
  {
    id: "vendors",
    kind: "multi",
    title: "Which third-party services do you rely on?",
    description: "These often appear in processor or disclosure sections.",
    icon: PlugZap,
    options: [
      { value: "Stripe", label: "Stripe", hint: "Payments" },
      {
        value: "Advanced automation providers",
        label: "Advanced automation partners",
        hint: "Specialist generation or processing",
      },
      { value: "Google Analytics", label: "Google Analytics", hint: "Traffic analytics" },
      { value: "AWS or Vercel", label: "AWS or Vercel", hint: "Hosting" },
      { value: "Resend or SendGrid", label: "Resend or SendGrid", hint: "Transactional email" },
      { value: "Sentry or Logtail", label: "Sentry or Logtail", hint: "Error logging" },
      { value: OTHER_OPTION_VALUE, label: "Other", hint: "Custom vendor" },
    ],
  },
  {
    id: "userAccounts",
    kind: "single",
    title: "Do customers create accounts?",
    description: "This affects account access, security, and deletion language.",
    icon: UserRound,
    options: [
      { value: "Yes", label: "Yes", hint: "Users sign up and log in" },
      { value: "No", label: "No", hint: "No account system" },
    ],
  },
  {
    id: "acceptsPayments",
    kind: "single",
    title: "Do you charge users or offer subscriptions?",
    description: "Needed for billing, payment processor, and refund sections.",
    icon: CreditCard,
    options: [
      { value: "Yes", label: "Yes", hint: "Paid plans or transactions" },
      { value: "No", label: "No", hint: "No billing yet" },
    ],
  },
  {
    id: "outreachChannels",
    kind: "multi",
    title: "Which communication or tracking channels do you use?",
    description: "We reflect consent, cookies, and email outreach where needed.",
    icon: Mail,
    options: [
      { value: "Analytics cookies", label: "Analytics cookies", hint: "Traffic measurement" },
      { value: "Marketing cookies", label: "Marketing cookies", hint: "Ad attribution" },
      { value: "Marketing emails", label: "Marketing emails", hint: "Campaigns" },
      { value: "Product update emails", label: "Product update emails", hint: "Operational messages" },
      { value: OTHER_OPTION_VALUE, label: "Other", hint: "Custom channel" },
      { value: "None", label: "None of these", hint: "No tracking or outreach" },
    ],
  },
];

const questionSlideTransition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1] as const,
};

const optionGroupVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const optionItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

import type { LaunchCampaignSnapshot } from "@/lib/launch-campaign";
import { getUserTier, getTierPageConfig, getPageLockMessage, isPageAvailableForTier, ALL_PAGE_IDS, type PageId, type UserTier } from "@/lib/tier-pages";

type OnboardingWizardProps = {
  planId?: string;
  launchSnapshot?: LaunchCampaignSnapshot;
};

export function OnboardingWizard({ planId = "free", launchSnapshot }: OnboardingWizardProps) {
  const router = useRouter();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    if (typeof window === "undefined") {
      return emptyOnboardingAnswers;
    }

    const draftRaw = window.localStorage.getItem("policypack:wizard_draft:v1");
    if (draftRaw) {
      try {
        const parsedDraft = JSON.parse(draftRaw) as Partial<OnboardingAnswers>;
        return normalizeAnswers(parsedDraft);
      } catch {
        // Fall back below if parsing fails
      }
    }

    return loadStoredPolicySession()?.answers ?? emptyOnboardingAnswers;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);

  // Resolve tier from a single source of truth (tier-pages.ts)
  // Tier comes from planId prop (server-side from user DB profile)
  const userTier = getUserTier({
    isPremium: planId === "premium",
    planId,
    isEligibleLaunchUser: launchSnapshot?.isEligibleLaunchUser ?? false,
  });
  const tierConfig = getTierPageConfig(userTier);
  const maxPages = tierConfig.maxSelectable;

  const allPageOptions: Record<string, ChoiceOption> = {
    "about-us": { value: "about-us", label: "About Us", hint: "Company background" },
    "contact-us": { value: "contact-us", label: "Contact Us", hint: "Support info" },
    "privacy-policy": { value: "privacy-policy", label: "Privacy Policy", hint: "Data collection rules" },
    "cookie-policy": { value: "cookie-policy", label: "Cookies Policy", hint: "Tracking details" },
    "terms-of-service": { value: "terms-of-service", label: "Terms of Service", hint: "Usage rules" },
    "legal-disclaimer": { value: "legal-disclaimer", label: "Legal Disclaimer", hint: "Liability limits" },
    "refund-policy": { value: "refund-policy", label: "Refund Policy", hint: "Refund rules" },
  };

  // Show ALL 7 pages ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â unavailable ones render as locked with upgrade hint
  const pageSelectionQuestion: MultiChoiceQuestion = {
    id: "selectedPages",
    kind: "multi",
    title: "Which pages do you want to generate?",
    description: `Select up to ${maxPages} pages. Pages outside your plan show an upgrade hint.`,
    icon: FileText,
    options: ALL_PAGE_IDS.map(id => allPageOptions[id]),
  };
  // After page selection, only show questions relevant to the chosen pages.
  const selectedPageIds = answers.selectedPages as DashboardDocument["id"][];
  const requiredQuestionIds: OnboardingQuestionId[] =
    selectedPageIds.length > 0
      ? getQuestionsForSelectedPages(selectedPageIds)
      : questions.map((q) => q.id as OnboardingQuestionId);
  const filteredQuestions = questions.filter((q) =>
    requiredQuestionIds.includes(q.id as OnboardingQuestionId),
  );
  const dynamicQuestions: Question[] = [pageSelectionQuestion, ...filteredQuestions];

  const currentQuestion = dynamicQuestions[stepIndex];
  const progress = ((stepIndex + 1) / dynamicQuestions.length) * 100;
  const isLastStep = stepIndex === dynamicQuestions.length - 1;
  const canContinue =
    questionHasAnswer(currentQuestion, answers) &&
    (currentQuestion.id !== "selectedPages" ||
      (answers.selectedPages.length > 0 &&
        answers.selectedPages.length <= maxPages));
  const generationMessages = getGenerationMessages(answers);
  const isOverPageLimit = currentQuestion.id === "selectedPages" && answers.selectedPages.length > maxPages;

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const totalMessages = getGenerationMessages(answers).length;
    const generationDuration = totalMessages * 1500;
    const fadeDuration = shouldReduceMotion ? 0 : 420;
    const completedAt = new Date().toISOString();

    const session: StoredPolicySession = {
      answers,
      completedAt,
    };

    saveStoredPolicySession(session);
    savePolicyPackToAccount(
      buildSavedPolicyAccount(answers, completedAt),
    );
    clearGeneratedDocuments();
    clearUnlockState();

    const intervalId = window.setInterval(() => {
      setGenerationStep((current) =>
        current < totalMessages - 1 ? current + 1 : current,
      );
    }, 1500);

    const fadeTimeoutId = window.setTimeout(() => {
      setIsTransitioningOut(true);
    }, Math.max(generationDuration - fadeDuration, 0));

    const timeoutId = window.setTimeout(() => {
      router.push("/onboarding/result");
    }, generationDuration);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(fadeTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, [answers, isGenerating, router, shouldReduceMotion]);

  function updateTextAnswer(id: keyof OnboardingAnswers, value: string) {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("policypack:wizard_draft:v1", JSON.stringify(next));
      }
      return next;
    });
    setShowValidation(false);
  }

  function updateSingleAnswer(id: WizardQuestionId, value: string) {
    setAnswers((current) => {
      const next = {
        ...current,
        [id]: value,
        ...(id === "companyLocation" && value !== OTHER_OPTION_VALUE
          ? { [CUSTOM_INPUT_FIELDS.companyLocation]: "" }
          : {}),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("policypack:wizard_draft:v1", JSON.stringify(next));
      }
      return next;
    });
    setShowValidation(false);
  }

  function updateCustomAnswer(
    id: keyof typeof CUSTOM_INPUT_FIELDS,
    value: string,
  ) {
    setAnswers((current) => {
      const next = {
        ...current,
        [CUSTOM_INPUT_FIELDS[id]]: value,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("policypack:wizard_draft:v1", JSON.stringify(next));
      }
      return next;
    });
    setShowValidation(false);
  }

  function toggleMultiAnswer(id: CustomMultiQuestionId | "selectedPages", value: string) {
    setAnswers((current) => {
      const currentValue = current[id];
      if (!Array.isArray(currentValue)) {
        return current;
      }

      const isSelected = currentValue.includes(value);
      if (id === "selectedPages" && !isSelected && currentValue.length >= maxPages) {
        return current;
      }

      let nextValue: string[];
      const customField = id !== "selectedPages" ? CUSTOM_MULTI_INPUT_FIELDS[id] : null;

      if (value === "None") {
        nextValue = isSelected ? [] : ["None"];
      } else if (value === OTHER_OPTION_VALUE) {
        nextValue = isSelected
          ? currentValue.filter((item) => item !== value)
          : [...currentValue.filter((item) => item !== "None"), value];
      } else if (isSelected) {
        nextValue = currentValue.filter((item) => item !== value);
      } else {
        nextValue = [...currentValue.filter((item) => item !== "None"), value];
      }

      const next = {
        ...current,
        [id]: nextValue,
        ...(customField && value === OTHER_OPTION_VALUE && isSelected
          ? { [customField]: "" }
          : {}),
        ...(customField && value === "None" && !isSelected ? { [customField]: "" } : {}),
      };
      
      if (typeof window !== "undefined") {
        window.localStorage.setItem("policypack:wizard_draft:v1", JSON.stringify(next));
      }
      
      return next;
    });
    setShowValidation(false);
  }

  function goBack() {
    if (stepIndex === 0) {
      return;
    }

    setStepIndex((current) => current - 1);
    setShowValidation(false);
  }

  function startFreshGeneration() {
    clearPolicyWorkspace();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("policypack:wizard_draft:v1");
    }
    setAnswers(emptyOnboardingAnswers);
    setStepIndex(0);
    setShowValidation(false);
    setIsGenerating(false);
    setGenerationStep(0);
    setIsTransitioningOut(false);
  }

  function goNext() {
    if (!canContinue) {
      setShowValidation(true);
      return;
    }

    if (isLastStep) {
      setGenerationStep(0);
      setIsTransitioningOut(false);
      setIsGenerating(true);
      setShowValidation(false);
      return;
    }

    setStepIndex((current) => current + 1);
    setShowValidation(false);
  }

  if (isGenerating) {
    return (
      <GeneratingState
        answers={answers}
        messages={generationMessages}
        generationStep={generationStep}
        isTransitioningOut={isTransitioningOut}
        shouldReduceMotion={shouldReduceMotion}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/58 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to landing page
          </Link>
          <div className="text-sm text-white/44">Onboarding</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="soft-panel rounded-[30px] p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/72">
                    Policy Setup
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
                    {stepIndex === 0
                      ? "Which package fits your workspace?"
                      : stepIndex === 1
                        ? "Which pages do you want to generate?"
                        : `Answer ${filteredQuestions.length} quick questions to generate your selected pages.`}
                  </h1>
                </div>
                  <div className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-sm text-white/58">
                    {`Step ${stepIndex + 1} of ${dynamicQuestions.length}`}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white/44">
                    Your latest setup stays saved to this workspace until you start a fresh one.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={startFreshGeneration}
                    className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                  >
                    Start New Setup
                  </Button>
                </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-white/50">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(45,212,191,0.92),rgba(110,231,183,0.82))]"
                    animate={{ width: `${progress}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 300, damping: 30 }
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <AnimatePresence mode="wait">
                <motion.form
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
                  transition={questionSlideTransition}
                  onSubmit={(event) => {
                    event.preventDefault();
                    goNext();
                  }}
                  className="space-y-6"
                >
                  <QuestionContent
                    question={currentQuestion}
                    answers={answers}
                    shouldReduceMotion={shouldReduceMotion}
                    maxPages={maxPages}
                    userTier={userTier}
                    updateTextAnswer={updateTextAnswer}
                    updateSingleAnswer={updateSingleAnswer}
                    updateCustomAnswer={updateCustomAnswer}
                    toggleMultiAnswer={toggleMultiAnswer}
                  />

                  {showValidation ? (
                    <p className="text-sm text-amber-200/88">
                      {isOverPageLimit
                        ? `You have selected too many pages. Please uncheck some pages to match your limit of ${maxPages}.`
                        : "Complete this question before continuing."}
                    </p>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={goBack}
                      disabled={stepIndex === 0}
                      className="h-12 rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-5 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>

                    <PremiumButton type="submit" className="h-12 px-5 text-sm sm:text-base">
                      {isLastStep ? "Generate PolicyPack" : "Continue"}
                    </PremiumButton>
                  </div>
                </motion.form>
              </AnimatePresence>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="soft-panel rounded-[26px] p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200/72">
                What this powers
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Privacy Policy tailored to your product and stack",
                  "Terms of Service aligned to accounts and billing",
                  "Automated monitoring for global privacy and platform changes",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/70"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-panel rounded-[26px] p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200/72">
                Live snapshot
              </p>
              <div className="mt-4 space-y-3">
                {compactSnapshot(answers).map((item) => (
                  <div key={item.label}>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/72">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

type GeneratingStateProps = {
  answers: OnboardingAnswers;
  messages: string[];
  generationStep: number;
  isTransitioningOut: boolean;
  shouldReduceMotion: boolean;
};

function GeneratingState({
  answers,
  messages,
  generationStep,
  isTransitioningOut,
  shouldReduceMotion,
}: GeneratingStateProps) {
  const activeMessage = messages[generationStep];
  const normalizedAnswers = normalizeAnswers(answers);
  const productName = getProductName(normalizedAnswers);
  const progress = ((generationStep + 1) / messages.length) * 100;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 sm:px-10 lg:px-12">
      <div className="mx-auto flex min-h-[78vh] max-w-4xl items-center justify-center">
        <motion.section
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
          animate={
            isTransitioningOut
              ? { opacity: 0, y: shouldReduceMotion ? 0 : -10, scale: 0.985 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="soft-panel w-full rounded-[32px] p-8 sm:p-10"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-teal-200/72">
              Generating PolicyPack
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Building your compliance-ready document set.
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
              We are mapping your product, regions, and vendor stack into a first-pass
              legal workspace for {productName}.
            </p>

            <div className="relative mx-auto mt-10 flex size-40 items-center justify-center">
              <svg className="-rotate-90 size-full" viewBox="0 0 128 128">
                <defs>
                  <linearGradient id="policy-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(94,234,212,0.98)" />
                    <stop offset="55%" stopColor="rgba(45,212,191,0.95)" />
                    <stop offset="100%" stopColor="rgba(110,231,183,0.82)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="url(#policy-ring)"
                  strokeLinecap="round"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 220, damping: 28 }
                  }
                />
              </svg>

              <motion.div
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: [1, 1.04, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(45,212,191,0.08)",
                          "0 0 0 18px rgba(45,212,191,0)",
                          "0 0 0 0 rgba(45,212,191,0.08)",
                        ],
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute flex size-24 items-center justify-center rounded-full border border-white/[0.08] bg-[#111111]"
              >
                <div className="text-center">
                  <ShieldCheck className="mx-auto size-9 text-teal-200" />
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.26em] text-teal-100/72">
                    Calculating
                  </div>
                </div>
                <span className="absolute -right-1 -top-1 inline-flex size-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-teal-200">
                  <Sparkles className="size-4" />
                </span>
              </motion.div>
            </div>

            <div className="mt-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeMessage}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="text-lg font-medium tracking-[-0.03em] text-white"
                >
                  <StreamingStatusMessage
                    key={activeMessage}
                    message={activeMessage}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                </motion.p>
              </AnimatePresence>
              <p className="mt-3 text-sm text-white/48">
                Region focus: {resolvePrimaryRegion(normalizedAnswers)}.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                normalizedAnswers.companyLocation || "Jurisdiction pending",
                normalizedAnswers.vendors.length > 0
                  ? `${normalizedAnswers.vendors.length} vendors mapped`
                  : "Vendors pending",
                normalizedAnswers.collectedData.length > 0
                  ? `${normalizedAnswers.collectedData.length} data categories detected`
                  : "Data map pending",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/66"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function StreamingStatusMessage({
  message,
  shouldReduceMotion,
}: {
  message: string;
  shouldReduceMotion: boolean;
}) {
  const words = message.split(" ");
  const [visibleWordCount, setVisibleWordCount] = useState(() =>
    shouldReduceMotion ? words.length : 0,
  );
  const streamedMessage = words.slice(0, visibleWordCount).join(" ");

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleWordCount((current) =>
        current < words.length ? current + 1 : current,
      );
    }, 55);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldReduceMotion, words.length]);

  return (
    <>
      {streamedMessage}
      {shouldReduceMotion || visibleWordCount >= words.length ? null : (
        <span className="ml-1 inline-block h-[1em] w-px animate-pulse bg-teal-200 align-[-0.14em]" />
      )}
    </>
  );
}

type QuestionContentProps = {
  question: Question;
  answers: OnboardingAnswers;
  shouldReduceMotion: boolean;
  maxPages: number;
  userTier: UserTier;
  updateTextAnswer: (id: keyof OnboardingAnswers, value: string) => void;
  updateSingleAnswer: (id: WizardQuestionId, value: string) => void;
  updateCustomAnswer: (
    id: keyof typeof CUSTOM_INPUT_FIELDS,
    value: string,
  ) => void;
  toggleMultiAnswer: (id: CustomMultiQuestionId | "selectedPages", value: string) => void;
};

function QuestionContent({
  question,
  answers,
  shouldReduceMotion,
  maxPages,
  userTier,
  updateTextAnswer,
  updateSingleAnswer,
  updateCustomAnswer,
  toggleMultiAnswer,
}: QuestionContentProps) {
  const CurrentIcon = question.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-teal-200">
          <CurrentIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            {question.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
            {question.description}
            {question.id === "selectedPages" ? (
              <span className="block mt-1 text-teal-200/80">
                Selected: {answers.selectedPages.length} / {maxPages}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {renderField(
        question,
        answers,
        shouldReduceMotion,
        maxPages,
        userTier,
        updateTextAnswer,
        updateSingleAnswer,
        updateCustomAnswer,
        toggleMultiAnswer,
      )}
    </div>
  );
}

function renderField(
  question: Question,
  answers: OnboardingAnswers,
  shouldReduceMotion: boolean,
  maxPages: number,
  userTier: UserTier,
  updateTextAnswer: (id: keyof OnboardingAnswers, value: string) => void,
  updateSingleAnswer: (id: WizardQuestionId, value: string) => void,
  updateCustomAnswer: (
    id: keyof typeof CUSTOM_INPUT_FIELDS,
    value: string,
  ) => void,
  toggleMultiAnswer: (id: CustomMultiQuestionId | "selectedPages", value: string) => void,
) {
  if (question.kind === "text") {
    return (
      <input
        type={question.inputType ?? "text"}
        value={answers[question.id] as string}
        onChange={(event) => updateTextAnswer(question.id, event.target.value)}
        placeholder={question.placeholder}
        className="soft-input h-12 w-full rounded-[20px] px-4 text-base"
      />
    );
  }

  if (question.kind === "textarea") {
    return (
      <textarea
        value={answers[question.id] as string}
        onChange={(event) => updateTextAnswer(question.id, event.target.value)}
        placeholder={question.placeholder}
        rows={5}
        className="soft-input min-h-36 w-full rounded-[22px] resize-none px-4 py-3 text-base leading-7"
      />
    );
  }

  if (question.kind === "single") {
    const currentValue = answers[question.id] as string;
    const customQuestionId = isCustomizableQuestionId(question.id)
      ? question.id
      : null;
    const shouldShowCustomInput =
      customQuestionId !== null && currentValue === OTHER_OPTION_VALUE;
    const customField = customQuestionId
      ? CUSTOM_INPUT_FIELDS[customQuestionId]
      : null;
    const customValue = customField ? answers[customField] : "";

    return (
      <div className="space-y-4">
        <motion.div
          className="grid gap-3 sm:grid-cols-2"
          variants={shouldReduceMotion ? undefined : optionGroupVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          animate={shouldReduceMotion ? undefined : "show"}
        >
          {question.options.map((option) => {
            const isSelected = currentValue === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                variants={shouldReduceMotion ? undefined : optionItemVariants}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => updateSingleAnswer(question.id, option.value)}
                className={cn(
                  "rounded-[22px] border px-4 py-4 text-left transition-colors",
                  isSelected
                    ? "border-teal-400/30 bg-teal-400/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="mt-1 text-sm text-white/52">{option.hint}</p>
                  </div>
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      isSelected
                        ? "border-teal-300 bg-teal-300"
                        : "border-white/[0.14] bg-transparent",
                    )}
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence initial={false}>
          {shouldShowCustomInput ? (
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/42">
                {customInputCopy[customQuestionId].label}
              </label>
              <input
                type="text"
                value={customValue}
                onChange={(event) =>
                  updateCustomAnswer(customQuestionId, event.target.value)
                }
                placeholder={customInputCopy[customQuestionId].placeholder}
                className="soft-input h-12 w-full rounded-[20px] px-4 text-base"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  if (question.kind !== "multi") {
    return null;
  }

  const currentValue = answers[question.id] as string[];
  const customQuestionId = isCustomMultiQuestionId(question.id)
    ? question.id
    : null;
  const shouldShowCustomInput =
    customQuestionId !== null && currentValue.includes(OTHER_OPTION_VALUE);
  const customField = customQuestionId
    ? CUSTOM_MULTI_INPUT_FIELDS[customQuestionId]
    : null;
  const customValue = customField ? answers[customField] : "";

  return (
    <div className="space-y-4">
      <motion.div
        className="grid gap-3 sm:grid-cols-2"
        variants={shouldReduceMotion ? undefined : optionGroupVariants}
        initial={shouldReduceMotion ? false : "hidden"}
        animate={shouldReduceMotion ? undefined : "show"}
      >
        {question.options.map((option) => {
          const isSelected = currentValue.includes(option.value);
          const isLockedByTier = question.id === "selectedPages" &&
            !isPageAvailableForTier(option.value as PageId, userTier);
          const lockMessage = isLockedByTier
            ? getPageLockMessage(option.value as PageId, userTier)
            : null;
          // isDisabled: tier lock OR at cap limit
          const isAtPageLimit = question.id === "selectedPages" && !isSelected && currentValue.length >= maxPages;
          const isDisabled = isLockedByTier || isAtPageLimit;

          return (
            <motion.button
              key={option.value}
              type="button"
              disabled={isDisabled}
              variants={shouldReduceMotion ? undefined : optionItemVariants}
              whileHover={shouldReduceMotion || isDisabled ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion || isDisabled ? undefined : { scale: 0.98 }}
              onClick={() => !isLockedByTier && toggleMultiAnswer(question.id, option.value)}
              className={cn(
                "rounded-[22px] border px-4 py-4 text-left transition-colors",
                isSelected
                  ? "border-teal-400/30 bg-teal-400/[0.08]"
                  : isLockedByTier
                    ? "border-white/[0.04] bg-white/[0.01] opacity-50 cursor-not-allowed"
                    : isDisabled
                      ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isLockedByTier && (
                      <LockKeyhole className="size-3.5 shrink-0 text-white/38" />
                    )}
                    <p className={cn("text-sm font-medium", isLockedByTier ? "text-white/50" : "text-white")}>
                      {option.label}
                    </p>
                  </div>
                  {lockMessage ? (
                    <p className="mt-1 text-xs text-amber-300/70">{lockMessage}</p>
                  ) : (
                    <p className="mt-1 text-sm text-white/52">{option.hint}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
                    isSelected
                      ? "border-teal-300 bg-teal-300/90 text-[#0A0A0A]"
                      : "border-white/[0.14] bg-transparent text-transparent",
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence initial={false}>
        {shouldShowCustomInput ? (
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/42">
              {customInputCopy[customQuestionId].label}
            </label>
            <input
              type="text"
              value={customValue}
              onChange={(event) =>
                updateCustomAnswer(customQuestionId, event.target.value)
              }
              placeholder={customInputCopy[customQuestionId].placeholder}
              className="soft-input h-12 w-full rounded-[20px] px-4 text-base"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function questionHasAnswer(question: Question, answers: OnboardingAnswers) {
  if (question.id === "selectedPages") {
    return answers.selectedPages && answers.selectedPages.length > 0;
  }

  const value = answers[question.id as keyof OnboardingAnswers];

  if (question.kind === "multi") {
    if (isCustomMultiQuestionId(question.id as WizardQuestionId)) {
      return getResolvedMultiAnswerValues(answers, question.id as CustomMultiQuestionId).length > 0;
    }

    return Array.isArray(value) && value.length > 0;
  }

  if (
    question.kind === "single" &&
    question.id === "companyLocation" &&
    value === OTHER_OPTION_VALUE
  ) {
    return getResolvedCompanyLocation(answers).length > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

function compactSnapshot(answers: OnboardingAnswers) {
  const normalizedAnswers = normalizeAnswers(answers);

  return [
    { label: "Product", value: formatValue(normalizedAnswers.businessName) },
    { label: "Website", value: formatValue(normalizedAnswers.websiteUrl) },
    { label: "Region", value: formatValue(normalizedAnswers.customerRegions) },
    { label: "Location", value: formatValue(normalizedAnswers.companyLocation) },
  ];
}

function isCustomizableQuestionId(
  id: WizardQuestionId,
): id is keyof typeof CUSTOM_INPUT_FIELDS {
  return Object.hasOwn(CUSTOM_INPUT_FIELDS, id);
}

function isCustomMultiQuestionId(
  id: WizardQuestionId,
): id is CustomMultiQuestionId {
  return Object.hasOwn(CUSTOM_MULTI_INPUT_FIELDS, id);
}

function formatValue(value: string | string[]) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Waiting";
    }

    return value.join(", ");
  }

  if (!value.trim()) {
    return "Waiting";
  }

  return value.length > 88 ? `${value.slice(0, 85)}...` : value;
}





