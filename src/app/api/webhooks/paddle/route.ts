import { NextResponse } from "next/server";

import {
  getAppUserProfileByBillingReference,
  getAppUserProfileByEmail,
  getAppUserProfileById,
  setUserBillingState,
} from "@/lib/auth-data";
import {
  buildBillingUpdateFromAdjustment,
  buildBillingUpdateFromSubscription,
  buildBillingUpdateFromTransaction,
  readPaddleCustomDataValue,
} from "@/lib/billing-state";
import { sendAdminNotification, sendPaymentReceiptEmail } from "@/lib/notifications";
import {
  getPaddleClient,
  getPaddleConfig,
  getPaddleMismatchMessage,
  hasPaddleEnvironmentMismatch,
} from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaddleCustomData = Record<string, unknown> | null | undefined;

type PaddleTransactionWebhookData = {
  id?: string | null;
  customData?: PaddleCustomData;
};

type PaddleSubscriptionWebhookData = {
  id?: string | null;
  customData?: PaddleCustomData;
};

type PaddleAdjustmentWebhookData = {
  action?: string | null;
  id?: string | null;
  status?: string | null;
  subscriptionId?: string | null;
  transactionId?: string | null;
};

const HANDLED_TRANSACTION_STATUSES = new Set([
  "paid",
  "completed",
  "past_due",
  "canceled",
]);

const HANDLED_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
]);

function readWebhookUserId(customData: PaddleCustomData) {
  return readPaddleCustomDataValue(customData, "userId", "user_id") ?? "";
}

function readWebhookEmail(
  customData: PaddleCustomData,
  fallback?: string | null,
) {
  return readPaddleCustomDataValue(customData, "email") ?? fallback ?? "";
}

async function resolveBillingProfile(input: {
  userId?: string | null;
  email?: string | null;
  transactionId?: string | null;
  subscriptionId?: string | null;
}) {
  if (input.userId) {
    const profile = await getAppUserProfileById(input.userId);

    if (profile) {
      return profile;
    }
  }

  const referenceProfile = await getAppUserProfileByBillingReference({
    subscriptionId: input.subscriptionId ?? null,
    transactionId: input.transactionId ?? null,
  });

  if (referenceProfile) {
    return referenceProfile;
  }

  if (input.email) {
    return getAppUserProfileByEmail(input.email);
  }

  return null;
}

async function syncTransactionState(input: {
  customData: PaddleCustomData;
  transaction: {
    id: string;
    status: string | null;
    subscriptionId: string | null;
    billingPeriod?: { endsAt?: string | null } | null;
    customer?: { email?: string | null } | null;
  };
}) {
  const { transaction } = input;

  if (!HANDLED_TRANSACTION_STATUSES.has(transaction.status ?? "")) {
    return {
      ignored: true as const,
      reason: `Transaction status ${transaction.status ?? "unknown"} is not actionable.`,
      transactionId: transaction.id,
    };
  }

  const userId = readWebhookUserId(input.customData);
  const email = readWebhookEmail(
    input.customData,
    transaction.customer?.email ?? null,
  );
  const previousProfile = await resolveBillingProfile({
    userId,
    email,
    transactionId: transaction.id,
    subscriptionId: transaction.subscriptionId,
  });

  if (!previousProfile) {
    return {
      ignored: true as const,
      reason: "Unable to match the transaction to a PolicyPack user.",
      transactionId: transaction.id,
    };
  }

  const update = buildBillingUpdateFromTransaction({
    customData: input.customData,
    fallbackPlanId: previousProfile.planId,
    status: transaction.status,
    transactionId: transaction.id,
    subscriptionId: transaction.subscriptionId,
    currentPeriodEndsAt: transaction.billingPeriod?.endsAt ?? null,
  });
  const updatedProfile = await setUserBillingState({
    userId: previousProfile.userId,
    isPremium: update.isPremium,
    planId: update.planId,
    billingStatus: update.billingStatus,
    paddleTransactionId: update.paddleTransactionId,
    paddleSubscriptionId: update.paddleSubscriptionId,
    currentPeriodEndsAt: update.currentPeriodEndsAt,
    premiumUnlockedAt: previousProfile.premiumUnlockedAt ?? undefined,
  });

  if (updatedProfile?.isPremium && !previousProfile.isPremium) {
    const planName =
      readPaddleCustomDataValue(input.customData, "planName") ??
      readPaddleCustomDataValue(input.customData, "planId") ??
      "Premium";
    const notificationEmail = email || "Unknown";

    const notificationResult = await sendAdminNotification({
      kind: "payment",
      subject: "New PolicyPack payment confirmed",
      summary:
        "A customer payment was verified successfully and workspace access was unlocked.",
      details: [
        { label: "User ID", value: previousProfile.userId },
        { label: "Email", value: notificationEmail },
        { label: "Package", value: planName },
        { label: "Transaction ID", value: transaction.id },
        { label: "Status", value: transaction.status ?? "Unknown" },
      ],
    });

    if (!notificationResult.ok) {
      console.error("Webhook payment notification could not be delivered.");
    }

    if (email) {
      const receiptResult = await sendPaymentReceiptEmail(email, planName);

      if (!receiptResult.ok) {
        console.error("Webhook payment receipt could not be delivered to user.");
      }
    }
  }

  return {
    ignored: false as const,
    matchedUserId: previousProfile.userId,
    transactionId: transaction.id,
    billingStatus: updatedProfile?.billingStatus ?? update.billingStatus,
    premiumUpdated: updatedProfile?.isPremium ?? update.isPremium,
  };
}

