import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { ExpandableEvidenceCard } from "@/components/expandable-evidence-card";
import type { AuditRecord } from "@/lib/app-data";

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockRecord1: AuditRecord = {
  id: "NCR-2026-TEST-001",
  caseNumber: "NCR/DEL/2026/001",
  substance: "Cocaine",
  summary: "Cobalt thiocyanate blue reaction confirmed",
  verdict: "POSITIVE",
  timestamp: "2026-10-09T10:30:00.000Z",
  location: "Indira Gandhi International Airport, Terminal 3",
  officer: "Insp. Devendra Singh",
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  sealed: true,
  reagent: "Scott",
  confidence: 96,
  synced: true,
};

const mockRecord2: AuditRecord = {
  id: "NCR-2026-TEST-002",
  caseNumber: "NCR/MUM/2026/002",
  substance: "Cannabis",
  summary: "Purple-violet colour in lower chloroform layer",
  verdict: "POSITIVE",
  timestamp: "2026-10-08T14:15:00.000Z",
  location: "JNPT Port · Navi Mumbai",
  officer: "Sub-Insp. Priya Sharma",
  sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
  sealed: false,
  reagent: "Duquenois-Levine",
  confidence: 91,
  synced: false,
};

describe("ExpandableEvidenceCard Two-Stage Preview", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    document.body.style.overflow = "auto";
  });

  it("does not render when record is null", () => {
    const { container } = render(
      <ExpandableEvidenceCard record={null} onClose={vi.fn()} />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders evidence preview modal with accurate record details when opened", () => {
    render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={vi.fn()} />
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Check specific fields displayed
    expect(screen.getByText("NCR-2026-TEST-001")).toBeInTheDocument();
    expect(screen.getByText("Case: NCR/DEL/2026/001")).toBeInTheDocument();
    expect(screen.getByText("Cocaine")).toBeInTheDocument();
    expect(screen.getByText("Detected: Cocaine")).toBeInTheDocument();
    expect(screen.getByText("96% match")).toBeInTheDocument();
    expect(screen.getByText("Scott")).toBeInTheDocument();
    expect(screen.getByText("Indira Gandhi International Airport, Terminal 3")).toBeInTheDocument();
    expect(screen.getByText("Insp. Devendra Singh")).toBeInTheDocument();
    expect(screen.getByText("Sealed & Tamper-Protected")).toBeInTheDocument();
    expect(screen.getByText(mockRecord1.sha256)).toBeInTheDocument();
  });

  it("locks body scroll when modal opens and restores when unmounted", () => {
    const { unmount } = render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={vi.fn()} />
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("calls onClose when close icon button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={onClose} />
    );

    const closeBtn = screen.getByRole("button", { name: "Close preview" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={onClose} />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to audit detail route when 'View full audit report' is clicked", () => {
    const onClose = vi.fn();
    render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={onClose} />
    );

    const actionBtn = screen.getByRole("button", { name: /View full audit report/i });
    expect(actionBtn).toBeInTheDocument();

    fireEvent.click(actionBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/audit/$recordId",
      params: { recordId: "NCR-2026-TEST-001" },
    });
  });

  it("switches smoothly between different record datasets", () => {
    const { rerender } = render(
      <ExpandableEvidenceCard record={mockRecord1} onClose={vi.fn()} />
    );

    expect(screen.getByText("NCR-2026-TEST-001")).toBeInTheDocument();
    expect(screen.getByText("Cocaine")).toBeInTheDocument();

    rerender(
      <ExpandableEvidenceCard record={mockRecord2} onClose={vi.fn()} />
    );

    expect(screen.getByText("NCR-2026-TEST-002")).toBeInTheDocument();
    expect(screen.getByText("Cannabis")).toBeInTheDocument();
    expect(screen.getByText("Duquenois-Levine")).toBeInTheDocument();
    expect(screen.getByText("Sub-Insp. Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("Unsealed Draft")).toBeInTheDocument();
  });
});
