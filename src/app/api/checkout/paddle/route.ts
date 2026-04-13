import { NextResponse } from "next/server";
import { Environment } from "@paddle/paddle-node-sdk";

import { auth } from "@/auth";
import { getAppUserProfileById, setUserBillingState } from "@/lib/auth-data";
import {
  buildBillingUpdateFromTransaction,
  isTransactionOwnedByUser,
  readPaddleCustomDataValue,
} from "@/lib/billing-state";
import { getBillingPlan, type BillingPlanId } from "@/lib/billing-plans";
import { sendAdminNotification, sendPaymentReceiptEmail } from "@/lib/notifications";
import {
  buildPolicyPackCheckoutItems,
  getPaddleClient,
  getPaddleConfig,
  getPaddleLegalUrls,
  getPaddleMismatchMessage,
  hasPaddleEnvironmentMismatch,
  isVerifiedPaddleTransactionStatus,
} from "@/lib/paddle";
import { getAuthBaseUrl } from "@/lib/auth-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCheckoutInitializationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (/default payment link/i.test(message)) {
    return {
      error:
        "Billing is connected, but this account still needs a default return link before the payment window can open.",
      details: message,
    };
  }

  return {
    error: "Unable to initialize billing.",
    details: message,
  };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      productName?: string;
      transactionId?: string;
      planId?: BillingPlanId;
    };
    const config = getPaddleConfig();
    const paddle = getPaddleClient();
    const baseUrl = getAuthBaseUrl();
    const legalUrls = getPaddleLegalUrls(baseUrl);
    const planId: BillingPlanId =
      body.planId === "starter" || body.planId === "premium"
        ? body.planId
        : "premium";
    const selectedPlan = getBillingPlan(planId);
    const selectedPriceId =
      planId === "starter" ? config.starterPriceId : config.premiumPriceId;
    let previewTotal: string | null = null;
    let providerMode:
      | "simulated"
      | "paddle-preview"
      | "paddle-checkout"
      | "paddle-verified" =
      "simulated";
    const checkoutItems = buildPolicyPackCheckoutItems(
      body.productName || "PolicyPack",
      planId,
      selectedPriceId || undefined,
    );

    if (config.apiKey && hasPaddleEnvironmentMismatch()) {
      return NextResponse.json(
        {
          error: getPaddleMismatchMessage(),
          legalUrls,
        },
        { status: 409 },
      );
    }

    if (paddle && body.transactionId) {
      const verifiedTransaction = await paddle.transactions.get(body.transactionId);
      const currentProfile = await getAppUserProfileById(session.user.id);
      const customData = (verifiedTransaction.customData ??
        {}) as Record<string, unknown>;

      if (!isTransactionOwnedByUser(customData, session.user.id)) {
        return NextResponse.json(
          {
            error:
              "This transaction does not belong to the signed-in account.",
          },
          { status: 403 },
        );
      }

      const billingUpdate = buildBillingUpdateFromTransaction({
        customData,
        fallbackPlanId: currentProfile?.planId ?? "free",
        status: verifiedTransaction.status,
        transactionId: verifiedTransaction.id,
        subscriptionId: verifiedTransaction.subscriptionId,
        currentPeriodEndsAt: verifiedTransaction.billingPeriod?.endsAt ?? null,
      });
      let updatedProfile = currentProfile;

      if (billingUpdate.billingStatus !== "pending") {
        updatedProfile = await setUserBillingState({
          userId: session.user.id,
          isPremium: billingUpdate.isPremium,
          planId: billingUpdate.planId,
          billingStatus: billingUpdate.billingStatus,
          paddleTransactionId: billingUpdate.paddleTransactionId,
          paddleSubscriptionId: billingUpdate.paddleSubscriptionId,
          currentPeriodEndsAt: billingUpdate.currentPeriodEndsAt,
          premiumUnlockedAt: currentProfile?.premiumUnlockedAt ?? undefined,
        });
      }

      if (
        updatedProfile?.isPremium &&
        !currentProfile?.isPremium &&
        isVerifiedPaddleTransactionStatus(verifiedTransaction.status)
      ) {
        const paymentEmail =
          verifiedTransaction.customer?.email ?? session.user.email ?? "Unknown";
        const paymentPlan =
          readPaddleCustomDataValue(customData, "planName") ??
          readPaddleCustomDataValue(customData, "planId") ??
          "Not specified";
        const notificationTasks: Array<Promise<{ ok: boolean; skipped: boolean }>> = [
          sendAdminNotification({
            kind: "payment",
            subject: "New PolicyPack payment confirmed",
            summary:
              "A customer payment was verified successfully and workspace access was unlocked.",
            details: [
              { label: "User ID", value: session.user.id },
              { label: "Email", value: paymentEmail },
              { label: "Package", value: paymentPlan },
              { label: "Transaction ID", value: verifiedTransaction.id },
              {
                label: "Status",
                value: verifiedTransaction.status ?? "Unknown",
              },
            ],
          }),
        ];

        if (paymentEmail && paymentEmail !== "Unknown") {
          notificationTasks.push(
            sendPaymentReceiptEmail(paymentEmail, paymentPlan),
          );
        }

        const notificationResults = await Promise.allSettled(notificationTasks);

        for (const result of notificationResults) {
          if (result.status === "rejected") {
            console.error("Payment notification failed to send.", result.reason);
          } else if (!result.value.ok && !result.value.skipped) {
            console.error("Payment notification returned a delivery failure.");
          }
        }
      }

      return NextResponse.json({
        ok: true,
        simulated: false,
        providerMode: "paddle-verified",
        transactionId: verifiedTransaction.id,
        verifiedStatus: verifiedTransaction.status,
        verifiedPlanId: billingUpdate.planId,
        premiumUnlocked: updatedProfile?.isPremium ?? false,
        environment: config.environment,
        sandbox: config.environment === Environment.sandbox,
        legalUrls,
        message: updatedProfile?.isPremium
          ? "Payment verified. Export access is now unlocked for this account."
          : `Transaction ${verifiedTransaction.id} is ${verifiedTransaction.status} and not ready to unlock premium access yet.`,
      });
    }

    if (paddle) {
      try {
        const preview = await paddle.transactions.preview({
          items: checkoutItems,
        });
        previewTotal = preview.details?.totals?.grandTotal ?? null;
        providerMode = "paddle-preview";
      } catch {
        providerMode = "simulated";
      }
    }

    if (paddle) {
      const transaction = await paddle.transactions.create({
        items: checkoutItems,
        collectionMode: "automatic",
        customData: {
          userId: session.user.id,
          email: body.email ?? session.user.email ?? "",
          productName: body.productName || "PolicyPack",
          planId,
          planName: selectedPlan.name,
        },
      });
      providerMode = "paddle-checkout";

      return NextResponse.json({
        ok: true,
        simulated: false,
        providerMode,
        priceId: selectedPriceId || "non-catalog",
        planId,
        planName: selectedPlan.name,
        transactionId: transaction.id,
        checkoutUrl: transaction.checkout?.url ?? null,
        environment: config.environment,
        sandbox: config.environment === Environment.sandbox,
        previewTotal,
        checkoutLabel: `Unlock ${selectedPlan.name}`,
        legalUrls,
        verificationMode: "transaction-verified",
        premiumUnlocked: false,
        message:
          transaction.checkout?.url
            ? "Billing is ready. Opening your selected package now."
            : "Billing session was created, but the payment link was not returned.",
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: true,
      providerMode,
      priceId: selectedPriceId || "price_mock_policypack",
      planId,
      planName: selectedPlan.name,
      environment: config.environment,
      sandbox: config.environment === Environment.sandbox,
      previewTotal,
      checkoutLabel: `Unlock ${selectedPlan.name}`,
      legalUrls,
      verificationMode: paddle ? "transaction-verified" : "simulated",
      premiumUnlocked: false,
      message:
        "Billing is currently running in simulation mode because a live checkout session could not be created.",
    });
  } catch (error) {
    const formatted = formatCheckoutInitializationError(error);

    return NextResponse.json(
      formatted,
      { status: 500 },
    );
  }
}
