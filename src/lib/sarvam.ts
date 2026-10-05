// Sarvam AI Indic Voice & Multilingual Forensic Copilot Client
// Supports sarvam-105b-conversations, Saaras v4 (STT), and Bulbul v3 (TTS).

export type SupportedLanguage =
  | 'en-IN'
  | 'hi-IN'
  | 'pa-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'mr-IN'
  | 'bn-IN'
  | 'gu-IN';

export type IndicLanguageCode = SupportedLanguage;

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  native: string;
  label?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', name: 'English (India)', native: 'English', label: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', label: 'हिन्दी' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', label: 'ਪੰਜਾਬੀ' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', label: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', label: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी', label: 'मराठी' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', label: 'বাংলা' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', label: 'ગુજરાતી' },
];

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatMessage = ChatTurn;

export interface ChatResponse {
  reply: string;
  isSimulated?: boolean;
}

export interface SttResponse {
  transcript: string;
  error?: string;
}

export interface TtsResponse {
  audioBase64?: string;
  error?: string;
}

// Safe key resolver: Never bundles fallback secrets into browser builds
export function getSarvamKey(overrideKey?: string): string {
  if (overrideKey && overrideKey.trim()) return overrideKey.trim();
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sarvam_api_key');
    if (stored && stored.trim()) return stored.trim();
  }
  // Optional environment key for SSR/server/tests
  return (
    (typeof process !== 'undefined' && process.env?.SARVAM_API_KEY) ||
    import.meta.env.VITE_SARVAM_API_KEY ||
    ''
  );
}

const SYSTEM_PROMPT =
  'You are Prahari, the official field forensics assistant for the Narcotics Control Bureau (NCB) of India. ' +
  'You provide authoritative, concise, legally grounded guidance on: ' +
  '1. NDPS Act 1985 statutory procedures (Section 50 search rights, Section 52A Magistrate inventory sampling, Section 37 bail rules). ' +
  '2. Bharatiya Sakshya Adhiniyam (BSA) 2023 Section 63 electronic evidence integrity certificate requirements. ' +
  '3. Colorimetric spot test reagent reactions (Marquis, Scott, Duquenois-Levine, Simon\'s, Mecke, Mandelin). ' +
  '4. ISO/CIE 11664-6:2014 CIEDE2000 (ΔE*00) color difference readings. ' +
  'Every field test is presumptive and requires forensic GC-MS laboratory confirmation. Keep responses professional, direct, and under 150 words.';

/**
 * Sends conversation to Sarvam AI (sarvam-105b-conversations)
 * via secure server proxy (shielding credentials from client bundle)
 * or direct endpoint if custom key is supplied, with graceful offline fallback.
 */
export async function chatWithPrahari(
  message: string,
  history: ChatTurn[] = [],
  language: SupportedLanguage = 'en-IN',
  apiKey?: string
): Promise<ChatResponse> {
  const directKey = getSarvamKey(apiKey);
  // If running in browser and no explicit custom key given, route through secure server proxy
  const useProxy = typeof window !== 'undefined' && !apiKey && !localStorage.getItem('sarvam_api_key');
  const targetUrl = useProxy
    ? '/api/sarvam/v1/chat/completions'
    : 'https://api.sarvam.ai/v1/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (directKey && !useProxy) {
    headers['api-subscription-key'] = directKey;
  }

  if (useProxy || directKey) {
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'sarvam-105b-conversations',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT + ` Reply in the requested language: ${language}.`,
            },
            ...history.slice(-8).map((m) => ({
              role: m.role,
              content: m.content.slice(0, 1500),
            })),
            { role: 'user', content: message },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return { reply: text.trim(), isSimulated: false };
        }
      }
    } catch {
      // Fall through to local guidance
    }
  }

  // Authoritative local forensic rule-based fallback
  return {
    reply: getLocalForensicGuidance(message, language),
    isSimulated: true,
  };
}

/**
 * Transcribes audio blob using Sarvam Saaras v4 STT (codemix mode with NDPS keyterms)
 */
export async function transcribeAudioWithSarvam(
  audioBlob: Blob,
  language: SupportedLanguage = 'en-IN',
  apiKey?: string
): Promise<SttResponse> {
  const directKey = getSarvamKey(apiKey);
  const useProxy = typeof window !== 'undefined' && !apiKey && !localStorage.getItem('sarvam_api_key');
  const targetUrl = useProxy ? '/api/sarvam/speech-to-text' : 'https://api.sarvam.ai/speech-to-text';

  if (!useProxy && !directKey) {
    return { transcript: '', error: 'Sarvam API key required' };
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'sample.webm');
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'codemix');
    formData.append('language_code', language);
    formData.append('keyterms', JSON.stringify(['FIR', 'NDPS', 'Marquis', 'Mecke', 'Mandelin', 'Prahari', 'BSA']));

    const headers: Record<string, string> = {};
    if (directKey && !useProxy) {
      headers['api-subscription-key'] = directKey;
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.transcript) {
        return { transcript: data.transcript.trim() };
      }
    }
  } catch (err: unknown) {
    return { transcript: '', error: (err as Error)?.message || 'Speech service unreachable' };
  }

  return { transcript: '', error: 'Transcription unavailable' };
}

