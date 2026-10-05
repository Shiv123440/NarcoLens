/**
 * Geolocation and reverse-geocoding utilities for forensic field tests.
 * Resolves GPS coordinates to human-readable administrative locations
 * with graceful fallback to formatted coordinates.
 */

export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function formatGpsDisplay(lat: number, lon: number, accuracy?: number): string {
  const coords = formatCoordinates(lat, lon);
  if (typeof accuracy === "number" && !isNaN(accuracy)) {
    return `${coords} (±${Math.round(accuracy)} m)`;
  }
  return coords;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Strategy 1: BigDataCloud free client reverse geocoder (CORS friendly, fast, no auth)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const parts: string[] = [];
      if (data.locality && data.locality !== data.city) parts.push(data.locality);
      if (data.city) parts.push(data.city);
      if (data.principalSubdivision && data.principalSubdivision !== data.city) {
        parts.push(data.principalSubdivision);
      }
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch {
    // Continue to fallback strategy
  }

  // Strategy 2: OpenStreetMap Nominatim reverse geocoder
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const parts: string[] = [];
        const place = addr.suburb || addr.neighbourhood || addr.road;
        const city = addr.city || addr.town || addr.village || addr.county;
        const state = addr.state;
        if (place) parts.push(place);
        if (city && city !== place) parts.push(city);
        if (state && state !== city) parts.push(state);
        if (parts.length > 0) {
          return parts.join(", ");
        }
      }
      if (data.display_name) {
        const splitted = data.display_name.split(",").map((s: string) => s.trim());
        return splitted.slice(0, 3).join(", ");
      }
    }
  } catch {
    // Both geocoders failed/timed out
  }

  return null;
}
