import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { NarcoLensSplash } from "@/components/NarcoLensSplash";

describe("NarcoLensSplash Cinematic Animation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the complete cinematic forensic splash overlay with brand elements", () => {
    const onComplete = vi.fn();
    const { container } = render(<NarcoLensSplash onComplete={onComplete} />);

    // Container
    const splash = screen.getByRole("status", { name: "Loading NarcoLens" });
    expect(splash).toBeInTheDocument();
    expect(splash).toHaveClass("nl-splash");

    // Atmospheric elements
    expect(container.querySelector(".nl-grid")).toBeInTheDocument();
    expect(container.querySelector(".nl-orbit--outer")).toBeInTheDocument();
    expect(container.querySelector(".nl-orbit--inner")).toBeInTheDocument();
    expect(container.querySelector(".nl-ring--one")).toBeInTheDocument();
    expect(container.querySelector(".nl-ring--two")).toBeInTheDocument();

    // Logo & Scan beam
    const logoImg = screen.getByRole("img", { name: "NarcoLens emblem" });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute("src", "/narcolens-logo.png");
    expect(container.querySelector(".nl-scan-beam")).toBeInTheDocument();

    // Wordmark & Subtitles
    expect(screen.getByText("Narco")).toBeInTheDocument();
    expect(screen.getByText("Lens")).toBeInTheDocument();
    expect(screen.getByText("NARCOTICS CONTROL BUREAU")).toBeInTheDocument();
    expect(screen.getByText(/INITIALIZING FORENSIC SYSTEMS/)).toBeInTheDocument();

    // Footer telemetry
    expect(screen.getByText("NL / SYSTEM INIT")).toBeInTheDocument();
    expect(screen.getByText("SECURE ENVIRONMENT")).toBeInTheDocument();
  });

  it("adds exiting class at ~2550ms and triggers onComplete at ~3050ms", () => {
    const onComplete = vi.fn();
    render(<NarcoLensSplash onComplete={onComplete} />);

    const splash = screen.getByRole("status");
    expect(splash).not.toHaveClass("nl-splash--exit");
    expect(onComplete).not.toHaveBeenCalled();

    // Advance past 2550ms
    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(splash).toHaveClass("nl-splash--exit");
    expect(onComplete).not.toHaveBeenCalled();

    // Advance to 3050ms
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("cleans up active timers when unmounted early", () => {
    const onComplete = vi.fn();
    const { unmount } = render(<NarcoLensSplash onComplete={onComplete} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("fast-tracks completion when prefers-reduced-motion is active", () => {
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

    const onComplete = vi.fn();
    render(<NarcoLensSplash onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
