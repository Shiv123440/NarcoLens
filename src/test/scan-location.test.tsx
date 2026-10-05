import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useState } from "react";
import { formatCoordinates, formatGpsDisplay, reverseGeocode } from "@/lib/location";
import { createEvidenceRecord, getLocalEvidenceRecords, type NewEvidence } from "@/lib/evidence";

// Test component simulating CaseStep and location acquisition exactly as implemented in scan.tsx
function CaseLocationTestComponent({
  onRecordCreated,
}: {
  onRecordCreated?: (record: NewEvidence) => void;
}) {
  const [caseNumber, setCaseNumber] = useState("");
  const [location, setLocation] = useState("");
  const [gps, setGps] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const requestGps = () => {
    if (gpsLoading) return;
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError("Unable to determine your location. Please enter the location manually.");
      setGps("GPS unavailable");
      return;
    }

    setGpsLoading(true);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const coordsText = formatCoordinates(lat, lon);
        const displayGps = formatGpsDisplay(lat, lon, accuracy);

        setGps(displayGps);
        setLocation(coordsText);
        setGpsLoading(false);
        setGpsSuccess(true);

        try {
          const resolved = await reverseGeocode(lat, lon);
          if (resolved) {
            setLocation((current) => (current === coordsText || current === "" ? resolved : current));
          }
        } catch {}
      },
      (err) => {
        setGpsLoading(false);
        setGpsSuccess(false);
        if (err.code === 1) {
          setGpsError("Location permission is required to capture the seizure location.");
        } else {
          setGpsError("Unable to determine your location. Please enter the location manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    const record: NewEvidence = {
      id: "NCR-2026-TEST-LOC",
      caseNumber: caseNumber || "NCR/DEL/2026/001",
      substance: "Cannabis",
      summary: "Presumptive test",
      verdict: "POSITIVE",
      timestamp: new Date().toISOString(),
      location: location || "Field location unavailable",
      officer: "Insp. Testing",
      sha256: "dummy-hash",
      sealed: true,
      reagent: "Duquenois-Levine",
      confidence: 90,
      synced: false,
      gps: gps || "GPS unavailable",
      reagents: ["Duquenois-Levine"],
    };
    await createEvidenceRecord(record);
    onRecordCreated?.(record);
  };

  return (
    <div>
      <label htmlFor="case-number">Case number *</label>
      <input
        id="case-number"
        value={caseNumber}
        onChange={(e) => setCaseNumber(e.target.value)}
        placeholder="NCR/DEL/2026/____"
      />

      <label htmlFor="seizure-location">Seizure location *</label>
      <input
        id="seizure-location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g. Gate 3, New Delhi"
      />

      <button type="button" onClick={requestGps} disabled={gpsLoading}>
        {gpsLoading ? "Getting location..." : gpsSuccess ? "Location captured" : "Use my location"}
      </button>

      <span data-testid="gps-display">{gpsError || gps || "GPS not recorded yet — never fabricated"}</span>

      <button type="button" onClick={handleSave}>
        Save & seal
      </button>
    </div>
  );
}

describe("Seizure Location GPS and Reverse-Geocoding Flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("verifies the complete GPS -> Seizure Location population -> editability -> record submission flow", async () => {
    // 1. Mock Geolocation with Raipur coordinates
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 21.24879,
            longitude: 81.6096,
            accuracy: 73,
          },
        });
      }),
    };
    // @ts-expect-error mock navigator
    globalThis.navigator.geolocation = mockGeolocation;

    // Mock fetch for reverse-geocoding
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Raipur",
        principalSubdivision: "Chhattisgarh",
        locality: "Raipur",
      }),
    } as Response);

    let savedRecord: NewEvidence | null = null;
    render(<CaseLocationTestComponent onRecordCreated={(rec) => (savedRecord = rec)} />);

    const locationInput = screen.getByLabelText(/Seizure location \*/i) as HTMLInputElement;
    const gpsBtn = screen.getByRole("button", { name: /Use my location/i });
    const gpsDisplay = screen.getByTestId("gps-display");

    // Step 2: Confirm Seizure Location is initially empty
    expect(locationInput.value).toBe("");

    // Step 3 & 4: Click 'Use my location'
    fireEvent.click(gpsBtn);

    // Step 5: Confirm Seizure Location input visibly changes and receives resolved location
    await waitFor(() => {
      expect(locationInput.value).toBe("Raipur, Chhattisgarh");
    });

    // Step 6: Confirm coordinates are stored separately in GPS state
    expect(gpsDisplay.textContent).toBe("21.24879, 81.60960 (±73 m)");

    // Step 7: Confirm manual editability (user can modify or append to populated location)
    fireEvent.change(locationInput, { target: { value: "Raipur, Chhattisgarh · Near Railway Station" } });
    expect(locationInput.value).toBe("Raipur, Chhattisgarh · Near Railway Station");

    // Step 8: Submit the form
    const saveBtn = screen.getByRole("button", { name: /Save & seal/i });
    fireEvent.click(saveBtn);

    // Step 9: Confirm saved evidence record contains the seizure location and GPS coordinates
    await waitFor(() => {
      expect(savedRecord).not.toBeNull();
      expect(savedRecord?.location).toBe("Raipur, Chhattisgarh · Near Railway Station");
      expect(savedRecord?.gps).toBe("21.24879, 81.60960 (±73 m)");
    });

    const localRecords = getLocalEvidenceRecords();
    const found = localRecords.find((r) => r.id === "NCR-2026-TEST-LOC");
    expect(found?.location).toBe("Raipur, Chhattisgarh · Near Railway Station");
    expect(found?.gps).toBe("21.24879, 81.60960 (±73 m)");

    globalThis.fetch = originalFetch;
  });

  it("handles fallback to coordinates when reverse geocoding is unavailable or fails", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 21.24879,
            longitude: 81.6096,
            accuracy: 73,
          },
        });
      }),
    };
    // @ts-expect-error mock navigator
    globalThis.navigator.geolocation = mockGeolocation;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    render(<CaseLocationTestComponent />);

    const locationInput = screen.getByLabelText(/Seizure location \*/i) as HTMLInputElement;
    const gpsBtn = screen.getByRole("button", { name: /Use my location/i });

    fireEvent.click(gpsBtn);

    await waitFor(() => {
      // Must fallback to raw coordinates
      expect(locationInput.value).toBe("21.24879, 81.60960");
    });

    globalThis.fetch = originalFetch;
  });

  it("shows informative error message when location permission is denied", async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error({
          code: 1, // PERMISSION_DENIED
          message: "User denied Geolocation",
        });
      }),
    };
    // @ts-expect-error mock navigator
    globalThis.navigator.geolocation = mockGeolocation;

    render(<CaseLocationTestComponent />);

    const locationInput = screen.getByLabelText(/Seizure location \*/i) as HTMLInputElement;
    const gpsBtn = screen.getByRole("button", { name: /Use my location/i });
    const gpsDisplay = screen.getByTestId("gps-display");

    fireEvent.click(gpsBtn);

    await waitFor(() => {
      expect(gpsDisplay.textContent).toContain("Location permission is required to capture the seizure location.");
    });
    // Seizure location is not polluted with invalid data
    expect(locationInput.value).toBe("");
  });
});
