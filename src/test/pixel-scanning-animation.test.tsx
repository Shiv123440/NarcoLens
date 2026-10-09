import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React, { useState, useRef } from "react";
import { ImageGenerationLoader } from "@/components/ui/image-generation-loader";

// Mock canvas getContext and ResizeObserver / IntersectionObserver for test environment
beforeEach(() => {
  vi.useFakeTimers();

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    getImageData: vi.fn().mockReturnValue({ data: [56, 189, 248, 255] }),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  });

  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  global.IntersectionObserver = class {
    constructor(callback: any) {
      // Trigger as intersecting immediately
      callback([{ isIntersecting: true }]);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Test component reproducing PhotoStep evidence capture and scanning animation logic
function EvidencePhotoScanningHarness({
  initialPhoto = "blob:http://localhost/test-evidence-image.jpg",
}: {
  initialPhoto?: string | null;
}) {
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisCompletedCount, setAnalysisCompletedCount] = useState(0);
  const analysingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startAnalysis = () => {
    if (isAnalysing || !photo) return;
    setIsAnalysing(true);
    if (analysingTimeoutRef.current) {
      clearTimeout(analysingTimeoutRef.current);
    }
    analysingTimeoutRef.current = setTimeout(() => {
      setIsAnalysing(false);
      setAnalysisCompletedCount((c) => c + 1);
      analysingTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <div data-testid="evidence-harness">
      {photo && (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-xl">
          <img
            src={photo}
            alt="Captured evidence"
            className="block h-auto w-full max-h-[460px] object-contain mx-auto select-none"
          />

          {isAnalysing && (
            <div
              data-testid="scanning-overlay"
              className="absolute inset-0 z-10 bg-black/55 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
              aria-live="polite"
              aria-busy="true"
            >
              <ImageGenerationLoader
                effect="scale-wave"
                easing="ease-in-out"
                text="Analysing Evidence"
                cellSize={3}
                gap={1}
                bandHeight={48}
                colors={["#38BDF8", "#1D4ED8"]}
              />
            </div>
          )}
        </div>
      )}

      <div className="actions mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (!isAnalysing) setPhoto(null);
          }}
          disabled={isAnalysing}
        >
          Replace
        </button>
        <button
          type="button"
          onClick={startAnalysis}
          disabled={!photo || isAnalysing}
        >
          {isAnalysing ? "Analysing…" : "Analyse"}
        </button>
      </div>

      <div data-testid="completed-counter">{analysisCompletedCount}</div>
    </div>
  );
}

describe("NarcoLens Pixel-Scanning Animation", () => {
  it("renders the captured evidence image without animation initially", () => {
    render(<EvidencePhotoScanningHarness />);
    const img = screen.getByAltText("Captured evidence");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("blob:http://localhost/test-evidence-image.jpg");
    expect(screen.queryByTestId("scanning-overlay")).toBeNull();
    expect(screen.getByRole("button", { name: "Analyse" })).toBeDefined();
  });

  it("triggers ImageGenerationLoader with scale-wave and Analysing Evidence text when Analyse is clicked", () => {
    render(<EvidencePhotoScanningHarness />);
    const analyseBtn = screen.getByRole("button", { name: "Analyse" });

    fireEvent.click(analyseBtn);

    // Overlay is active
    expect(screen.getByTestId("scanning-overlay")).toBeDefined();
    expect(screen.getByRole("button", { name: "Analysing…" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Analysing…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Replace" }).hasAttribute("disabled")).toBe(true);
  });

  it("prevents overlapping animation triggers while actively analysing", () => {
    render(<EvidencePhotoScanningHarness />);
    const analyseBtn = screen.getByRole("button", { name: "Analyse" });

    fireEvent.click(analyseBtn);
    // Click again while animating
    fireEvent.click(analyseBtn);

    // Fast-forward 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Still analysing
    expect(screen.getByTestId("scanning-overlay")).toBeDefined();

    // Fast-forward 1000ms to hit exactly 3000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Completed exactly once
    expect(screen.queryByTestId("scanning-overlay")).toBeNull();
    expect(screen.getByTestId("completed-counter").textContent).toBe("1");
  });

  it("stops animation after 3 seconds and restores the original UI", () => {
    render(<EvidencePhotoScanningHarness />);
    const analyseBtn = screen.getByRole("button", { name: "Analyse" });

    fireEvent.click(analyseBtn);
    expect(screen.getByTestId("scanning-overlay")).toBeDefined();

    // Advance 3000ms
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Overlay gone, button back to 'Analyse' and enabled
    expect(screen.queryByTestId("scanning-overlay")).toBeNull();
    const restoredBtn = screen.getByRole("button", { name: "Analyse" });
    expect(restoredBtn).toBeDefined();
    expect(restoredBtn.hasAttribute("disabled")).toBe(false);
    expect(screen.getByRole("button", { name: "Replace" }).hasAttribute("disabled")).toBe(false);
  });
});
