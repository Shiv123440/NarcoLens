// Shared evidence ledger backed by Lovable Cloud + Local Edge Persistence.
// This ensures evidence is never lost, whether offline or connected.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AuditRecord, Verdict } from "./app-data";
import type { CustodyEvent } from "./forensics";
import { getActiveOfficer } from "./auth-service";

type Row = Database["public"]["Tables"]["evidence_records"]["Row"];

const LOCAL_EVIDENCE_KEY = "drugshield_local_evidence_records";

export function getLocalEvidenceRecords(): AuditRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_EVIDENCE_KEY);
    return raw ? (JSON.parse(raw) as AuditRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalEvidenceRecord(record: AuditRecord): void {
  if (typeof window === "undefined") return;
  const list = getLocalEvidenceRecords();
  const index = list.findIndex((r) => r.id === record.id);
  if (index >= 0) {
    list[index] = record;
  } else {
    list.unshift(record);
  }
  localStorage.setItem(LOCAL_EVIDENCE_KEY, JSON.stringify(list));
}

export function rowToRecord(row: Row): AuditRecord {
  return {
    id: row.id,
    caseNumber: row.case_number,
    substance: row.substance,
    summary: row.summary,
    verdict: row.verdict as Verdict,
    timestamp: row.tested_at,
    location: row.location,
    officer: row.officer_name,
    sha256: row.sha256,
    sealed: row.sealed,
    reagent: row.reagent,
    confidence: row.confidence,
    synced: true,
    custody: (row.custody as unknown as CustodyEvent[]) ?? [],
    imageWidth: row.image_width ?? undefined,
    imageHeight: row.image_height ?? undefined,
    ...(row.gps ? { gps: row.gps } : {}),
  };
}

export const recordsQuery = queryOptions({
  queryKey: ["evidence", "list"],
  queryFn: async () => {
    let cloudRecords: AuditRecord[] = [];
    try {
      const { data, error } = await supabase
        .from("evidence_records")
        .select("*")
        .order("tested_at", { ascending: false })
        .limit(500);
      if (!error && data) {
        cloudRecords = data.map(rowToRecord);
      }
    } catch {}

    const localRecords = getLocalEvidenceRecords();
    const map = new Map<string, AuditRecord>();
    for (const r of cloudRecords) map.set(r.id, r);
    for (const r of localRecords) map.set(r.id, r);

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },
});

export const recordQuery = (id: string) =>
  queryOptions({
    queryKey: ["evidence", "one", id],
    queryFn: async () => {
      // 1. Check local store first
      const local = getLocalEvidenceRecords().find((r) => r.id === id);
      if (local) return local;

      // 2. Check cloud
      try {
        const { data, error } = await supabase
          .from("evidence_records")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!error && data) return rowToRecord(data);
      } catch {}

      return null;
    },
  });

export type NewEvidence = AuditRecord & {
  reagents: string[];
  firNumber?: string;
  kitBatch?: string;
  notes?: string;
};

export async function createEvidenceRecord(r: NewEvidence) {
  let userId = "00000000-0000-0000-0000-000000000000";
  try {
    const { data: u } = await supabase.auth.getUser();
    if (u?.user?.id) userId = u.user.id;
  } catch {}

  const activeOfficer = getActiveOfficer();
  if (activeOfficer?.id && activeOfficer.id.includes("-")) {
    userId = activeOfficer.id;
  }

  let synced = false;
  try {
    const { error } = await supabase.from("evidence_records").insert({
      id: r.id,
      case_number: r.caseNumber,
      substance: r.substance,
      summary: r.summary,
      verdict: r.verdict,
      tested_at: r.timestamp,
      location: r.location,
      officer_name: r.officer,
      created_by: userId,
      sha256: r.sha256,
      sealed: true,
      reagent: r.reagent,
      reagents: r.reagents,
      confidence: r.confidence,
      image_width: r.imageWidth ?? null,
      image_height: r.imageHeight ?? null,
      gps: r.gps ?? null,
      fir_number: r.firNumber || null,
      kit_batch: r.kitBatch || null,
      notes: r.notes || null,
      custody: (r.custody ?? []) as unknown as NonNullable<
        Database["public"]["Tables"]["evidence_records"]["Insert"]["custody"]
      >,
    });
    if (!error) synced = true;
  } catch {}

  // Always persist locally
  saveLocalEvidenceRecord({
    ...r,
    synced,
    sealed: true,
  });
}

export function newRecordId() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return `NCR-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}
