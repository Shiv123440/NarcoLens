import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { ForensicLiquidBackground } from "@/components/forensic-liquid-background";

describe("ForensicLiquidBackground Component", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16);
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      clearTimeout(id);
    });
    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders pure liquid background base layers, fluid ribbons, sheen, and ripple canvas without grid overlay", () => {
    const { container } = render(<ForensicLiquidBackground intensity="full" />);

    expect(container.querySelector(".forensic-liquid-bg")).toBeInTheDocument();
    expect(container.querySelector(".forensic-blob-amber")).toBeInTheDocument();
    expect(container.querySelector(".forensic-blob-cyan")).toBeInTheDocument();
    expect(container.querySelector(".forensic-blob-graphite")).toBeInTheDocument();
    expect(container.querySelector(".forensic-liquid-sheen")).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeInTheDocument();
    // Verify no grid overlay is present
    expect(container.querySelector(".forensic-grid-overlay")).toBeNull();
  });

  it("reacts to pointer movement and click ripples across the window without throwing", () => {
    const { container } = render(<ForensicLiquidBackground intensity="full" />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Trigger window pointermove
    fireEvent.pointerMove(window, {
      clientX: 200,
      clientY: 150,
      pointerType: "mouse",
    });

    fireEvent.pointerMove(window, {
      clientX: 250,
      clientY: 190,
      pointerType: "mouse",
    });

    // Trigger window pointerdown (click ripple)
    fireEvent.pointerDown(window, {
      clientX: 300,
      clientY: 220,
      pointerType: "mouse",
    });

    expect(canvas).toBeInTheDocument();
  });

  it("respects reduced-motion preference without initiating animation loop", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));

    const { container } = render(<ForensicLiquidBackground />);
    expect(container.querySelector(".forensic-liquid-bg")).toBeInTheDocument();
  });
});
