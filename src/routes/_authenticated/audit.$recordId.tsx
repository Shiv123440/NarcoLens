import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { recordQuery } from "@/lib/evidence";
import { CheckCircle2, Clock3, Hash, LockKeyhole, MapPin, ShieldCheck, User, FileText, Scale } from "lucide-react";
import { verifyChain } from "@/lib/forensics";
import { Button } from "@/components/ui/button";
import { AppShell, PageBack } from "@/components/app-shell";
import { formatRecordTime, type AuditRecord } from "@/lib/app-data";
import { LegalCertificate } from "@/components/legal-certificate";

export const Route = createFileRoute("/_authenticated/audit/$recordId")({
  head: () => ({ meta: [
    { title: "Evidence record · DRUG-SHIELD AI" },
    { name: "description", content: "Sealed chain-of-custody record with SHA-256 evidence seal and audit trail." },
    { property: "og:title", content: "Evidence record · DRUG-SHIELD AI" },
    { property: "og:description", content: "Sealed chain-of-custody record with SHA-256 evidence seal and audit trail." },
  ] }),
  component: RecordPage,
});

function RecordPage() {
  const { recordId } = Route.useParams();
  const q = useQuery(recordQuery(recordId));
  const record = q.data;
  const [showCert, setShowCert] = useState(false);

  if (q.isLoading) return <AppShell><p className="text-sm text-muted-foreground">Loading evidence record…</p></AppShell>;

  if (!record) {
    return <AppShell>
      <div className="app-page-heading"><div><PageBack to="/audit" /><h1 className="app-title mt-4">Record not found</h1><p>{q.isError ? `Could not load this record: ${q.error.message}` : "This record is not in the shared evidence ledger, or you do not have access to it."}</p></div></div>
      <Button asChild><Link to="/audit">Back to audit logs</Link></Button>
    </AppShell>;
  }

  const verdictPill = record.verdict === "POSITIVE"
    ? <span className="app-pill app-pill-positive"><CheckCircle2 size={12} />Detected · {record.substance}</span>
    : record.verdict === "INCONCLUSIVE"
      ? <span className="app-pill app-pill-inconclusive"><Clock3 size={12} />Result unclear</span>
      : <span className="app-pill app-pill-negative"><CheckCircle2 size={12} />No drug detected</span>;

  const trail = [
    { label: "Case details recorded", done: true },
    { label: `Reagents assigned · ${record.reagent}`, done: true },
    { label: "Evidence photo captured & hashed", done: true },
    { label: "Record sealed to shared ledger", done: record.sealed },
    { label: "Stored in shared cloud ledger", done: record.synced },
  ];

  return <AppShell>
    <div className="app-page-heading">
      <div>
        <PageBack to="/audit" />
        <span className="app-kicker block mt-4">Evidence record</span>
        <h1 className="app-title">{record.id}</h1>
        <p>{record.caseNumber} · {formatRecordTime(record.timestamp)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => setShowCert(true)}>
          <FileText size={14} className="mr-1.5" />
          Section 63 BSA Certificate
        </Button>
        {verdictPill}
      </div>
    </div>

    {showCert && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 backdrop-blur-sm p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <LegalCertificate record={record} onClose={() => setShowCert(false)} />
        </div>
      </div>
    )}

    <div className="app-result-grid">
      <section className="app-card app-form-card">
        <h2>Test summary</h2>
        <p>{record.summary}</p>
        <div className="app-result-metric mt-4">
          <div><span className="app-metric-label">Primary reagent</span><strong className="app-metric-value">{record.reagent}</strong></div>
          <div><span className="app-metric-label">Confidence</span><strong className="app-metric-value">{record.confidence}%</strong></div>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <span className="inline-flex items-center gap-2"><MapPin size={14} className="text-muted-foreground" />{record.location}</span>
          <span className="inline-flex items-center gap-2"><User size={14} className="text-muted-foreground" />{record.officer}</span>
          <span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-muted-foreground" />{record.sealed ? "Sealed" : "Unsealed"} · {record.synced ? "Synced" : "Pending sync"}</span>
        </div>
      </section>

      <section className="app-card app-form-card">
        <h2>Chain of custody</h2>
        <div className="app-stage-list mt-2">
          {trail.map((item) => (
            <div className="app-stage" data-done={item.done} key={item.label}>
              <span className="app-stage-dot" />{item.label}
            </div>
          ))}
        </div>
      </section>
    </div>

    <section className="app-card mt-3 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold"><Hash size={14} /> SHA-256 evidence seal</div>
      <p className="mt-2 break-all font-mono text-[.65rem] text-muted-foreground">{record.sha256}</p>
      {record.gps && <p className="mt-2 text-xs text-muted-foreground">GPS: {record.gps}</p>}
    </section>

    <TamperCheck record={record} />

    <p className="mt-4 text-xs text-muted-foreground">Presumptive field test. Not a substitute for laboratory confirmation.</p>
  </AppShell>;
}

function TamperCheck({ record }: { record: AuditRecord }) {
  const [result, setResult] = useState<boolean[] | null>(null);
  const chain = record.custody ?? [];
  const run = async () => setResult(await verifyChain(chain));
  const intact = result !== null && result.every(Boolean);
  return <section className="app-card mt-3 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={14} /> Tamper verification · hash-linked custody chain</div>
      <Button type="button" size="sm" variant="outline" disabled={chain.length === 0} onClick={() => void run()}>Verify custody chain</Button>
    </div>
    {chain.length === 0
      ? <p className="mt-2 text-xs text-muted-foreground">This demo record has no hash-linked custody events. New scans are sealed with a verifiable chain.</p>
      : <ol className="mt-2 grid gap-1 text-xs">{chain.map((e, i) => <li key={e.id} className="flex flex-wrap gap-2"><span className="font-semibold">{e.action}</span><span className="text-muted-foreground">{formatRecordTime(e.timestampUtc)} · {e.actor}</span>{result && <span className={result[i] ? "text-primary" : "text-destructive"}>{result[i] ? "intact" : "TAMPERED"}</span>}</li>)}</ol>}
    {result && <p role="status" className={`mt-2 text-xs font-semibold ${intact ? "text-primary" : "text-destructive"}`}>{intact ? "All custody links verified — no tampering detected." : "Custody chain broken — this record has been altered."}</p>}
  </section>;
}
