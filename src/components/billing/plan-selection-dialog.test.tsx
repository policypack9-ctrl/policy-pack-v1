import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { PlanSelectionDialog } from "@/components/billing/plan-selection-dialog";

describe("PlanSelectionDialog", () => {
  it("calls onSelectPlan with starter and premium ids", () => {
    const onSelectPlan = vi.fn();

    render(
      <PlanSelectionDialog
        isOpen
        onClose={() => {}}
        onSelectPlan={onSelectPlan}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose Starter" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose Premium" }));

    expect(onSelectPlan).toHaveBeenNthCalledWith(1, "starter", undefined);
    expect(onSelectPlan).toHaveBeenNthCalledWith(2, "premium", undefined);
  });

  it("passes a normalized discount code when selecting a paid plan", () => {
    const onSelectPlan = vi.fn();

    render(
      <PlanSelectionDialog
        isOpen
        onClose={() => {}}
        onSelectPlan={onSelectPlan}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Optional coupon, e.g. Z93W4KXOXO"), {
      target: { value: "z93w4kxoxo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Choose Starter" }));

    expect(onSelectPlan).toHaveBeenCalledWith("starter", "Z93W4KXOXO");
  });

  it("shows inline discount feedback and clears it when the code changes", () => {
    const onDiscountCodeChange = vi.fn();

    render(
      <PlanSelectionDialog
        isOpen
        onClose={() => {}}
        onSelectPlan={() => {}}
        onDiscountCodeChange={onDiscountCodeChange}
        discountError="Invalid discount code."
      />,
    );

    expect(screen.queryByText("Invalid discount code.")).not.toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Optional coupon, e.g. Z93W4KXOXO"), {
      target: { value: "newcode" },
    });

    expect(onDiscountCodeChange).toHaveBeenCalledWith("NEWCODE");
  });
});
