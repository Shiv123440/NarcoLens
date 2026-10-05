import { describe, expect, it } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToLab,
  calculateDeltaE2000,
  classifySampleColor,
  REAGENT_REFERENCES,
} from './colorimetry';

describe('Colorimetric spectral processing and CIEDE2000', () => {
  it('correctly converts hex to RGB and back', () => {
    const rgb = hexToRgb('#4a154b');
    expect(rgb).toEqual({ r: 74, g: 21, b: 75 });
    expect(rgbToHex(rgb)).toBe('#4a154b');
  });

  it('calculates Delta E 2000 = 0 for identical colors', () => {
    const lab = rgbToLab({ r: 100, g: 150, b: 200 });
    const deltaE = calculateDeltaE2000(lab, lab);
    expect(deltaE).toBe(0);
  });

  it('calculates expected small Delta E for slight variations', () => {
    const lab1 = rgbToLab({ r: 120, g: 40, b: 120 });
    const lab2 = rgbToLab({ r: 122, g: 39, b: 118 });
    const deltaE = calculateDeltaE2000(lab1, lab2);
    expect(deltaE).toBeGreaterThan(0);
    expect(deltaE).toBeLessThan(3.0);
  });

  it('correctly classifies positive, inconclusive, and negative samples', () => {
    const positive = classifySampleColor(2.1);
    expect(positive.verdict).toBe('POSITIVE');
    expect(positive.confidence).toBeGreaterThanOrEqual(90);

    const inconclusive = classifySampleColor(8.5);
    expect(inconclusive.verdict).toBe('INCONCLUSIVE');
    expect(inconclusive.confidence).toBeGreaterThan(50);
    expect(inconclusive.confidence).toBeLessThan(90);

    const negative = classifySampleColor(18.0);
    expect(negative.verdict).toBe('NEGATIVE');
    expect(negative.confidence).toBeGreaterThanOrEqual(90);
  });

  it('has reference data for Marquis, Scott, Duquenois-Levine, and Simons', () => {
    expect(REAGENT_REFERENCES.marquis.expectedHex).toBe('#4a154b');
    expect(REAGENT_REFERENCES.scott.expectedHex).toBe('#1d4ed8');
    expect(REAGENT_REFERENCES.duquenois.expectedHex).toBe('#581c87');
    expect(REAGENT_REFERENCES.simons.expectedHex).toBe('#2563eb');
  });
});
