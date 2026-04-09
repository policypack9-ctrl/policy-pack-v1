import {
  normalizeAnswers,
  POLICY_SESSION_STORAGE_KEY,
  type DashboardDocument,
  type OnboardingAnswers,
  type StoredPolicySession,
} from "@/lib/policy-engine";

export const POLICY_ACCOUNT_STORAGE_KEY = "policypack:account:v1";
export const POLICY_DOCUMENTS_STORAGE_KEY = "policypack:documents:v1";

export type SavedGeneratedDocument = {
  id: DashboardDocument["id"];
  title: string;
  markdown: string;
  provider: string;
  model: string;
  generatedAt: string;
};

export type SavedPolicyAccount = {
  productName: string;
  primaryRegion: string;
  lastSavedAt: string;
  session: StoredPolicySession;
};

export type SaveResult = {
  ok: boolean;
  mode: "local-storage" | "database-ready";
  savedAt: string;
};

export function loadStoredPolicySession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(POLICY_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPolicySession>;
    return {
      answers: normalizeAnswers(parsed.answers),
      completedAt:
        typeof parsed.completedAt === "string"
          ? parsed.completedAt
          : new Date().toISOString(),
    } satisfies StoredPolicySession;
  } catch {
    return null;
  }
}

export function saveStoredPolicySession(session: StoredPolicySession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(POLICY_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadPolicyAccount() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(POLICY_ACCOUNT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedPolicyAccount>;
    if (!parsed.session) {
      return null;
    }

    return {
      productName:
        typeof parsed.productName === "string" ? parsed.productName : "PolicyPack",
      primaryRegion:
        typeof parsed.primaryRegion === "string"
          ? parsed.primaryRegion
          : "your market",
      lastSavedAt:
        typeof parsed.lastSavedAt === "string"
          ? parsed.lastSavedAt
          : new Date().toISOString(),
      session: {
        answers: normalizeAnswers(parsed.session.answers),
        completedAt:
          typeof parsed.session.completedAt === "string"
            ? parsed.session.completedAt
            : new Date().toISOString(),
      },
    } satisfies SavedPolicyAccount;
  } catch {
    return null;
  }
}

export function savePolicyPackToAccount(input: SavedPolicyAccount): SaveResult {
  const savedAt = new Date().toISOString();

  if (typeof window === "undefined") {
    return {
      ok: true,
      mode: "database-ready",
      savedAt,
    };
  }

  window.localStorage.setItem(
    POLICY_ACCOUNT_STORAGE_KEY,
    JSON.stringify({
      ...input,
      lastSavedAt: savedAt,
    }),
  );

  return {
    ok: true,
    mode: "local-storage",
    savedAt,
  };
}

export function loadGeneratedDocuments() {
  if (typeof window === "undefined") {
    return {} as Record<DashboardDocument["id"], SavedGeneratedDocument>;
  }

  const raw = window.localStorage.getItem(POLICY_DOCUMENTS_STORAGE_KEY);

  if (!raw) {
    return {} as Record<DashboardDocument["id"], SavedGeneratedDocument>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<
      DashboardDocument["id"],
      SavedGeneratedDocument
    >;

    return parsed ?? {};
  } catch {
    return {} as Record<DashboardDocument["id"], SavedGeneratedDocument>;
  }
}

export function saveGeneratedDocument(
  document: SavedGeneratedDocument,
): SaveResult {
  const savedAt = new Date().toISOString();

  if (typeof window === "undefined") {
    return {
      ok: true,
      mode: "database-ready",
      savedAt,
    };
  }

  const current = loadGeneratedDocuments();
  const next = {
    ...current,
    [document.id]: document,
  };

  window.localStorage.setItem(
    POLICY_DOCUMENTS_STORAGE_KEY,
    JSON.stringify(next),
  );

  return {
    ok: true,
    mode: "local-storage",
    savedAt,
  };
}

export function clearGeneratedDocuments() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(POLICY_DOCUMENTS_STORAGE_KEY);
}

export function buildSavedPolicyAccount(
  answers: OnboardingAnswers,
  completedAt: string,
) {
  const primaryRegion = answers.customerRegions[0] || answers.companyLocation || "your market";

  return {
    productName: answers.businessName.trim() || "PolicyPack",
    primaryRegion,
    lastSavedAt: completedAt,
    session: {
      answers: normalizeAnswers(answers),
      completedAt,
    },
  } satisfies SavedPolicyAccount;
}
