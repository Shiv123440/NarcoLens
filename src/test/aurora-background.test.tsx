import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";

describe("AuroraBackground Component", () => {
  it("renders aurora background layers with animation classes", () => {
    const { container } = render(
      <AuroraBackground showRadialGradient={true}>
        <div data-testid="test-content">Forensics Dashboard</div>
      </AuroraBackground>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    const auroraLayer = container.querySelector(".after\\:animate-aurora");
    expect(auroraLayer).toBeInTheDocument();
  });

  it("can render standalone without children as an ambient backdrop", () => {
    const { container } = render(
      <AuroraBackground className="app-aurora-bg" showRadialGradient={true} />
    );

    const auroraLayer = container.querySelector(".after\\:animate-aurora");
    expect(auroraLayer).toBeInTheDocument();
  });
});
