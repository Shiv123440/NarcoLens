import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Clock3, Download, LockKeyhole, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterRecords, recordsToCsv, recordsToManifest } from "@/lib/forensics";
import { AppShell, PageBack } from "@/components/app-shell";
import { formatRecordTime, readStoredRecords, seedRecords, type AuditRecord, type Verdict } from "@/lib/app-data";

export const Route = createFileRoute("/audit/")({
  head: () => ({ meta: [
    { title: "Audit logs & history · DRUG-SHIELD AI" },
    { name: "description", content: "Search the sealed chain-of-custody ledger of NCB presumptive field tests." },
    { property: "og:title", content: "Audit logs & history · DRUG-SHIELD AI" },
    { property: "og:description", content: "Search the sealed chain-of-custody ledger of NCB presumptive field tests." },
  ] }),
  component: AuditPage,
});

function statusFor(record: AuditRecord) {
  if (record.verdict === "POSITIVE") return <span className="app-pill app-pill-positive"><CheckCircle2 size={12} />Detected · {record.substance}</span>;
  if (record.verdict === "INCONCLUSIVE") return <span className="app-pill app-pill-inconclusive"><Clock3 size={12} />Result unclear</span>;
  return <span className="app-pill app-pill-negative"><CheckCircle2 size={12} />No drug detected</span>;
}

const filters: Array<{ id: "ALL" | Verdict; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "POSITIVE", label: "Detected" },
  { id: "NEGATIVE", label: "Negative" },
  { id: "INCONCLUSIVE", label: "Unclear" },
];

function AuditPage() {
  const [records, setRecords] = useState<AuditRecord[]>(seedRecords);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | Verdict>("ALL");
  useEffect(() => setRecords(readStoredRecords()), []);

  const visible = useMemo(() => filterRecords(records, { q: query, verdict: filter }), [records, query, filter]);
  const download = (content: string, name: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };

  return <AppShell>
    <div className="app-page-heading">
      <div>
        <PageBack to="/" />
        <span className="app-kicker block mt-4">Chain of custody</span>
        <h1 className="app-title">Audit logs & history</h1>
        <p>Every sealed field test, searchable and tamper-evident.</p>
      </div>
      <span className="app-pill app-pill-sealed"><LockKeyhole size={12} />{records.filter((r) => r.sealed).length} sealed records</span>
      <div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => download(recordsToCsv(visible), "drug-shield-audit.csv", "text/csv")}><Download />Export CSV</Button><Button type="button" size="sm" variant="outline" onClick={() => download(recordsToManifest(visible), "drug-shield-manifest.json", "application/json")}><Download />JSON manifest</Button></div>
    </div>

    <section className="app-card app-form-card">
      <div className="app-field">
        <label htmlFor="audit-search">Search records</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input id="audit-search" className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Case number, substance, location, or officer" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by verdict">
        {filters.map((item) => (
          <button key={item.id} type="button" className="app-step" data-active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
        ))}
      </div>
    </section>

    <section className="app-card app-recent mt-4" aria-label="Audit records">
      {visible.length === 0 && <p className="p-4 text-sm text-muted-foreground">No records match this search.</p>}
      {visible.map((record) => (
        <Link key={record.id} to="/audit/$recordId" params={{ recordId: record.id }} className="app-row">
          <span className="app-row-main"><strong>{record.substance}</strong><span>{record.caseNumber} · {record.location}</span></span>
          <span className="app-row-meta">{formatRecordTime(record.timestamp)}</span>
          {statusFor(record)}
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      ))}
    </section>
  </AppShell>;
}
