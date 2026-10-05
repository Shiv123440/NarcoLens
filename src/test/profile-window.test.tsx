import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { ProfileContent } from "@/components/profile-window";
import {
  setActiveOfficer,
  getActiveOfficer,
  updateActiveOfficerProfile,
  changeOfficerPassword,
  validatePassword,
} from "@/lib/auth-service";
import { resetDemoEvidenceData, getLocalEvidenceRecords } from "@/lib/evidence";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Profile Window & Routing", () => {
  beforeEach(() => {
    localStorage.clear();
    setActiveOfficer({
      id: "test_off_123",
      email: "rajesh.kumar@ncb.gov.in",
      full_name: "Insp. Rajesh Kumar",
      officer_id: "NCB-DEL-4082",
      badge_id: "NCB-DEL-4082",
      device_id: "FIELD-UNIT-07",
      district: "New Delhi, Delhi",
      station: "Delhi Zonal Unit",
      department: "NCB · Delhi Zonal Unit",
      rank: "Inspector",
      speak_aloud: true,
      language: "en",
      created_at: new Date().toISOString(),
    });
  });

  it("matches the /profile route in TanStack router", () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: new QueryClient() },
    });
    const matches = router.matchRoutes("/profile");
    expect(matches.some((m) => m.routeId.includes("profile"))).toBe(true);
  });

  it("renders all elements matching the reference image theme", () => {
    renderWithProviders(<ProfileContent />);

    // Top title
    expect(screen.getByRole("heading", { name: "Profile" })).toBeDefined();

    // Officer Info
    expect(screen.getByText("Insp. Rajesh Kumar")).toBeDefined();
    expect(screen.getByText("Inspector · NCB · Delhi Zonal Unit")).toBeDefined();

    // Badge ID, Device, District
    expect(screen.getByText("NCB-DEL-4082")).toBeDefined();
    expect(screen.getByText("FIELD-UNIT-07")).toBeDefined();
    expect(screen.getByText("New Delhi, Delhi")).toBeDefined();

    // Voice & Language elements
    expect(screen.getByText("Speak replies aloud")).toBeDefined();
    expect(screen.getByText("Hands-free while wearing gloves")).toBeDefined();
    expect(screen.getByText("English")).toBeDefined();
    expect(screen.getByText("हिंदी")).toBeDefined();

    // Data elements
    expect(screen.getByText("Reset demo data")).toBeDefined();
    expect(screen.getByText("Sign out")).toBeDefined();

    // Footer info
    expect(
      screen.getByText(/Colour model v2 is on this phone and reads plate photos offline/i)
    ).toBeDefined();
  });

  it("allows switching language between English and Hindi", () => {
    renderWithProviders(<ProfileContent />);
    const hindiBtn = screen.getByText("हिंदी");
    fireEvent.click(hindiBtn);
    expect(localStorage.getItem("drugshield_lang")).toBe("hi");
  });

  it("toggles voice replies aloud switch", () => {
    renderWithProviders(<ProfileContent />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(localStorage.getItem("drugshield_speak_aloud")).toBe("false");
  });

  it("resets demo evidence data", () => {
    localStorage.setItem("drugshield_local_evidence_records", JSON.stringify([]));
    expect(getLocalEvidenceRecords().length).toBe(0);

    resetDemoEvidenceData();
    const records = getLocalEvidenceRecords();
    expect(records.length).toBeGreaterThan(0);
    expect(records.some((r) => r.officer === "Insp. Rajesh Kumar")).toBe(true);
  });

  it("validates and allows updating officer password", () => {
    const invalidRes = validatePassword("short");
    expect(invalidRes.valid).toBe(false);

    const validRes = validatePassword("SecurePass2026!");
    expect(validRes.valid).toBe(true);

    const pwChange = changeOfficerPassword("SecurePass2026!");
    expect(pwChange.success).toBe(true);
  });

  it("allows updating profile details", () => {
    const updated = updateActiveOfficerProfile({
      full_name: "Insp. Rajesh Kumar (Senior)",
      district: "South Delhi, Delhi",
    });
    expect(updated.full_name).toBe("Insp. Rajesh Kumar (Senior)");
    expect(updated.district).toBe("South Delhi, Delhi");
    expect(getActiveOfficer()?.full_name).toBe("Insp. Rajesh Kumar (Senior)");
  });
});