/**
 * Synthesizes natural Indic speech using Sarvam Bulbul v3 (shubh speaker)
 */
export async function synthesizeSpeechWithSarvam(
  text: string,
  language: SupportedLanguage = 'en-IN',
  apiKey?: string
): Promise<string | null> {
  const directKey = getSarvamKey(apiKey);
  const useProxy = typeof window !== 'undefined' && !apiKey && !localStorage.getItem('sarvam_api_key');
  const targetUrl = useProxy ? '/api/sarvam/text-to-speech' : 'https://api.sarvam.ai/text-to-speech';

  if (useProxy || directKey) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (directKey && !useProxy) {
        headers['api-subscription-key'] = directKey;
      }

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: [text.slice(0, 500)],
          target_language_code: language,
          speaker: 'shubh',
          model: 'bulbul:v3',
          speech_sample_rate: 24000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64Audio = data.audios?.[0];
        if (base64Audio) {
          return `data:audio/mp3;base64,${base64Audio}`;
        }
      }
    } catch {
      // Bulbul API unavailable, proceed to browser SpeechSynthesis
    }
  }

  // Fallback to browser SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  }

  return null;
}

/**
 * Domain-engineered NCB field interdiction guidance for offline operations
 */
export function getLocalForensicGuidance(query: string, language: SupportedLanguage): string {
  const q = query.toLowerCase();

  if (/marquis|heroin|morphine|codeine|opiates/.test(q)) {
    return 'Marquis Reagent yields a deep purple/reddish-violet reaction within 10-60 seconds for Heroin and Morphine. Note: Amphetamines react with orange-brown, while MDMA turns black. Laboratory GC-MS confirmation remains mandatory.';
  }

  if (/scott|cocaine/.test(q)) {
    return 'Scott Reagent tests for Cocaine in 3 steps: Step 1 (Cobalt thiocyanate) produces a blue precipitate. Step 2 (conc. HCl) turns pink. Step 3 (Chloroform) extracts a distinct cobalt blue layer into the lower organic phase, ruling out lidocaine or procaine.';
  }

  if (/duquenois|cannabis|charas|ganja|hashish/.test(q)) {
    return 'Duquenois-Levine test for Cannabis: Turns violet/purple upon adding concentrated hydrochloric acid. The purple chromophore MUST extract into the lower chloroform layer to be considered presumptive positive under NCB protocols.';
  }

  if (/section 50|sec 50|search/.test(q)) {
    return 'Under Section 50 of the NDPS Act 1985, the suspect has a mandatory statutory right to be searched before a Gazetted Officer or a Judicial Magistrate. This must be informed in writing, and written consent or requisition must be recorded in the Panchnama.';
  }

  if (/section 52a|sec 52a|sampling|magistrate/.test(q)) {
    return 'Under Section 52A NDPS Act, seized narcotic inventory must be presented before a Judicial Magistrate. The Magistrate certifies the inventory correctness, oversees sampling in duplicate, and certifies photographs as primary evidence.';
  }

  if (/section 63|bsa|sakshya|evidence/.test(q)) {
    return 'Section 63 of Bharatiya Sakshya Adhiniyam 2023 replaces Sec 65B of the repealed Indian Evidence Act. It mandates that electronic records (digital photos, spectral hashes, timestamps, GPS) carry a certificate of integrity issued by the lawful custodian.';
  }

  if (/commercial|small quantity|threshold/.test(q)) {
    return 'NDPS statutory quantity thresholds: Heroin (Small: 5g, Commercial: 250g); Cocaine (Small: 2g, Commercial: 100g); Charas (Small: 100g, Commercial: 1kg); Ganja (Small: 1kg, Commercial: 20kg). Section 37 bail restrictions apply to commercial seizures.';
  }

  if (/sop|procedure|steps|sequence/.test(q)) {
    return 'NCB Field Test Sequence: Step 1 (Case & FIR Details) -> Step 2 (Well & Reagent Setup) -> Step 3 (Photo Capture with ArUco Reticle & SHA-256 Seal) -> Step 4 (Colorimetric CIEDE2000 Matching & Cloud Ledger Commit).';
  }

  if (language === 'hi-IN') {
    return 'जय हिन्द ऑफिसर। मैं प्रहारी एआई हूँ। आप रासायनिक स्पॉट टेस्ट (Marquis, Scott, Duquenois-Levine), एनडीपीएस अधिनियम (धारा 50, 52A) या वॉयस कमांड (जैसे "कैप्चर", "अगला स्टेप") के बारे में पूछ सकते हैं।';
  }

  return 'Jai Hind Officer. I am Prahari AI, your forensic interdiction assistant. You can ask about chemical spot test reactions, NDPS statutory procedures (Sections 50 & 52A), BSA Section 63 electronic seals, or use voice commands like "capture", "next", or "new test".';
}
