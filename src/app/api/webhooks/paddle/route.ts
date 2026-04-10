import { NextResponse } from "next/server";

import { getAppUserProfileByEmail, setUserPremium } from "@/lib/auth-data";
import { sendAdminNotification } from "@/lib/notifications";
import {
  getPaddleClient,
  getPaddleConfig,
  getPaddleMismatchMessage,
  hasPaddleEnvironmentMismatch,
  isVerifiedPaddleTransactionStatus,
} from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaddleTransactionWebhookData = {
  id?: string | null;
  status?: string | null;
  customData?: {
    userId?: string;
    user_id?: string;
    email?: string;
    productName?: string;
    planId?: string;
    planName?: string;
  } | null;
};

function readWebhookUserId(data: PaddleTransactionWebhookData) {
  return data.customData?.userId ?? data.customData?.user_id ?? "";
}

function readWebhookEmail(data: PaddleTransactionWebhookData) {
  return data.customData?.email ?? "";
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

    const transactionData = event.data as PaddleTransactionWebhookData;
    const transactionId = transactionData.id ?? "";
    let userId = readWebhookUserId(transactionData);

    if (!transactionId) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        eventType: event.eventType,
        reason: "Transaction webhook did not include a transaction id.",
      });
    }

    const verifiedTransaction = await paddle.transactions.get(transactionId);
    const isPaid = isVerifiedPaddleTransactionStatus(verifiedTransaction.status);

    if (!userId) {
      const email =
        readWebhookEmail(transactionData) ||
        verifiedTransaction.customer?.email ||
        "";
      const profile = email ? await getAppUserProfileByEmail(email) : null;
      userId = profile?.userId ?? "";
    }

    if (isPaid && userId) {
      await setUserPremium(userId, true);

      void sendAdminNotification({
        kind: "payment",
        subject: "New PolicyPack payment confirmed",
        summary:
          "A customer payment was verified successfully and workspace access was unlocked.",
        details: [
          { label: "User ID", value: userId },
          {
            label: "Email",
            value:
              readWebhookEmail(transactionData) ||
              verifiedTransaction.customer?.email ||
              "Unknown",
          },
          {
            label: "Package",
            value:
              transactionData.customData?.planName ??
              transactionData.customData?.planId ??
              "Not specified",
          },
          { label: "Transaction ID", value: transactionId },
          {
            label: "Status",
            value: verifiedTransaction.status ?? "Unknown",
          },
        ],
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      eventType: event.eventType,
      transactionId,
      verifiedStatus: verifiedTransaction.status,
      premiumUpdated: isPaid && Boolean(userId),
      matchedUserId: userId || null,
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
