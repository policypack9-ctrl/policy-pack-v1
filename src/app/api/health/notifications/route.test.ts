import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  isAdminEmailAllowedMock,
  checkSmtpConnectionMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  isAdminEmailAllowedMock: vi.fn(),
  checkSmtpConnectionMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/auth-env", () => ({
  isAdminEmailAllowed: isAdminEmailAllowedMock,
}));

vi.mock("@/lib/notifications", () => ({
  checkSmtpConnection: checkSmtpConnectionMock,
}));

import { GET } from "@/app/api/health/notifications/route";

describe("GET /api/health/notifications", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.HEALTHCHECK_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects unauthenticated requests without an admin session or secret", async () => {
    authMock.mockResolvedValue(null);
    isAdminEmailAllowedMock.mockReturnValue(false);

    const response = await GET(
      new Request("https://policypack.org/api/health/notifications"),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "Forbidden.",
    });
    expect(checkSmtpConnectionMock).not.toHaveBeenCalled();
  });

  it("accepts requests authorized by HEALTHCHECK_SECRET and returns a redacted payload", async () => {
    process.env.HEALTHCHECK_SECRET = "health_secret";
    checkSmtpConnectionMock.mockResolvedValue({
      status: "ok",
      message: "SMTP connection is working",
      config: {
        host: "smtp.example.com",
      },
    });

    const response = await GET(
      new Request("https://policypack.org/api/health/notifications", {
        headers: {
          "x-healthcheck-secret": "health_secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      status: "ok",
    });
    expect(authMock).not.toHaveBeenCalled();
  });
});
