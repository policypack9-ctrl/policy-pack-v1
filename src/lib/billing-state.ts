import type { BillingPlanId } from "@/lib/billing-plans";

export type StoredBillingPlanId = BillingPlanId | "free";

export type BillingStatus =
  | "inactive"
  | "pending"
  | "one_time"
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "refunded"
  | "chargeback";

export type BillingUpdate = {
  planId: StoredBillingPlanId;
  billingStatus: BillingStatus;
  isPremium: boolean;
  paddleTransactionId: string | null;
  paddleSubscriptionId: string | null;
  currentPeriodEndsAt: string | null;
};

type CustomDataRecord = Record<string, unknown> | null | undefined;

const KNOWN_BILLING_STATUSES = new Set<BillingStatus>([
  "inactive",
  "pending",
  "one_time",
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
  "refunded",
  "chargeback",
]);

function parseFutureDate(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return timestamp > Date.now();
}

export function normalizeStoredBillingPlanId(
  value: unknown,
  fallback: StoredBillingPlanId = "free",
): StoredBillingPlanId {
  if (value === "starter" || value === "premium" || value === "free") {
    return value;
  }

  return fallback;
}

export function normalizeBillingStatus(
  value: unknown,
  fallback: BillingStatus = "inactive",
): BillingStatus {
  if (typeof value === "string" && KNOWN_BILLING_STATUSES.has(value as BillingStatus)) {
    return value as BillingStatus;
  }

  return fallback;
}

export function readPaddleCustomDataValue(
  customData: CustomDataRecord,
  ...keys: string[]
) {
  if (!customData) {
    return null;
  }

  for (const key of keys) {
    const value = customData[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function isTransactionOwnedByUser(
  customData: CustomDataRecord,
  userId: string,
) {
  const ownerId = readPaddleCustomDataValue(customData, "userId", "user_id");
  return Boolean(ownerId && ownerId === userId);
}

export function hasActiveBillingAccess(input: {
  planId?: string | null;
  billingStatus?: string | null;
  currentPeriodEndsAt?: string | null;
  isPremium?: boolean | null;
}) {
  const planId = normalizeStoredBillingPlanId(input.planId);
  const billingStatus = input.billingStatus;

  if (!billingStatus) {
    return Boolean(input.isPremium);
  }

  switch (normalizeBillingStatus(billingStatus)) {
    case "active":
    case "trialing":
    case "one_time":
      return planId !== "free";
    case "canceled":
      return planId === "premium" && parseFutureDate(input.currentPeriodEndsAt);
    case "inactive":
    case "pending":
    case "past_due":
    case "paused":
    case "refunded":
    case "chargeback":
      return false;
    default:
      return Boolean(input.isPremium);
  }
}

export function buildBillingUpdateFromTransaction(input: {
  customData?: CustomDataRecord;
  fallbackPlanId?: string | null;
  status?: string | null;
  transactionId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEndsAt?: string | null;
}): BillingUpdate {
  const planId = normalizeStoredBillingPlanId(
    readPaddleCustomDataValue(input.customData, "planId") ??
      input.fallbackPlanId ??
      (input.subscriptionId ? "premium" : "free"),
  );

  let billingStatus: BillingStatus = "pending";

  switch (input.status) {
    case "paid":
    case "completed":
      billingStatus = planId === "starter" ? "one_time" : "active";
      break;
    case "past_due":
      billingStatus = "past_due";
      break;
    case "canceled":
      billingStatus = "canceled";
      break;
    default:
      billingStatus = "pending";
      break;
  }

  return {
    planId,
    billingStatus,
    isPremium: hasActiveBillingAccess({
      planId,
      billingStatus,
      currentPeriodEndsAt: input.currentPeriodEndsAt,
      isPremium: input.status === "paid" || input.status === "completed",
    }),
    paddleTransactionId: input.transactionId ?? null,
    paddleSubscriptionId: input.subscriptionId ?? null,
    currentPeriodEndsAt: input.currentPeriodEndsAt ?? null,
  };
}

export function buildBillingUpdateFromSubscription(input: {
  customData?: CustomDataRecord;
  fallbackPlanId?: string | null;
  status?: string | null;
  subscriptionId?: string | null;
  currentPeriodEndsAt?: string | null;
}): BillingUpdate {
  const planId = normalizeStoredBillingPlanId(
    readPaddleCustomDataValue(input.customData, "planId") ??
      input.fallbackPlanId ??
      "premium",
  );
  const billingStatus = normalizeBillingStatus(input.status, "inactive");

  return {
    planId,
    billingStatus,
    isPremium: hasActiveBillingAccess({
      planId,
      billingStatus,
      currentPeriodEndsAt: input.currentPeriodEndsAt,
      isPremium: billingStatus === "active" || billingStatus === "trialing",
    }),
    paddleTransactionId: null,
    paddleSubscriptionId: input.subscriptionId ?? null,
    currentPeriodEndsAt: input.currentPeriodEndsAt ?? null,
  };
}

export function buildBillingUpdateFromAdjustment(input: {
  currentPlanId?: string | null;
  action?: string | null;
  status?: string | null;
  transactionId?: string | null;
  subscriptionId?: string | null;
}) {
  if (input.status !== "approved") {
    return null;
  }

  if (input.action !== "refund" && input.action !== "chargeback") {
    return null;
  }

  return {
    planId: normalizeStoredBillingPlanId(
      input.currentPlanId,
      input.subscriptionId ? "premium" : "free",
    ),
    billingStatus: input.action === "refund" ? "refunded" : "chargeback",
    isPremium: false,
    paddleTransactionId: input.transactionId ?? null,
    paddleSubscriptionId: input.subscriptionId ?? null,
    currentPeriodEndsAt: null,
  } satisfies BillingUpdate;
}
