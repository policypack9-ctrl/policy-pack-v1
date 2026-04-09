import { NextResponse } from "next/server";
import { Environment } from "@paddle/paddle-node-sdk";

import { auth } from "@/auth";
import { setUserPremium } from "@/lib/auth-data";
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
        "Paddle sandbox is connected, but this account still needs a Default Payment Link in the Paddle dashboard before checkout can open.",
      details: message,
    };
  }

  return {
    error: "Unable to initialize Paddle checkout.",
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
    };
    const config = getPaddleConfig();
    const paddle = getPaddleClient();
    const baseUrl = getAuthBaseUrl();
    const legalUrls = getPaddleLegalUrls(baseUrl);
    let previewTotal: string | null = null;
    let providerMode:
      | "simulated"
      | "paddle-preview"
      | "paddle-checkout"
      | "paddle-verified" =
      "simulated";
    const checkoutItems = buildPolicyPackCheckoutItems(
      body.productName || "PolicyPack",
      config.priceId || undefined,
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
      const isVerified = isVerifiedPaddleTransactionStatus(
        verifiedTransaction.status,
      );

      if (isVerified) {
        await setUserPremium(session.user.id, true);
      }

      return NextResponse.json({
        ok: true,
        simulated: false,
        providerMode: "paddle-verified",
        transactionId: verifiedTransaction.id,
        verifiedStatus: verifiedTransaction.status,
        premiumUnlocked: isVerified,
        environment: config.environment,
        sandbox: config.environment === Environment.sandbox,
        legalUrls,
        message: isVerified
          ? "Paddle transaction verified. Premium export is now unlocked for this account."
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
        },
      });
      providerMode = "paddle-checkout";

      return NextResponse.json({
        ok: true,
        simulated: false,
        providerMode,
        priceId: config.priceId || "non-catalog",
        transactionId: transaction.id,
        checkoutUrl: transaction.checkout?.url ?? null,
        environment: config.environment,
        sandbox: config.environment === Environment.sandbox,
        previewTotal,
        checkoutLabel: `Unlock ${body.productName || "PolicyPack"}`,
        legalUrls,
        verificationMode: "transaction-verified",
        premiumUnlocked: false,
        message:
          transaction.checkout?.url
            ? "Sandbox checkout created. Redirecting to Paddle now."
            : "Checkout transaction created, but Paddle did not return a checkout URL.",
      });
    }

    return NextResponse.json({
      ok: true,
      simulated: true,
      providerMode,
      priceId: config.priceId || "price_mock_policypack",
      environment: config.environment,
      sandbox: config.environment === Environment.sandbox,
      previewTotal,
      checkoutLabel: `Unlock ${body.productName || "PolicyPack"}`,
      legalUrls,
      verificationMode: paddle ? "transaction-verified" : "simulated",
      premiumUnlocked: false,
      message:
        "Paddle sandbox checkout is still in simulation mode because a valid Paddle transaction could not be created.",
    });
  } catch (error) {
    const formatted = formatCheckoutInitializationError(error);

    return NextResponse.json(
      formatted,
      { status: 500 },
    );
  }
}
