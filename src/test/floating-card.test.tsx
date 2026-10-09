import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { FloatingCard } from "@/components/ui/floating-card";

describe("FloatingCard Component", () => {
  it("renders children and default classes", () => {
    const { getByText, container } = render(
      <FloatingCard>
        <div>Test Content</div>
      </FloatingCard>
    );

    expect(getByText("Test Content")).toBeDefined();
    const card = container.querySelector(".app-floating-card-3d");
    expect(card).not.toBeNull();
    expect(card?.getAttribute("data-hover")).toBe("false");
  });

  it("sets hover data-attribute on pointer enter", () => {
    const { container } = render(
      <FloatingCard maxRotateX={3} maxRotateY={4} lift={-5}>
        <div>Card Inner</div>
      </FloatingCard>
    );

    const wrapper = container.querySelector(".app-floating-perspective-wrapper") as HTMLElement;
    const card = container.querySelector(".app-floating-card-3d") as HTMLElement;

    expect(card.getAttribute("data-hover")).toBe("false");

    fireEvent.pointerEnter(wrapper, { pointerType: "mouse" });
    expect(card.getAttribute("data-hover")).toBe("true");

    fireEvent.pointerLeave(wrapper);
    expect(card.getAttribute("data-hover")).toBe("false");
  });

  it("calculates perspective rotation values on pointer move", () => {
    const { container } = render(
      <FloatingCard maxRotateX={4} maxRotateY={5} lift={-6}>
        <div>Move Content</div>
      </FloatingCard>
    );

    const wrapper = container.querySelector(".app-floating-perspective-wrapper") as HTMLElement;
    const card = container.querySelector(".app-floating-card-3d") as HTMLElement;

    vi.spyOn(wrapper, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerEnter(wrapper, { pointerType: "mouse" });
    fireEvent.pointerMove(wrapper, { clientX: 150, clientY: 75, pointerType: "mouse" });

    // Should stay within bounds without error
    expect(card.getAttribute("data-hover")).toBe("true");
  });
});
