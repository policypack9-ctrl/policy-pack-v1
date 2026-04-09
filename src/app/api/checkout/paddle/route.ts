import { NextResponse } from "next/server";

import { getPaddleClient, getPaddleConfig } from "@/lib/paddle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

    return NextResponse.json({
      ok: true,
      simulated: true,
      providerMode,
      priceId: config.priceId || "price_mock_policypack",
      environment: config.environment,
      previewTotal,
      checkoutLabel: `Unlock ${body.productName || "PolicyPack"}`,
      message:
        "Paddle checkout foundation is connected. This response simulates the unlock flow until production prices are configured.",
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
