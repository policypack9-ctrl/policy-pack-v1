import { Environment } from "@paddle/paddle-node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAppUserProfileByBillingReferenceMock,
  getAppUserProfileByEmailMock,
  getAppUserProfileByIdMock,
  setUserBillingStateMock,
  sendAdminNotificationMock,
  sendPaymentReceiptEmailMock,
  getPaddleClientMock,
  getPaddleConfigMock,
  getPaddleMismatchMessageMock,
  hasPaddleEnvironmentMismatchMock,
} = vi.hoisted(() => ({
  getAppUserProfileByBillingReferenceMock: vi.fn(),
  getAppUserProfileByEmailMock: vi.fn(),
  getAppUserProfileByIdMock: vi.fn(),
  setUserBillingStateMock: vi.fn(),
  sendAdminNotificationMock: vi.fn(),
  sendPaymentReceiptEmailMock: vi.fn(),
  getPaddleClientMock: vi.fn(),
  getPaddleConfigMock: vi.fn(),
  getPaddleMismatchMessageMock: vi.fn(),
  hasPaddleEnvironmentMismatchMock: vi.fn(),
}));

vi.mock("@/lib/auth-data", () => ({
  getAppUserProfileByBillingReference: getAppUserProfileByBillingReferenceMock,
  getAppUserProfileByEmail: getAppUserProfileByEmailMock,
  getAppUserProfileById: getAppUserProfileByIdMock,
  setUserBillingState: setUserBillingStateMock,
}));

vi.mock("@/lib/notifications", () => ({
  sendAdminNotification: sendAdminNotificationMock,
  sendPaymentReceiptEmail: sendPaymentReceiptEmailMock,
}));

vi.mock("@/lib/paddle", async () => {
  return {
    getPaddleClient: getPaddleClientMock,
    getPaddleConfig: getPaddleConfigMock,
    getPaddleMismatchMessage: getPaddleMismatchMessageMock,
    hasPaddleEnvironmentMismatch: hasPaddleEnvironmentMismatchMock,
  };
});

import { POST } from "@/app/api/webhooks/paddle/route";

describe("POST /api/webhooks/paddle", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getPaddleConfigMock.mockReturnValue({
      apiKey: "pdl_sdbx_test",
      webhookSecret: "whsec_test",
      environment: Environment.sandbox,
    });
    getPaddleMismatchMessageMock.mockReturnValue("mismatch");
    hasPaddleEnvironmentMismatchMock.mockReturnValue(false);
    sendAdminNotificationMock.mockResolvedValue({ ok: true, skipped: false });
    sendPaymentReceiptEmailMock.mockResolvedValue({ ok: true, skipped: false });
  });

  it("downgrades a canceled premium subscription after the access window ends", async () => {
    getAppUserProfileByIdMock.mockResolvedValue({
      userId: "user_1",
      planId: "premium",
      isPremium: true,
      premiumUnlockedAt: "2026-03-01T00:00:00.000Z",
      billingStatus: "active",
    });
    setUserBillingStateMock.mockResolvedValue({
      userId: "user_1",
      planId: "premium",
      isPremium: false,
      billingStatus: "canceled",
    });
    getPaddleClientMock.mockReturnValue({
      webhooks: {
        unmarshal: vi.fn().mockResolvedValue({
          eventType: "subscription.canceled",
          data: {
            id: "sub_1",
            customData: {
              userId: "user_1",
              email: "owner@example.com",
              planId: "premium",
            },
          },
        }),
      },
      subscriptions: {
        get: vi.fn().mockResolvedValue({
          id: "sub_1",
          status: "canceled",
          nextBilledAt: null,
          canceledAt: "2026-04-01T00:00:00.000Z",
          currentBillingPeriod: {
            endsAt: "2026-04-01T00:00:00.000Z",
          },
          customData: {
            userId: "user_1",
            email: "owner@example.com",
            planId: "premium",
          },
        }),
      },
    });

    const response = await POST(
      new Request("https://policypack.org/api/webhooks/paddle", {
        method: "POST",
        headers: {
          "paddle-signature": "sig_test",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      eventType: "subscription.canceled",
      billingStatus: "canceled",
      premiumUpdated: false,
    });
    expect(setUserBillingStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        planId: "premium",
        billingStatus: "canceled",
        isPremium: false,
      }),
    );
  });

  it("revokes starter access when a refund adjustment is approved", async () => {
    getAppUserProfileByBillingReferenceMock.mockResolvedValue({
      userId: "user_1",
      planId: "starter",
      isPremium: true,
      premiumUnlockedAt: "2026-04-01T00:00:00.000Z",
      billingStatus: "one_time",
    });
    setUserBillingStateMock.mockResolvedValue({
      userId: "user_1",
      planId: "starter",
      isPremium: false,
      billingStatus: "refunded",
    });
    getPaddleClientMock.mockReturnValue({
      webhooks: {
        unmarshal: vi.fn().mockResolvedValue({
          eventType: "adjustment.updated",
          data: {
            id: "adj_1",
            action: "refund",
            status: "approved",
            transactionId: "txn_1",
            subscriptionId: null,
          },
        }),
      },
      transactions: {
        get: vi.fn(),
      },
    });

    const response = await POST(
      new Request("https://policypack.org/api/webhooks/paddle", {
        method: "POST",
        headers: {
          "paddle-signature": "sig_test",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      eventType: "adjustment.updated",
      billingStatus: "refunded",
      premiumUpdated: false,
    });
    expect(setUserBillingStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        planId: "starter",
        billingStatus: "refunded",
        isPremium: false,
        paddleTransactionId: "txn_1",
      }),
    );
  });
});
