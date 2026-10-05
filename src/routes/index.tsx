import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, ChevronRight, Clock3, FileCheck2, LockKeyhole, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell, SectionIcon } from "@/components/app-shell";
import { formatRecordTime, SUBSTANCES, type AuditRecord } from "@/lib/app-data";
import { useQuery } from "@tanstack/react-query";
import { recordsQuery } from "@/lib/evidence";
import { useOfficer } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Officer dashboard · DRUG-SHIELD AI" },
    { name: "description", content: "Start an offline-first NCB presumptive field test and review recent chain-of-custody records." },
    { property: "og:title", content: "Officer dashboard · DRUG-SHIELD AI" },
    { property: "og:description", content: "Start an offline-first NCB presumptive field test and review recent chain-of-custody records." },
  ] }),
  component: Dashboard,
});

function statusFor(record: AuditRecord) {
  if (record.verdict === "POSITIVE") return <span className="app-pill app-pill-positive"><CheckCircle2 size={12} />Detected · {record.substance}</span>;
  if (record.verdict === "INCONCLUSIVE") return <span className="app-pill app-pill-inconclusive"><Clock3 size={12} />Result unclear</span>;
  return <span className="app-pill app-pill-negative"><CheckCircle2 size={12} />No drug detected</span>;
}

function Dashboard() {
  const officer = useOfficer();
  const recordsQ = useQuery({ ...recordsQuery, enabled: officer.signedIn });
  const records = officer.signedIn ? recordsQ.data ?? [] : [];
  const todayKey = new Date().toDateString();
  const today = records.filter((record) => new Date(record.timestamp).toDateString() === todayKey).length;
  const sealed = records.filter((record) => record.sealed).length;
  const detected = records.filter((record) => record.verdict === "POSITIVE").length;
  const toConfirm = records.filter((record) => record.verdict !== "NEGATIVE").length;
  return <AppShell><section className="app-hero">
    <div className="app-hero-copy"><span className="app-kicker">New test · field ready</span><h1>Start a new test.</h1><p>Capture a presumptive colour response, seal the original evidence, and keep the chain of custody intact — even when you are offline.</p><div className="app-hero-tags"><span className="app-hero-tag">01 Case</span><span className="app-hero-tag">02 Reagents</span><span className="app-hero-tag">03 Photo</span><span className="app-hero-tag">04 Result</span></div><Button asChild size="lg"><Link to="/scan" search={{ substance: undefined }}><ScanLine />Start field test</Link></Button></div>
    <div className="app-hero-art" aria-label="Three-well field test illustration"><div className="app-wells"><span className="app-well" /><span className="app-well" /><span className="app-well" /></div></div>
  </section>
  <div className="app-section-head"><h2 className="app-title">Testing for</h2><span className="app-kicker">NCB reference kit</span></div>
  <section className="app-grid-substances" aria-label="Substance reference library">{SUBSTANCES.map((substance) => <Link key={substance.id} to="/scan" search={{ substance: substance.id }} className="app-card app-substance"><span className="app-substance-icon"><SectionIcon type={substance.icon} /></span><h3>{substance.name}</h3>{substance.id === "methaqualone" ? <span className="app-pending">Kit mapping pending</span> : <p>{substance.note}</p>}</Link>)}</section>
  <div className="app-section-head"><h2 className="app-title">Evidence overview</h2><Link to="/audit" className="app-link">View all records <ArrowUpRight size={13} className="inline" /></Link></div>
  <section className="app-stats" aria-label="Evidence overview">
    <div className="app-card app-stat">
      <div className="app-stat-label">Sealed records</div>
      <div className="app-stat-value">{sealed}</div>
      <div className="app-stat-note">
        <LockKeyhole size={12} className="inline mr-1 shrink-0" aria-hidden="true" />
        <span>SHA-256 verified</span>
      </div>
    </div>
    <div className="app-card app-stat">
      <div className="app-stat-label">Tests today</div>
      <div className="app-stat-value">{today}</div>
      <div className="app-stat-note">
        <span>IST field activity</span>
      </div>
    </div>
    <div className="app-card app-stat">
      <div className="app-stat-label">Detected</div>
      <div className="app-stat-value">{detected}</div>
      <div className="app-stat-note">
        <span>Presumptive positive</span>
      </div>
    </div>
    <div className="app-card app-stat">
      <div className="app-stat-label">To confirm</div>
      <div className="app-stat-value">{toConfirm}</div>
      <div className="app-stat-note">
        <span>Needs lab confirmation</span>
      </div>
    </div>
  </section>
  <div className="app-section-head"><h2 className="app-title">Recent field tests</h2><span className="app-kicker">Shared ledger</span></div>
  <section className="app-card app-recent">{!officer.signedIn && officer.ready && <div className="p-4 text-sm text-muted-foreground">Sign in as an officer to view the shared evidence history. <Link to="/auth" search={{ mode: "login", next: "/" }} className="app-link">Login / Signup</Link></div>}{officer.signedIn && recordsQ.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading shared evidence ledger…</p>}{officer.signedIn && recordsQ.isError && <p className="p-4 text-sm text-destructive" role="alert">Could not load records: {recordsQ.error.message}</p>}{officer.signedIn && recordsQ.isSuccess && records.length === 0 && <p className="p-4 text-sm text-muted-foreground">No evidence sealed yet. Start a field test to create the first record.</p>}{records.slice(0, 5).map((record) => <Link key={record.id} to="/audit/$recordId" params={{ recordId: record.id }} className="app-row"><span className="app-row-main"><strong>{record.substance}</strong><span>{record.caseNumber} · {record.location}</span></span><span className="app-row-meta">{formatRecordTime(record.timestamp)}</span>{statusFor(record)}<ChevronRight size={16} className="text-muted-foreground" /></Link>)}</section>
  </AppShell>;
}
