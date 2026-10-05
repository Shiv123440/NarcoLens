// Pure, browser-safe forensic helpers: hashing, image validation, custody chain,
// audit filtering/exports and Prahari voice-command routing.

export async function sha256Hex(data: Blob | ArrayBuffer | Uint8Array): Promise<string> {
  const buf = data instanceof Blob ? await data.arrayBuffer() : data instanceof Uint8Array ? data.slice().buffer : data;
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const ACCEPTED = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_BYTES = 10 * 1024 * 1024;
export const MIN_W = 640;
export const MIN_H = 480;

export type ValidationCode = "EMPTY" | "TYPE" | "HEIC" | "SIZE" | "DECODE" | "DIMENSIONS";
export type ValidationResult =
  | { ok: true; file: File; width: number; height: number }
  | { ok: false; code: ValidationCode; message: string };

export async function sniffImageType(file: Blob): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
}

type Decoder = (file: File) => Promise<{ width: number; height: number }>;
const defaultDecoder: Decoder = async (file) => {
  const bmp = await createImageBitmap(file);
  const size = { width: bmp.width, height: bmp.height };
  bmp.close();
  return size;
};

export async function validateImage(file: File, decode: Decoder = defaultDecoder): Promise<ValidationResult> {
  if (file.size === 0) return { ok: false, code: "EMPTY", message: "The file is empty." };
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name))
    return { ok: false, code: "HEIC", message: 'HEIC photos are not supported. Export as JPG, or set the camera to "Most Compatible".' };
  const real = await sniffImageType(file);
  if (!real || !(ACCEPTED as readonly string[]).includes(real))
    return { ok: false, code: "TYPE", message: "Unsupported file type. Use JPG, PNG or WebP." };
  if (file.size > MAX_BYTES)
    return { ok: false, code: "SIZE", message: `File is ${(file.size / 1048576).toFixed(1)} MB. Maximum is 10 MB.` };
  try {
    const { width, height } = await decode(file);
    if (width < MIN_W || height < MIN_H)
      return { ok: false, code: "DIMENSIONS", message: `Image is ${width}×${height}. Minimum is ${MIN_W}×${MIN_H}.` };
    return { ok: true, file, width, height };
  } catch {
    return { ok: false, code: "DECODE", message: "This image is corrupt or unreadable." };
  }
}

// ---------- Custody chain ----------
export type CustodyAction = "CREATED" | "SEALED" | "VIEWED" | "EXPORTED" | "TAMPER_VERIFIED";
export type CustodyEvent = {
  id: string; recordId: string; action: CustodyAction; actor: string;
  timestampUtc: string; detail: string; prevHash: string; hash: string;
};

function eventPayload(prevHash: string, e: Omit<CustodyEvent, "hash">) {
  // Stable key order — constructed in one place only.
  return prevHash + JSON.stringify([e.id, e.recordId, e.action, e.actor, e.timestampUtc, e.detail, e.prevHash]);
}

export async function appendCustody(chain: CustodyEvent[], recordId: string, action: CustodyAction, actor: string, detail = "", now = new Date()): Promise<CustodyEvent[]> {
  const prevHash = chain.at(-1)?.hash ?? "GENESIS";
  const base = { id: crypto.randomUUID(), recordId, action, actor, timestampUtc: now.toISOString(), detail, prevHash };
  const hash = await sha256Hex(new TextEncoder().encode(eventPayload(prevHash, base)));
  return [...chain, { ...base, hash }];
}

export async function verifyChain(events: CustodyEvent[]): Promise<boolean[]> {
  let prev = "GENESIS";
  const out: boolean[] = [];
  for (const e of events) {
    const { hash, ...base } = e;
    const expect = await sha256Hex(new TextEncoder().encode(eventPayload(prev, base)));
    out.push(e.prevHash === prev && hash === expect);
    prev = e.hash;
  }
  return out;
}

// ---------- Audit filtering & export ----------
type FilterableRecord = { id: string; caseNumber: string; substance: string; location: string; officer: string; verdict: string; timestamp: string; sha256: string; reagent: string; confidence: number; sealed: boolean; synced: boolean };

export function filterRecords<T extends FilterableRecord>(records: T[], opts: { q?: string; verdict?: string }): T[] {
  const q = (opts.q ?? "").trim().toLowerCase();
  return records.filter((r) =>
    (!opts.verdict || opts.verdict === "ALL" || r.verdict === opts.verdict) &&
    (!q || [r.id, r.caseNumber, r.substance, r.location, r.officer].some((v) => v.toLowerCase().includes(q))));
}

export function csvCell(value: string | number | boolean): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula-injection guard
  return `"${s.replaceAll('"', '""')}"`;
}

const CSV_COLUMNS = ["id", "caseNumber", "substance", "verdict", "reagent", "confidence", "timestamp", "location", "officer", "sealed", "synced", "sha256"] as const;

export function recordsToCsv(records: FilterableRecord[]): string {
  return [CSV_COLUMNS.join(","), ...records.map((r) => CSV_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\r\n");
}

export function recordsToManifest(records: FilterableRecord[]): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), count: records.length, records: records.map((r) => Object.fromEntries(CSV_COLUMNS.map((c) => [c, r[c]]))) }, null, 2);
}

// ---------- Prahari command router ----------
export type Command = { type: "CAPTURE" } | { type: "NEXT_STEP" } | { type: "PREV_STEP" } | { type: "NAVIGATE"; to: "home" | "scan" | "audit" } | { type: "READ_RESULT" };

const RULES: Array<[RegExp, Command]> = [
  [/\b(capture|snap|shoot)\b|फोटो|कैप्चर/i, { type: "CAPTURE" }],
  [/\b(audit|history|logs?|records?)\b|रिकॉर्ड|इतिहास/i, { type: "NAVIGATE", to: "audit" }],
  [/\b(new test|scan|start test)\b|नया टेस्ट|स्कैन/i, { type: "NAVIGATE", to: "scan" }],
  [/\b(home|dashboard)\b|होम/i, { type: "NAVIGATE", to: "home" }],
  [/\b(next|continue)\b|आगे/i, { type: "NEXT_STEP" }],
  [/\b(back|previous)\b|पीछे/i, { type: "PREV_STEP" }],
  [/\b(read|result)\b|परिणाम/i, { type: "READ_RESULT" }],
];

export function matchCommand(text: string): Command | null {
  for (const [re, cmd] of RULES) if (re.test(text)) return cmd;
  return null;
}
