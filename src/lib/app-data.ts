export type Verdict = "NEGATIVE" | "POSITIVE" | "INCONCLUSIVE";

export type AuditRecord = {
  id: string;
  caseNumber: string;
  substance: string;
  summary: string;
  verdict: Verdict;
  timestamp: string;
  location: string;
  officer: string;
  sha256: string;
  sealed: boolean;
  reagent: string;
  confidence: number;
  synced: boolean;
  custody?: import("./forensics").CustodyEvent[];
  imageWidth?: number | undefined;
  imageHeight?: number | undefined;
  gps?: string;
};

export const SUBSTANCES = [
  { id: "cannabis", name: "Cannabis", note: "Duquenois-Levine", icon: "leaf" },
  { id: "cocaine", name: "Cocaine", note: "Scott reagent", icon: "snowflake" },
  { id: "heroin", name: "Heroin", note: "Marquis reagent", icon: "syringe" },
  { id: "amphetamines", name: "Amphetamines", note: "Marquis + Simon's", icon: "pill" },
  { id: "methaqualone", name: "Methaqualone", note: "Kit mapping pending", icon: "flask" },
] as const;

export const REAGENTS = [
  "Marquis",
  "Mecke",
  "Mandelin",
  "Scott",
  "Simon's",
  "Ehrlich",
  "Duquenois-Levine",
] as const;

// Test fixtures only — the live ledger is the shared cloud evidence_records table.
export const seedRecords: AuditRecord[] = [
  {
    id: "NCR-2026-0917",
    caseNumber: "NCR/DEL/2026/0917",
    substance: "Cocaine",
    summary: "Blue response consistent with cocaine",
    verdict: "POSITIVE",
    timestamp: "2026-10-05T04:44:00.000Z",
    location: "New Delhi · Gate 3",
    officer: "Insp. Rajesh Kumar",
    sha256: "8f2e6b11d5c9a3b4e8a1c00c2d4f1a93a9e7d5e2214c6b0a7b4e2d8f6a1c3e5d",
    sealed: true,
    reagent: "Scott",
    confidence: 94,
    synced: true,
  },
  {
    id: "NCR-2026-0912",
    caseNumber: "NCR/MUM/2026/0912",
    substance: "Cannabis",
    summary: "No characteristic colour response",
    verdict: "NEGATIVE",
    timestamp: "2026-10-04T11:12:00.000Z",
    location: "Mumbai · Kurla",
    officer: "SI Ananya Bose",
    sha256: "2b0d99e7f1a4c5d6880fa91d4a5b7e6c234d8a9f00e1b2c3d4e5f60718293a4b5",
    sealed: true,
    reagent: "Duquenois-Levine",
    confidence: 89,
    synced: true,
  },
  {
    id: "NCR-2026-0908",
    caseNumber: "NCR/KOL/2026/0908",
    substance: "Unknown sample",
    summary: "Reference card alignment incomplete",
    verdict: "INCONCLUSIVE",
    timestamp: "2026-10-03T08:06:00.000Z",
    location: "Kolkata · Howrah",
    officer: "Insp. Vikram Singh",
    sha256: "a1c7e9d3b5f20418293a4b5c6d7e8f9001a2b3c4d5e6f708192a3b4c5d6e7f8a9",
    sealed: true,
    reagent: "Marquis",
    confidence: 61,
    synced: false,
  },
];

export function formatRecordTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
