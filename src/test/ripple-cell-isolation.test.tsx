import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { RippleCell, InteractiveRippleGrid } from "@/components/ui/background-ripple-effect";

describe("RippleCell & InteractiveRippleGrid Isolation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a cell with position relative, overflow hidden, and isolated container", () => {
    const { container } = render(<RippleCell />);
    const cell = container.querySelector(".ripple-cell");
    expect(cell).toBeInTheDocument();
    expect(cell?.querySelector(".cell-ripple")).toBeNull();
  });

  it("confines the ripple exclusively to the clicked cell", () => {
    const { container } = render(
      <div className="test-grid">
        <RippleCell />
        <RippleCell />
        <RippleCell />
      </div>
    );

    const cells = Array.from(container.querySelectorAll(".ripple-cell")) as HTMLElement[];
    expect(cells).toHaveLength(3);

    const cell0 = cells[0]!;
    const cell1 = cells[1]!;
    const cell2 = cells[2]!;

    // Mock getBoundingClientRect for cell 0
    vi.spyOn(cell0, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 50,
      width: 60,
      height: 60,
      bottom: 110,
      right: 160,
      x: 100,
      y: 50,
      toJSON: () => {},
    });

    // Mock getBoundingClientRect for cell 1
    vi.spyOn(cell1, "getBoundingClientRect").mockReturnValue({
      left: 160,
      top: 50,
      width: 60,
      height: 60,
      bottom: 110,
      right: 220,
      x: 160,
      y: 50,
      toJSON: () => {},
    });

    // Mouse down on cell 0 at clientX=120, clientY=70 -> local (20px, 20px)
    fireEvent.mouseDown(cell0, { clientX: 120, clientY: 70, button: 0 });

    // Cell 0 should contain a ripple element, cells 1 & 2 must NOT have ripples
    const ripple0 = cell0.querySelector(".cell-ripple") as HTMLElement;
    expect(ripple0).toBeInTheDocument();
    expect(ripple0.getAttribute("data-x")).toBe("20");
    expect(ripple0.getAttribute("data-y")).toBe("20");

    expect(cell1.querySelector(".cell-ripple")).toBeNull();
    expect(cell2.querySelector(".cell-ripple")).toBeNull();

    // Now click cell 1 at clientX=185, clientY=80 -> local (25px, 30px)
    fireEvent.mouseDown(cell1, { clientX: 185, clientY: 80, button: 0 });

    const ripple1 = cell1.querySelector(".cell-ripple") as HTMLElement;
    expect(ripple1).toBeInTheDocument();
    expect(ripple1.getAttribute("data-x")).toBe("25");
    expect(ripple1.getAttribute("data-y")).toBe("30");
    expect(cell2.querySelector(".cell-ripple")).toBeNull();

    // Fast-forward past the 450ms animation duration
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Ripples should be cleaned up
    expect(cell0.querySelector(".cell-ripple")).toBeNull();
    expect(cell1.querySelector(".cell-ripple")).toBeNull();
  });

  it("renders InteractiveRippleGrid with container and cell elements", () => {
    const { container } = render(<InteractiveRippleGrid cellSize={64} />);
    const gridContainer = container.querySelector(".interactive-ripple-grid-container");
    expect(gridContainer).toBeInTheDocument();
  });
});
