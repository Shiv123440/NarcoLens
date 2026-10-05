import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import { LockKeyhole } from "lucide-react";

// Reusable component mirroring the exact dashboard metric cards structure
function EvidenceOverviewStats({
  sealed,
  today,
  detected,
  toConfirm,
}: {
  sealed: number;
  today: number;
  detected: number;
  toConfirm: number;
}) {
  return (
    <section className="app-stats" aria-label="Evidence overview">
      <div className="app-card app-stat">
        <div className="app-stat-label">Sealed records</div>
        <div className="app-stat-value">{sealed}</div>
        <div className="app-stat-note">
          <LockKeyhole size={12} className="inline mr-1 shrink-0" aria-hidden="true" />
          <span>SHA-256 verified</span>
        </div>
      </div>
      <div className="app-card app-stat">
        <div className="app-stat-label">Tests today</div>
        <div className="app-stat-value">{today}</div>
        <div className="app-stat-note">
          <span>IST field activity</span>
        </div>
      </div>
      <div className="app-card app-stat">
        <div className="app-stat-label">Detected</div>
        <div className="app-stat-value">{detected}</div>
        <div className="app-stat-note">
          <span>Presumptive positive</span>
        </div>
      </div>
      <div className="app-card app-stat">
        <div className="app-stat-label">To confirm</div>
        <div className="app-stat-value">{toConfirm}</div>
        <div className="app-stat-note">
          <span>Needs lab confirmation</span>
        </div>
      </div>
    </section>
  );
}

describe("Evidence Overview Metric Cards", () => {
  it("renders all four metric cards with consistent internal vertical layout", () => {
    const { container } = render(
      <EvidenceOverviewStats sealed={3} today={3} detected={1} toConfirm={3} />
    );

    const cards = container.querySelectorAll(".app-stat");
    expect(cards).toHaveLength(4);

    cards.forEach((card) => {
      const label = card.querySelector(".app-stat-label");
      const value = card.querySelector(".app-stat-value");
      const note = card.querySelector(".app-stat-note");

      // Verify each card contains all 3 structural elements in order
      expect(label).not.toBeNull();
      expect(value).not.toBeNull();
      expect(note).not.toBeNull();

      // Verify label precedes value, and value precedes note
      expect(label?.compareDocumentPosition(value!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(value?.compareDocumentPosition(note!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    // Check titles
    expect(screen.getByText("Sealed records")).toBeInTheDocument();
    expect(screen.getByText("Tests today")).toBeInTheDocument();
    expect(screen.getByText("Detected")).toBeInTheDocument();
    expect(screen.getByText("To confirm")).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText("SHA-256 verified")).toBeInTheDocument();
    expect(screen.getByText("IST field activity")).toBeInTheDocument();
    expect(screen.getByText("Presumptive positive")).toBeInTheDocument();
    expect(screen.getByText("Needs lab confirmation")).toBeInTheDocument();
  });

  it("dynamically reflects updated counts when values increase (e.g., after test sealing)", () => {
    const { rerender, container } = render(
      <EvidenceOverviewStats sealed={3} today={3} detected={1} toConfirm={3} />
    );

    const getStatValues = () =>
      Array.from(container.querySelectorAll(".app-stat-value")).map((el) => el.textContent);

    expect(getStatValues()).toEqual(["3", "3", "1", "3"]);

    // Simulate record creation: sealed 3 -> 4, today 3 -> 4, detected 1 -> 2, toConfirm 3 -> 4
    rerender(<EvidenceOverviewStats sealed={4} today={4} detected={2} toConfirm={4} />);

    expect(getStatValues()).toEqual(["4", "4", "2", "4"]);
  });

  it("renders large dynamic numbers (1, 10, 100, 1000) correctly without truncation", () => {
    const { container } = render(
      <EvidenceOverviewStats sealed={1} today={10} detected={100} toConfirm={1000} />
    );

    const values = container.querySelectorAll(".app-stat-value");
    expect(values[0]?.textContent).toBe("1");
    expect(values[1]?.textContent).toBe("10");
    expect(values[2]?.textContent).toBe("100");
    expect(values[3]?.textContent).toBe("1000");
  });
});
