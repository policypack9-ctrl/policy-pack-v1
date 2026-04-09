import { NextResponse } from "next/server";
import { Environment } from "@paddle/paddle-node-sdk";

import { auth } from "@/auth";
import { setUserPremium } from "@/lib/auth-data";
import {
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
    let providerMode: "simulated" | "paddle-preview" | "paddle-verified" =
      "simulated";

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

    if (paddle && config.priceId) {
      try {
        const preview = await paddle.transactions.preview({
          items: [{ priceId: config.priceId, quantity: 1 }],
        });
        previewTotal = preview.details?.totals?.grandTotal ?? null;
        providerMode = "paddle-preview";
      } catch {
        providerMode = "simulated";
      }
    }

    await setUserPremium(session.user.id, true);

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
        providerMode === "paddle-preview"
          ? "Paddle checkout preview is ready. Complete checkout in Paddle and send the transaction id back for verification, or rely on the webhook route."
          : "Paddle sandbox checkout is still in simulation mode because a valid Paddle transaction could not be verified yet.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to initialize Paddle checkout.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
