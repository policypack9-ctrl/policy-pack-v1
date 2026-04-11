import { NextResponse } from "next/server";
import { checkSmtpConnection } from "@/lib/notifications";

// Ensure this route is evaluated dynamically, so we always get the latest state
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkSmtpConnection();

  if (result.status === "ok") {
    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
      config: result.config,
    });
  }

  // Return 500 or 503 for error/unconfigured states so monitoring tools can pick it up
  return NextResponse.json(
    {
      success: false,
      status: result.status,
      message: result.message,
      config: result.config,
    },
    { status: result.status === "unconfigured" ? 503 : 500 }
  );
}
