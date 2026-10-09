// Colorimetric spectral processing & CIEDE2000 color difference formula (ISO/CIE 11664-6:2014)

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorLab {
  L: number;
  a: number;
  b: number;
}

// D65 Standard Illuminant Tristimulus Values (2° observer)
const Xn = 95.047;
const Yn = 100.000;
const Zn = 108.883;

export function hexToRgb(hex: string): ColorRGB {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: ColorRGB): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    const h = clamped.toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Convert sRGB to CIEXYZ
export function rgbToXyz(rgb: ColorRGB): { x: number; y: number; z: number } {
  const pivot = (n: number) => {
    const c = n / 255.0;
    return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
  };

  const r = pivot(rgb.r) * 100.0;
  const g = pivot(rgb.g) * 100.0;
  const b = pivot(rgb.b) * 100.0;

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  return { x, y, z };
}

// Convert CIEXYZ to CIELAB (D65)
export function xyzToLab(xyz: { x: number; y: number; z: number }): ColorLab {
  const fx = (t: number) => {
    return t > 0.00885645 ? Math.cbrt(t) : (903.3 * t + 16.0) / 116.0;
  };

  const x_xn = xyz.x / Xn;
  const y_yn = xyz.y / Yn;
  const z_zn = xyz.z / Zn;

  const fX = fx(x_xn);
  const fY = fx(y_yn);
  const fZ = fx(z_zn);

  const L = Math.max(0, 116.0 * fY - 16.0);
  const a = 500.0 * (fX - fY);
  const b = 200.0 * (fY - fZ);

  return {
    L: Number(L.toFixed(2)),
    a: Number(a.toFixed(2)),
    b: Number(b.toFixed(2)),
  };
}

export function rgbToLab(rgb: ColorRGB): ColorLab {
  const xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
}

export function hexToLab(hex: string): ColorLab {
  return rgbToLab(hexToRgb(hex));
}

// CIEDE2000 Color-Difference Formula
export function calculateDeltaE2000(lab1: ColorLab, lab2: ColorLab): number {
  const rad2deg = (rad: number) => (rad * 180.0) / Math.PI;
  const deg2rad = (deg: number) => (deg * Math.PI) / 180.0;

  const L1 = lab1.L;
  const a1 = lab1.a;
  const b1 = lab1.b;

  const L2 = lab2.L;
  const a2 = lab2.a;
  const b2 = lab2.b;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2.0;

  const G = 0.5 * (1.0 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));

  const a1Prime = a1 * (1.0 + G);
  const a2Prime = a2 * (1.0 + G);

  const C1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);

  const h1Prime =
    Math.atan2(b1, a1Prime) >= 0 ? rad2deg(Math.atan2(b1, a1Prime)) : rad2deg(Math.atan2(b1, a1Prime)) + 360.0;
  const h2Prime =
    Math.atan2(b2, a2Prime) >= 0 ? rad2deg(Math.atan2(b2, a2Prime)) : rad2deg(Math.atan2(b2, a2Prime)) + 360.0;

  const deltaLPrime = L2 - L1;
  const deltaCPrime = C2Prime - C1Prime;

  let deltaHPrime = 0;
  if (C1Prime * C2Prime !== 0) {
    if (Math.abs(h2Prime - h1Prime) <= 180.0) {
      deltaHPrime = h2Prime - h1Prime;
    } else if (h2Prime - h1Prime > 180.0) {
      deltaHPrime = h2Prime - h1Prime - 360.0;
    } else {
      deltaHPrime = h2Prime - h1Prime + 360.0;
    }
  }

  const deltaBigHPrime = 2.0 * Math.sqrt(C1Prime * C2Prime) * Math.sin(deg2rad(deltaHPrime / 2.0));

  const avgLPrime = (L1 + L2) / 2.0;
  const avgCPrime = (C1Prime + C2Prime) / 2.0;

  let avgHPrime = 0;
  if (C1Prime * C2Prime !== 0) {
    if (Math.abs(h1Prime - h2Prime) <= 180.0) {
      avgHPrime = (h1Prime + h2Prime) / 2.0;
    } else if (h1Prime + h2Prime < 360.0) {
      avgHPrime = (h1Prime + h2Prime + 360.0) / 2.0;
    } else {
      avgHPrime = (h1Prime + h2Prime - 360.0) / 2.0;
    }
  }

  const T =
    1.0 -
    0.17 * Math.cos(deg2rad(avgHPrime - 30.0)) +
    0.24 * Math.cos(deg2rad(2.0 * avgHPrime)) +
    0.32 * Math.cos(deg2rad(3.0 * avgHPrime + 6.0)) -
    0.2 * Math.cos(deg2rad(4.0 * avgHPrime - 63.0));

  const deltaTheta = 30.0 * Math.exp(-Math.pow((avgHPrime - 275.0) / 25.0, 2));
  const RC = 2.0 * Math.sqrt(Math.pow(avgCPrime, 7) / (Math.pow(avgCPrime, 7) + Math.pow(25, 7)));

  const SL = 1.0 + (0.015 * Math.pow(avgLPrime - 50.0, 2)) / Math.sqrt(20.0 + Math.pow(avgLPrime - 50.0, 2));
  const SC = 1.0 + 0.045 * avgCPrime;
  const SH = 1.0 + 0.015 * avgCPrime * T;
  const RT = -Math.sin(deg2rad(2.0 * deltaTheta)) * RC;

  const dE = Math.sqrt(
    Math.pow(deltaLPrime / SL, 2) +
      Math.pow(deltaCPrime / SC, 2) +
      Math.pow(deltaBigHPrime / SH, 2) +
      RT * (deltaCPrime / SC) * (deltaBigHPrime / SH)
  );

  return Number(dE.toFixed(2));
}