async function syncSubscriptionState(input: {
  customData: PaddleCustomData;
  subscription: {
    id: string;
    status: string | null;
    nextBilledAt?: string | null;
    canceledAt?: string | null;
    currentBillingPeriod?: { endsAt?: string | null } | null;
  };
}) {
  const { subscription } = input;

  if (!HANDLED_SUBSCRIPTION_STATUSES.has(subscription.status ?? "")) {
    return {
      ignored: true as const,
      reason: `Subscription status ${subscription.status ?? "unknown"} is not actionable.`,
      subscriptionId: subscription.id,
    };
  }

  const userId = readWebhookUserId(input.customData);
  const email = readWebhookEmail(input.customData);
  const previousProfile = await resolveBillingProfile({
    userId,
    email,
    subscriptionId: subscription.id,
  });

  if (!previousProfile) {
    return {
      ignored: true as const,
      reason: "Unable to match the subscription to a PolicyPack user.",
      subscriptionId: subscription.id,
    };
  }

  const currentPeriodEndsAt =
    subscription.currentBillingPeriod?.endsAt ??
    subscription.nextBilledAt ??
    subscription.canceledAt ??
    null;
  const update = buildBillingUpdateFromSubscription({
    customData: input.customData,
    fallbackPlanId: previousProfile.planId,
    status: subscription.status,
    subscriptionId: subscription.id,
    currentPeriodEndsAt,
  });
  const updatedProfile = await setUserBillingState({
    userId: previousProfile.userId,
    isPremium: update.isPremium,
    planId: update.planId,
    billingStatus: update.billingStatus,
    paddleSubscriptionId: update.paddleSubscriptionId,
    currentPeriodEndsAt: update.currentPeriodEndsAt,
    premiumUnlockedAt: previousProfile.premiumUnlockedAt ?? undefined,
  });

  return {
    ignored: false as const,
    matchedUserId: previousProfile.userId,
    subscriptionId: subscription.id,
    billingStatus: updatedProfile?.billingStatus ?? update.billingStatus,
    premiumUpdated: updatedProfile?.isPremium ?? update.isPremium,
  };
}

async function syncAdjustmentState(input: {
  adjustment: PaddleAdjustmentWebhookData;
  paddle: NonNullable<ReturnType<typeof getPaddleClient>>;
}) {
  const { adjustment, paddle } = input;
  const transactionId = adjustment.transactionId ?? null;
  let previousProfile = await resolveBillingProfile({
    transactionId,
    subscriptionId: adjustment.subscriptionId ?? null,
  });
  let transactionCustomData: PaddleCustomData = null;
  let transactionEmail = "";

  if (!previousProfile && transactionId) {
    const transaction = await paddle.transactions.get(transactionId);
    transactionCustomData = (transaction.customData ?? {}) as PaddleCustomData;
    transactionEmail = readWebhookEmail(
      transactionCustomData,
      transaction.customer?.email ?? null,
    );
    previousProfile = await resolveBillingProfile({
      userId: readWebhookUserId(transactionCustomData),
      email: transactionEmail,
      transactionId,
      subscriptionId: adjustment.subscriptionId ?? transaction.subscriptionId,
    });
  }

  const update = buildBillingUpdateFromAdjustment({
    currentPlanId:
      previousProfile?.planId ??
      readPaddleCustomDataValue(transactionCustomData, "planId"),
    action: adjustment.action,
    status: adjustment.status,
    transactionId,
    subscriptionId: adjustment.subscriptionId ?? null,
  });

  if (!update) {
    return {
      ignored: true as const,
      reason: "Adjustment does not require an access change.",
      transactionId,
    };
  }

  if (!previousProfile) {
    return {
      ignored: true as const,
      reason: "Unable to match the adjustment to a PolicyPack user.",
      transactionId,
    };
  }

  const updatedProfile = await setUserBillingState({
    userId: previousProfile.userId,
    isPremium: update.isPremium,
    planId: update.planId,
    billingStatus: update.billingStatus,
    paddleTransactionId: update.paddleTransactionId,
    paddleSubscriptionId: update.paddleSubscriptionId,
    currentPeriodEndsAt: update.currentPeriodEndsAt,
  });

  return {
    ignored: false as const,
    matchedUserId: previousProfile.userId,
    transactionId,
    billingStatus: updatedProfile?.billingStatus ?? update.billingStatus,
    premiumUpdated: updatedProfile?.isPremium ?? update.isPremium,
  };
}

