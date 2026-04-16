import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  pushMock,
  updateMock,
  useSessionMock,
  loadStoredPolicySessionMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  updateMock: vi.fn(),
  useSessionMock: vi.fn(),
  loadStoredPolicySessionMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: useSessionMock,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: new Proxy(
    {},
    {
      get: () =>
        ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
          <div {...props}>{children}</div>
        ),
    },
  ),
  useReducedMotion: () => false,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/premium-button", () => ({
  PremiumButton: ({
    children,
    icon,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }) => (
    <button {...props}>
      {icon}
      {children}
    </button>
  ),
}));

vi.mock("@/lib/db", () => ({
  loadStoredPolicySession: loadStoredPolicySessionMock,
}));

import { GenerationResult } from "@/components/onboarding/generation-result";

describe("GenerationResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: {
        user: {
          email: "owner@example.com",
          isPremium: false,
        },
      },
      status: "authenticated",
      update: updateMock,
    });
    loadStoredPolicySessionMock.mockReturnValue({
      answers: {
        businessName: "PolicyPack",
        companyLocation: "United States",
        customerRegions: [],
        selectedPages: [],
        planSelection: "",
      },
      completedAt: "2026-04-16T00:00:00.000Z",
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects to the dashboard transaction handoff when the checkout API returns a transaction id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactionId: "txn_123",
        message: "Billing is ready.",
      }),
    } as Response);

    render(
      <GenerationResult
        initialLaunchSnapshot={{
          registeredUsers: 0,
          freeUserLimit: 0,
          freeSpotsRemaining: 0,
          freeGenerationClosed: true,
          showUrgencyBanner: false,
          bannerTone: "closed",
          bannerText: "",
          bannerDescription: "",
          calloutLabel: "",
          userRank: null,
          isEligibleLaunchUser: false,
          hasUsedComplimentaryDocument: true,
          complimentaryDocumentsRemaining: 0,
          canGenerateComplimentaryDocument: false,
          requiresPaymentWall: true,
          promoActive: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose a Package" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose Starter" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/checkout/paddle",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard?_ptxn=txn_123");
    });
  });

  it("redirects to login when billing starts after the session has expired", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Authentication required.",
      }),
    } as Response);

    render(
      <GenerationResult
        initialLaunchSnapshot={{
          registeredUsers: 0,
          freeUserLimit: 0,
          freeSpotsRemaining: 0,
          freeGenerationClosed: true,
          showUrgencyBanner: false,
          bannerTone: "closed",
          bannerText: "",
          bannerDescription: "",
          calloutLabel: "",
          userRank: null,
          isEligibleLaunchUser: false,
          hasUsedComplimentaryDocument: true,
          complimentaryDocumentsRemaining: 0,
          canGenerateComplimentaryDocument: false,
          requiresPaymentWall: true,
          promoActive: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose a Package" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose Starter" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login?callbackUrl=%2Fonboarding%2Fresult");
    });
  });
});
