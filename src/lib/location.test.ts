import { describe, expect, it, vi } from "vitest";
import { formatCoordinates, formatGpsDisplay, reverseGeocode } from "./location";

describe("location utility", () => {
  it("formats coordinates to 5 decimal places", () => {
    expect(formatCoordinates(21.248791, 81.609604)).toBe("21.24879, 81.60960");
    expect(formatCoordinates(28.6139, 77.209)).toBe("28.61390, 77.20900");
  });

  it("formats GPS display with accuracy in meters", () => {
    expect(formatGpsDisplay(21.24879, 81.6096, 73.4)).toBe("21.24879, 81.60960 (±73 m)");
    expect(formatGpsDisplay(21.24879, 81.6096)).toBe("21.24879, 81.60960");
  });

  it("handles reverse geocode network failure gracefully without throwing", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));

    try {
      const result = await reverseGeocode(21.24879, 81.6096);
      expect(result).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("parses valid reverse geocode response from BigDataCloud", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Raipur",
        principalSubdivision: "Chhattisgarh",
        locality: "Raipur",
      }),
    } as Response);

    try {
      const result = await reverseGeocode(21.24879, 81.6096);
      expect(result).toBe("Raipur, Chhattisgarh");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
