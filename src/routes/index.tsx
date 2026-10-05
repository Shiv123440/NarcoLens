import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Clock3, FileCheck2, FileText, LockKeyhole, ScanLine } from "lucide-react";
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

function SubstanceWatermark({ id }: { id: string }) {
  if (id === "cannabis") {
    return (
      <svg className="app-substance-watermark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round">
          <path d="M 75 120 A 45 45 0 0 0 120 75" />
          <path d="M 65 120 A 55 55 0 0 0 120 65" />
          <path d="M 55 120 A 65 65 0 0 0 120 55" />
          <path d="M 45 120 A 75 75 0 0 0 120 45" />
          <path d="M 35 120 A 85 85 0 0 0 120 35" />
        </g>
        <g stroke="currentColor" strokeWidth="1" opacity="0.28" fill="currentColor" fillOpacity="0.04">
          <path d="M100 20 C95 40, 85 55, 80 65 C85 60, 95 55, 110 50 C95 60, 85 68, 80 72 C90 75, 105 78, 115 82 C100 85, 90 82, 80 78 C75 90, 70 100, 68 110 C70 95, 75 85, 77 78 C70 80, 60 82, 50 82 C65 75, 74 72, 76 68 C68 62, 58 55, 50 50 C65 55, 74 60, 77 65 C78 50, 85 35, 100 20 Z" />
        </g>
      </svg>
    );
  }
  if (id === "cocaine") {
    return (
      <svg className="app-substance-watermark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round">
          <path d="M 75 120 A 45 45 0 0 0 120 75" />
          <path d="M 65 120 A 55 55 0 0 0 120 65" />
          <path d="M 55 120 A 65 65 0 0 0 120 55" />
          <path d="M 45 120 A 75 75 0 0 0 120 45" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="80,24 98,34 98,56 80,66 62,56 62,34" />
          <circle cx="80" cy="45" r="9" strokeDasharray="3 2" />
          <line x1="98" y1="34" x2="112" y2="26" />
          <line x1="80" y1="66" x2="80" y2="80" />
          <line x1="62" y1="56" x2="50" y2="64" />
        </g>
      </svg>
    );
  }
  if (id === "heroin") {
    return (
      <svg className="app-substance-watermark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round">
          <path d="M 75 120 A 45 45 0 0 0 120 75" />
          <path d="M 65 120 A 55 55 0 0 0 120 65" />
          <path d="M 55 120 A 65 65 0 0 0 120 55" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="70,22 88,32 88,54 70,64 52,54 52,32" />
          <polygon points="88,32 106,22 118,36 106,54 88,54" />
          <line x1="70" y1="64" x2="70" y2="78" />
          <line x1="52" y1="54" x2="40" y2="62" />
        </g>
      </svg>
    );
  }
  if (id === "amphetamines") {
    return (
      <svg className="app-substance-watermark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round">
          <path d="M 80 120 A 40 40 0 0 0 120 80" />
          <path d="M 70 120 A 50 50 0 0 0 120 70" />
          <path d="M 60 120 A 60 60 0 0 0 120 60" />
        </g>
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="76,18 96,29 96,51 76,62 56,51 56,29" />
          <circle cx="76" cy="40" r="9" strokeDasharray="3 2" />
          <line x1="96" y1="29" x2="112" y2="20" />
          <line x1="112" y1="20" x2="120" y2="28" />
        </g>
        <g fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1" opacity="0.32">
          <circle cx="82" cy="85" r="13" />
          <line x1="72" y1="85" x2="92" y2="85" />
          <circle cx="104" cy="74" r="10" />
        </g>
      </svg>
    );
  }
  return (
    <svg className="app-substance-watermark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round">
        <path d="M 80 120 A 40 40 0 0 0 120 80" />
        <path d="M 70 120 A 50 50 0 0 0 120 70" />
        <path d="M 60 120 A 60 60 0 0 0 120 60" />
      </g>
      <g stroke="currentColor" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="72,20 90,30 90,52 72,62 54,52 54,30" />
        <polygon points="90,30 108,20 120,35 108,52 90,52" />
        <line x1="108" y1="20" x2="108" y2="8" />
      </g>
      <g fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1" opacity="0.32">
        <circle cx="92" cy="88" r="14" />
        <line x1="80" y1="88" x2="104" y2="88" />
      </g>
    </svg>
  );
}

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
  return <AppShell>
    <section className="app-hero" aria-label="Start a new test">
      <div className="app-hero-media">
        <img
          src="/hero-banner@2x.png"
          srcSet="/hero-banner.png 948w, /hero-banner@2x.png 1896w"
          sizes="(max-width: 1200px) 100vw, 1180px"
          alt="Start a new test · Field ready. Capture a presumptive colour response, seal original evidence, and keep chain of custody intact."
          className="app-hero-banner-img"
          loading="eager"
          decoding="async"
        />
        <Link
          to="/scan"
          search={{ substance: undefined }}
          className="app-hero-cta-hitbox"
          aria-label="Start field test"
          title="Start field test"
        >
          <span className="sr-only">Start field test</span>
        </Link>
      </div>
    </section>
  <div className="app-section-head app-substance-head">
    <div className="app-substance-title-group">
      <h2 className="app-title">Testing for</h2>
      <span className="app-substance-accent-bar" aria-hidden="true" />
    </div>
    <div className="app-substance-kit-badge">
      <FileText size={15} strokeWidth={2.2} className="app-substance-kit-icon" aria-hidden="true" />
      <span className="app-substance-kit-divider" aria-hidden="true" />
      <span className="app-kicker app-substance-kicker">NCB reference kit</span>
    </div>
  </div>
  <section className="app-section-testing" aria-label="Substance reference library">
    <div className="app-testing-bg-arcs" aria-hidden="true">
      <svg viewBox="0 0 320 120" fill="none" className="app-testing-bg-svg">
        <path d="M 50 120 A 110 110 0 0 1 270 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M 70 120 A 90 90 0 0 1 250 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M 90 120 A 70 70 0 0 1 230 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M 110 120 A 50 50 0 0 1 210 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M 130 120 A 30 30 0 0 1 190 120" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
    <div className="app-grid-substances">
      {SUBSTANCES.map((substance) => (
        <Link
          key={substance.id}
          to="/scan"
          search={{ substance: substance.id }}
          className="app-card app-substance"
        >
          <div className="app-substance-top">
            <span className="app-substance-icon">
              <SectionIcon type={substance.icon} />
            </span>
            <h3 className="app-substance-name">{substance.name}</h3>
            {substance.id === "methaqualone" ? (
              <span className="app-pending">Kit mapping pending</span>
            ) : (
              <p className="app-substance-note">{substance.note}</p>
            )}
          </div>
          <div className="app-substance-bottom">
            <span className="app-substance-arrow" aria-hidden="true">
              <ArrowRight size={13} strokeWidth={2.4} />
            </span>
          </div>
          <SubstanceWatermark id={substance.id} />
        </Link>
      ))}
    </div>
  </section>
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
