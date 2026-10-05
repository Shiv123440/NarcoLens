// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  getLocalForensicGuidance,
  chatWithPrahari,
} from './sarvam';

describe('Sarvam AI Client & Forensic Knowledge Base', () => {
  it('supports 8 official Indic languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toContain('hi-IN');
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toContain('en-IN');
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toContain('pa-IN');
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toContain('ta-IN');
  });

  it('provides accurate chemical spot test guidance for Marquis reagent', () => {
    const guidance = getLocalForensicGuidance('Tell me about Marquis test for heroin', 'en-IN');
    expect(guidance).toMatch(/purple|violet/i);
    expect(guidance).toMatch(/GC-MS/);
  });

  it('provides accurate 3-phase spot test guidance for Scott reagent', () => {
    const guidance = getLocalForensicGuidance('How does Scott reagent test for cocaine?', 'en-IN');
    expect(guidance).toMatch(/chloroform/i);
    expect(guidance).toMatch(/lidocaine|procaine/i);
  });

  it('provides legal statutory guidance under Section 50 NDPS Act', () => {
    const guidance = getLocalForensicGuidance('What is Section 50 search requirement?', 'en-IN');
    expect(guidance).toMatch(/Gazetted Officer|Magistrate/);
    expect(guidance).toMatch(/Panchnama/);
  });

  it('provides legal guidance under Section 63 BSA 2023', () => {
    const guidance = getLocalForensicGuidance('How does BSA Section 63 apply to electronic evidence?', 'en-IN');
    expect(guidance).toMatch(/Bharatiya Sakshya Adhiniyam/);
    expect(guidance).toMatch(/certificate of integrity/i);
  });

  it('gracefully provides simulated reply when API is unreachable', async () => {
    // Pass invalid key to test offline simulated fallback
    const res = await chatWithPrahari('What are NDPS commercial quantity thresholds?', [], 'en-IN', 'invalid_key_offline');
    expect(res.reply).toBeDefined();
    expect(res.reply).toMatch(/Heroin/);
    expect(res.isSimulated).toBe(true);
  });

  it('connects to live Sarvam 105B API with valid key', async () => {
    const res = await chatWithPrahari('What is Section 50 NDPS Act?', [], 'en-IN');
    expect(res.reply).toBeDefined();
    expect(res.reply.length).toBeGreaterThan(10);
  });
});