export interface ReagentReference {
  id: string;
  name: string;
  expectedHex: string;
  targetSubstance: string;
}

export const REAGENT_REFERENCES = {
  marquis: {
    id: 'marquis',
    name: 'Marquis Reagent',
    expectedHex: '#4a154b', // Deep reddish-purple
    targetSubstance: 'Heroin / Morphine',
  },
  scott: {
    id: 'scott',
    name: 'Scott Reagent',
    expectedHex: '#1d4ed8', // Cobalt blue
    targetSubstance: 'Cocaine Hydrochloride',
  },
  duquenois: {
    id: 'duquenois',
    name: 'Duquenois-Levine',
    expectedHex: '#581c87', // Violet
    targetSubstance: 'Cannabis / Charas',
  },
  simons: {
    id: 'simons',
    name: "Simon's Reagent",
    expectedHex: '#2563eb', // Cobalt blue
    targetSubstance: 'Methamphetamine / MDMA',
  },
  mecke: {
    id: 'mecke',
    name: 'Mecke Reagent',
    expectedHex: '#0f766e', // Deep blue-green
    targetSubstance: 'Opiates',
  },
  mandelin: {
    id: 'mandelin',
    name: 'Mandelin Reagent',
    expectedHex: '#c2410c', // Orange
    targetSubstance: 'Ketamine / Amphetamines',
  },
} as const satisfies Record<string, ReagentReference>;

export interface ClassificationResult {
  verdict: 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';
  confidence: number;
  interpretation: string;
}

export function classifySampleColor(deltaE: number): ClassificationResult {
  if (deltaE <= 5.0) {
    const confidence = Math.min(99, Math.max(90, Math.round(98 - deltaE * 1.5)));
    return {
      verdict: 'POSITIVE',
      confidence,
      interpretation: `Chromatically identical or near-identical to target reaction (ΔE*00 = ${deltaE.toFixed(1)} <= 5.0). High presumptive detection probability.`,
    };
  }

  if (deltaE <= 12.0) {
    const confidence = Math.round(50 + (12.0 - deltaE) * 4);
    return {
      verdict: 'INCONCLUSIVE',
      confidence,
      interpretation: `Color shift detected but ΔE*00 (${deltaE.toFixed(1)}) falls within the ambiguous band (5.0 - 12.0). Laboratory GC-MS confirmation required.`,
    };
  }

  const confidence = Math.min(98, Math.max(90, Math.round(85 + (deltaE - 12.0) * 1.2)));
  return {
    verdict: 'NEGATIVE',
    confidence,
    interpretation: `Significant color difference from reference response (ΔE*00 = ${deltaE.toFixed(1)} > 12.0). Negative presumptive result.`,
  };
}
