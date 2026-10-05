// Shared evidence ledger backed by Lovable Cloud. This is the single source of
// truth for evidence records — RLS restricts access to officers with a role.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { AuditRecord, Verdict } from "./app-data";
import type { CustodyEvent } from "./forensics";

type Row = Database["public"]["Tables"]["evidence_records"]["Row"];

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
    const { data, error } = await supabase.from("evidence_records").select("*").order("tested_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return data.map(rowToRecord);
  },
});

export const recordQuery = (id: string) =>
  queryOptions({
    queryKey: ["evidence", "one", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("evidence_records").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? rowToRecord(data) : null;
    },
  });

export type NewEvidence = AuditRecord & { reagents: string[]; firNumber?: string; kitBatch?: string; notes?: string };

export async function createEvidenceRecord(r: NewEvidence) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("You must be signed in to seal evidence.");
  const { error } = await supabase.from("evidence_records").insert({
    id: r.id,
    case_number: r.caseNumber,
    substance: r.substance,
    summary: r.summary,
    verdict: r.verdict,
    tested_at: r.timestamp,
    location: r.location,
    officer_name: r.officer,
    created_by: u.user.id,
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
    custody: (r.custody ?? []) as unknown as NonNullable<Database["public"]["Tables"]["evidence_records"]["Insert"]["custody"]>,
  });
  if (error) throw new Error(error.message);
}

export function newRecordId() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return `NCR-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}
