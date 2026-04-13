import { describe, expect, it } from "vitest";

import {
  buildBillingUpdateFromTransaction,
  hasActiveBillingAccess,
} from "@/lib/billing-state";

describe("billing-state", () => {
  it("keeps canceled premium access active until the billing period ends", () => {
    expect(
      hasActiveBillingAccess({
        planId: "premium",
        billingStatus: "canceled",
        currentPeriodEndsAt: "2099-01-01T00:00:00.000Z",
        isPremium: true,
      }),
    ).toBe(true);

    expect(
      hasActiveBillingAccess({
        planId: "premium",
        billingStatus: "canceled",
        currentPeriodEndsAt: "2000-01-01T00:00:00.000Z",
        isPremium: true,
      }),
    ).toBe(false);
  });

  it("treats starter purchases as one-time paid access", () => {
    expect(
      buildBillingUpdateFromTransaction({
        customData: { planId: "starter" },
        status: "paid",
        transactionId: "txn_123",
        subscriptionId: null,
        currentPeriodEndsAt: null,
      }),
    ).toMatchObject({
      planId: "starter",
      billingStatus: "one_time",
      isPremium: true,
      paddleTransactionId: "txn_123",
      paddleSubscriptionId: null,
    });
  });
});
