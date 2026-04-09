import { NextResponse } from "next/server";
import { Environment } from "@paddle/paddle-node-sdk";

import { auth } from "@/auth";
import { setUserPremium } from "@/lib/auth-data";
import { getPaddleClient, getPaddleConfig } from "@/lib/paddle";

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
    };
    const config = getPaddleConfig();
    const paddle = getPaddleClient();
    let previewTotal: string | null = null;
    let providerMode: "simulated" | "paddle-preview" = "simulated";

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
      message:
        "Paddle sandbox checkout completed. Premium export is now unlocked for this account.",
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
