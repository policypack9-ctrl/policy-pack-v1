import { Environment } from "@paddle/paddle-node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getAppUserProfileByIdMock,
  setUserBillingStateMock,
  sendAdminNotificationMock,
  sendPaymentReceiptEmailMock,
  getPaddleClientMock,
  getPaddleConfigMock,
  getPaddleLegalUrlsMock,
  getPaddleMismatchMessageMock,
  hasPaddleEnvironmentMismatchMock,
  getAuthBaseUrlMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAppUserProfileByIdMock: vi.fn(),
  setUserBillingStateMock: vi.fn(),
  sendAdminNotificationMock: vi.fn(),
  sendPaymentReceiptEmailMock: vi.fn(),
  getPaddleClientMock: vi.fn(),
  getPaddleConfigMock: vi.fn(),
  getPaddleLegalUrlsMock: vi.fn(),
  getPaddleMismatchMessageMock: vi.fn(),
  hasPaddleEnvironmentMismatchMock: vi.fn(),
  getAuthBaseUrlMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/auth-data", () => ({
  getAppUserProfileById: getAppUserProfileByIdMock,
  setUserBillingState: setUserBillingStateMock,
}));

vi.mock("@/lib/notifications", () => ({
  sendAdminNotification: sendAdminNotificationMock,
  sendPaymentReceiptEmail: sendPaymentReceiptEmailMock,
}));

vi.mock("@/lib/paddle", async () => {
  return {
    buildPolicyPackCheckoutItems: vi.fn(() => [
      {
        priceId: "pri_test",
        quantity: 1,
      },
    ]),
    getPaddleClient: getPaddleClientMock,
    getPaddleConfig: getPaddleConfigMock,
    getPaddleLegalUrls: getPaddleLegalUrlsMock,
    getPaddleMismatchMessage: getPaddleMismatchMessageMock,
    hasPaddleEnvironmentMismatch: hasPaddleEnvironmentMismatchMock,
    isVerifiedPaddleTransactionStatus: vi.fn((status: string | null | undefined) =>
      ["paid", "completed"].includes(status ?? ""),
    ),
  };
});

vi.mock("@/lib/auth-env", () => ({
  getAuthBaseUrl: getAuthBaseUrlMock,
}));

import { POST } from "@/app/api/checkout/paddle/route";

describe("POST /api/checkout/paddle", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.mockResolvedValue({
      user: {
        id: "user_1",
        email: "owner@example.com",
      },
    });
    getAppUserProfileByIdMock.mockResolvedValue({
      userId: "user_1",
      planId: "free",
      isPremium: false,
      premiumUnlockedAt: null,
    });
    setUserBillingStateMock.mockResolvedValue({
      userId: "user_1",
      planId: "starter",
      isPremium: true,
      billingStatus: "one_time",
      premiumUnlockedAt: "2026-04-13T00:00:00.000Z",
    });
    sendAdminNotificationMock.mockResolvedValue({ ok: true, skipped: false });
    sendPaymentReceiptEmailMock.mockResolvedValue({ ok: true, skipped: false });
    getPaddleConfigMock.mockReturnValue({
      apiKey: "pdl_sdbx_test",
      starterPriceId: "",
      premiumPriceId: "",
      webhookSecret: "",
      environment: Environment.sandbox,
    });
    getPaddleLegalUrlsMock.mockReturnValue({
      privacyPolicy: "https://policypack.org/privacy",
      terms: "https://policypack.org/terms",
      refundPolicy: "https://policypack.org/refund-policy",
    });
    getPaddleMismatchMessageMock.mockReturnValue("mismatch");
    hasPaddleEnvironmentMismatchMock.mockReturnValue(false);
    getAuthBaseUrlMock.mockReturnValue("https://policypack.org");
  });

  it("rejects a verified transaction that belongs to another user", async () => {
    getPaddleClientMock.mockReturnValue({
      transactions: {
        get: vi.fn().mockResolvedValue({
          id: "txn_shared",
          status: "paid",
          subscriptionId: null,
          billingPeriod: null,
          customData: {
            userId: "user_2",
            planId: "premium",
          },
          customer: { email: "other@example.com" },
        }),
      },
    });

    const response = await POST(
      new Request("https://policypack.org/api/checkout/paddle", {
        method: "POST",
        body: JSON.stringify({ transactionId: "txn_shared" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "This transaction does not belong to the signed-in account.",
    });
    expect(setUserBillingStateMock).not.toHaveBeenCalled();
  });

  it("updates billing state when the verified transaction belongs to the current user", async () => {
    getPaddleClientMock.mockReturnValue({
      transactions: {
        get: vi.fn().mockResolvedValue({
          id: "txn_owned",
          status: "paid",
          subscriptionId: null,
          billingPeriod: null,
          customData: {
            userId: "user_1",
            planId: "starter",
            planName: "Starter Pages",
          },
          customer: { email: "owner@example.com" },
        }),
      },
    });

    const response = await POST(
      new Request("https://policypack.org/api/checkout/paddle", {
        method: "POST",
        body: JSON.stringify({ transactionId: "txn_owned" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      premiumUnlocked: true,
      verifiedStatus: "paid",
    });
    expect(setUserBillingStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        planId: "starter",
        billingStatus: "one_time",
        isPremium: true,
        paddleTransactionId: "txn_owned",
      }),
    );
  });
});
