import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { Vortex } from "@/components/ui/vortex";

describe("Vortex Background Component (@aceternity/vortex)", () => {
  it("renders canvas and children correctly", () => {
    const { container } = render(
      <Vortex
        backgroundColor="transparent"
        particleCount={100}
        baseHue={30}
      >
        <div data-testid="vortex-content">NarcoLens NCB Portal</div>
      </Vortex>
    );

    expect(screen.getByTestId("vortex-content")).toBeInTheDocument();
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders as a background layer with containerClassName", () => {
    const { container } = render(
      <div className="app-vortex-bg fixed inset-0 pointer-events-none z-0">
        <Vortex
          backgroundColor="transparent"
          particleCount={200}
          containerClassName="w-full h-full"
        />
      </div>
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });
});