export async function POST(request: Request) {
  const config = getPaddleConfig();
  const paddle = getPaddleClient();
  const signature = request.headers.get("paddle-signature") ?? "";
  const requestBody = await request.text();

  if (!config.apiKey) {
    return NextResponse.json(
      { error: "PADDLE_API_KEY is missing." },
      { status: 500 },
    );
  }

  if (hasPaddleEnvironmentMismatch()) {
    return NextResponse.json(
      { error: getPaddleMismatchMessage() },
      { status: 409 },
    );
  }

  if (!config.webhookSecret) {
    return NextResponse.json(
      { error: "PADDLE_WEBHOOK_SECRET is missing." },
      { status: 500 },
    );
  }

  if (!paddle) {
    return NextResponse.json(
      { error: "Paddle client is unavailable." },
      { status: 500 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing paddle-signature header." },
      { status: 400 },
    );
  }

  try {
    const event = await paddle.webhooks.unmarshal(
      requestBody,
      config.webhookSecret,
      signature,
    );

    if (event.eventType.startsWith("transaction.")) {
      const transactionData = event.data as PaddleTransactionWebhookData;
      const transactionId = transactionData.id ?? "";

      if (!transactionId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          eventType: event.eventType,
          reason: "Transaction webhook did not include a transaction id.",
        });
      }

      const verifiedTransaction = await paddle.transactions.get(transactionId);
      const result = await syncTransactionState({
        customData:
          ((verifiedTransaction.customData ??
            transactionData.customData ??
            {}) as PaddleCustomData),
        transaction: {
          id: verifiedTransaction.id,
          status: verifiedTransaction.status,
          subscriptionId: verifiedTransaction.subscriptionId,
          billingPeriod: verifiedTransaction.billingPeriod,
          customer: verifiedTransaction.customer,
        },
      });

      return NextResponse.json({
        ok: true,
        eventType: event.eventType,
        verifiedStatus: verifiedTransaction.status,
        ...result,
      });
    }

    if (event.eventType.startsWith("subscription.")) {
      const subscriptionData = event.data as PaddleSubscriptionWebhookData;
      const subscriptionId = subscriptionData.id ?? "";

      if (!subscriptionId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
          eventType: event.eventType,
          reason: "Subscription webhook did not include a subscription id.",
        });
      }

      const verifiedSubscription = await paddle.subscriptions.get(subscriptionId);
      const result = await syncSubscriptionState({
        customData:
          ((verifiedSubscription.customData ??
            subscriptionData.customData ??
            {}) as PaddleCustomData),
        subscription: {
          id: verifiedSubscription.id,
          status: verifiedSubscription.status,
          nextBilledAt: verifiedSubscription.nextBilledAt,
          canceledAt: verifiedSubscription.canceledAt,
          currentBillingPeriod: verifiedSubscription.currentBillingPeriod,
        },
      });

      return NextResponse.json({
        ok: true,
        eventType: event.eventType,
        verifiedStatus: verifiedSubscription.status,
        ...result,
      });
    }

    if (event.eventType.startsWith("adjustment.")) {
      const adjustmentData = event.data as PaddleAdjustmentWebhookData;
      const result = await syncAdjustmentState({
        adjustment: adjustmentData,
        paddle,
      });

      return NextResponse.json({
        ok: true,
        eventType: event.eventType,
        verifiedStatus: adjustmentData.status ?? null,
        ...result,
      });
    }

    return NextResponse.json({
      ok: true,
      ignored: true,
      eventType: event.eventType,
      reason: "Unhandled Paddle webhook event type.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to verify Paddle webhook.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
