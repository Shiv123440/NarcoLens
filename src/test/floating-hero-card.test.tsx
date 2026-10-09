import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { FloatingHeroCard } from "@/components/floating-hero-card";
import { MagneticButton } from "@/components/ui/magnetic-button";

describe("FloatingHeroCard and MagneticButton", () => {
  it("renders FloatingHeroCard with 3D wrapper and highlight overlay", () => {
    const { container } = render(
      <FloatingHeroCard>
        <h1>Test Title</h1>
        <p>Test description</p>
      </FloatingHeroCard>
    );

    const wrapper = container.querySelector(".app-hero-perspective-wrapper");
    expect(wrapper).toBeInTheDocument();

    const hero = container.querySelector(".app-hero-3d");
    expect(hero).toBeInTheDocument();
    expect(hero).toHaveAttribute("data-hover", "false");

    const highlight = container.querySelector(".app-hero-highlight");
    expect(highlight).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("activates on pointer enter and resets on pointer leave", () => {
    const { container } = render(
      <FloatingHeroCard>
        <div>Content</div>
      </FloatingHeroCard>
    );

    const wrapper = container.querySelector(".app-hero-perspective-wrapper");
    const hero = container.querySelector(".app-hero-3d");
    expect(wrapper).not.toBeNull();
    expect(hero).not.toBeNull();

    // Trigger pointer enter
    fireEvent.pointerEnter(wrapper!, { pointerType: "mouse" });
    expect(hero).toHaveAttribute("data-hover", "true");

    // Trigger pointer move for subtle push back
    fireEvent.pointerMove(wrapper!, { clientX: 200, clientY: 100, pointerType: "mouse" });

    // Trigger pointer leave
    fireEvent.pointerLeave(wrapper!);
    expect(hero).toHaveAttribute("data-hover", "false");
  });

  it("renders MagneticButton and handles mouse events without crashing", () => {
    const { container } = render(
      <MagneticButton strength={0.35} maxDistance={8}>
        <button type="button">Start Field Test</button>
      </MagneticButton>
    );

    const button = screen.getByRole("button", { name: "Start Field Test" });
    expect(button).toBeInTheDocument();

    const outerWrapper = container.firstElementChild as HTMLElement;
    expect(outerWrapper).toBeInTheDocument();

    // Mouse move over magnetic button
    fireEvent.mouseMove(outerWrapper, { clientX: 50, clientY: 50 });
    // Mouse leave resets
    fireEvent.mouseLeave(outerWrapper);
  });
});
