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

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', name: 'English (India)', native: 'English' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', native: 'मराठी' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી' },
];

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Sends conversation to Sarvam AI (sarvam-105b-conversations)
 * with graceful fallback to local forensic knowledge engine if offline.
 */
export async function chatWithPrahari(
  message: string,
  history: ChatTurn[] = [],
  language: SupportedLanguage = 'en-IN'
): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/voice/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        conversation_history: history.slice(-8),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return { reply: data.reply, isSimulated: false };
      }
    }
  } catch {
    // API endpoint unreachable, proceed to local forensic fallback
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
  language: SupportedLanguage = 'en-IN'
): Promise<SttResponse> {
  try {
    const buffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const res = await fetch(`${API_BASE}/api/voice/stt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64Audio,
        mime: audioBlob.type || 'audio/webm',
        language,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.transcript) {
        return { transcript: data.transcript };
      }
      if (data.error) {
        return { transcript: '', error: data.error };
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
  language: SupportedLanguage = 'en-IN'
): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch(`${API_BASE}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 500),
        language,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        return audio;
      }
    }
  } catch {
    // Bulbul API unavailable
  }

  // Fallback to browser SpeechSynthesis
  if ('speechSynthesis' in window) {
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
