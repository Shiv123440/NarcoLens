import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Disc,
  FileCheck2,
  FileText,
  FlaskConical,
  LockKeyhole,
  MapPin,
  ScanLine,
  Target,
  TriangleAlert,
} from "lucide-react";
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

function VialSwatch({ substance, verdict, sealed }: { substance: string; verdict: string; sealed?: boolean }) {
  let fluidColor = "#94A3B8";
  const s = (substance || "").toLowerCase();

  if (verdict === "POSITIVE") {
    if (s.includes("heroin") || s.includes("morphine")) {
      fluidColor = "#9F1239";
    } else if (s.includes("cocaine")) {
      fluidColor = "#1D4ED8";
    } else if (s.includes("cannabis")) {
      fluidColor = "#7E22CE";
    } else if (s.includes("amphetamine")) {
      fluidColor = "#EA580C";
    } else {
      fluidColor = "#BE123C";
    }
  } else if (verdict === "INCONCLUSIVE") {
    fluidColor = "#D97706";
  } else if (sealed) {
    fluidColor = "#64748B";
  }

  return (
    <svg width="22" height="38" viewBox="0 0 22 38" fill="none" className="shrink-0 app-vial-svg" aria-hidden="true">
      <rect x="4" y="2" width="14" height="8" rx="2" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
      <line x1="8" y1="4" x2="8" y2="8" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
      <line x1="11" y1="4" x2="11" y2="8" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
      <line x1="14" y1="4" x2="14" y2="8" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
      <rect x="5" y="10" width="12" height="25" rx="3" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="6" y="18" width="10" height="16" rx="2" fill={fluidColor} />
      <ellipse cx="11" cy="18" rx="5" ry="1.5" fill={fluidColor} opacity="0.9" />
      <line x1="7" y1="12" x2="7" y2="32" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" strokeLinecap="round" />
    </svg>
  );
}

function splitLocation(loc: string) {
  if (!loc) return { primary: "Field location", secondary: "Unspecified" };
  if (loc.includes("·")) {
    const parts = loc.split("·").map((p) => p.trim());
    return { primary: parts[1] ? `${parts[1]},` : parts[0], secondary: parts[1] ? parts[0] : "" };
  }
  if (loc.includes(",")) {
    const parts = loc.split(",");
    const primary = parts[0]?.trim() ? `${parts[0].trim()},` : "";
    const secondary = parts.slice(1).join(",").trim();
    return { primary, secondary };
  }
  return { primary: loc, secondary: "" };
}

function splitRecordTime(timestamp: string) {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return { date: timestamp, time: "" };
    const date = new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d) + ",";
    const time = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d).toLowerCase();
    return { date, time };
  } catch {
    return { date: timestamp, time: "" };
  }
}

function getReagentInfo(reagent: string) {
  const r = (reagent || "").toLowerCase();
  let boxClass = "app-reagent-amber";
  let name = reagent || "Reference kit";

  if (r.includes("marquis")) {
    boxClass = "app-reagent-red";
    name = "Marquis reagent";
  } else if (r.includes("scott")) {
    boxClass = "app-reagent-blue";
    name = "Scott reagent";
  } else if (r.includes("duquenois")) {
    boxClass = "app-reagent-purple";
    name = "Duquenois-Levine";
  } else if (r.includes("simon")) {
    boxClass = "app-reagent-blue";
    name = "Simon's reagent";
  } else if (r) {
    name = r.includes("reagent") ? reagent : `${reagent} reagent`;
  }

  return { boxClass, name };
}

function renderLedgerBadge(record: AuditRecord) {
  if (record.verdict === "POSITIVE") {
    return (
      <span className="app-ledger-badge app-badge-positive">
        <Target size={13} strokeWidth={2.4} aria-hidden="true" />
        <span>Detected · {record.substance}</span>
      </span>
    );
  }
  if (record.verdict === "INCONCLUSIVE") {
    return (
      <span className="app-ledger-badge app-badge-inconclusive">
        <Clock3 size={13} strokeWidth={2.4} aria-hidden="true" />
        <span>Result unclear</span>
      </span>
    );
  }
  if (record.sealed) {
    return (
      <span className="app-ledger-badge app-badge-sealed">
        <Disc size={13} strokeWidth={2.4} aria-hidden="true" />
        <span>Sealed</span>
      </span>
    );
  }
  return (
    <span className="app-ledger-badge app-badge-negative">
      <CheckCircle2 size={13} strokeWidth={2.4} aria-hidden="true" />
      <span>No drug detected</span>
    </span>
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
  <div className="app-section-head app-evidence-head">
    <div className="app-evidence-title-group">
      <h2 className="app-title">Evidence overview</h2>
      <span className="app-evidence-accent-bar" aria-hidden="true" />
    </div>
    <div className="app-evidence-watermark" aria-hidden="true">
      <svg viewBox="0 0 160 80" fill="none" className="w-full h-full opacity-[0.08] text-[#C28B5E]">
        <path d="M 20 80 A 65 65 0 0 1 140 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 32 80 A 53 53 0 0 1 128 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 44 80 A 41 41 0 0 1 116 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 56 80 A 29 29 0 0 1 104 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 68 80 A 17 17 0 0 1 92 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
    <Link to="/audit" className="app-link app-evidence-link">
      <span>View all records</span>
      <ArrowUpRight size={13} className="inline ml-0.5 app-evidence-link-icon" aria-hidden="true" />
    </Link>
  </div>
  <section className="app-stats" aria-label="Evidence overview">
    <div className="app-card app-stat">
      <span className="app-stat-accent-bar" aria-hidden="true" />
      <div className="app-stat-icon-wrap app-stat-icon-peach" aria-hidden="true">
        <Database size={22} strokeWidth={2} />
      </div>
      <div className="app-stat-content">
        <div className="app-stat-label">Sealed records</div>
        <div className="app-stat-value">{sealed}</div>
        <div className="app-stat-note">
          <LockKeyhole size={12} className="inline mr-1 shrink-0 text-slate-500" aria-hidden="true" />
          <span>SHA-256 verified</span>
        </div>
      </div>
      <div className="app-stat-sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 56 28" fill="none" className="app-stat-sparkline">
          <path
            d="M 3 22 C 11 25, 17 15, 23 16 C 29 17, 34 23, 41 15 C 46 9, 50 7, 53 6"
            stroke="#EA580C"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
    <div className="app-card app-stat">
      <span className="app-stat-accent-bar" aria-hidden="true" />
      <div className="app-stat-icon-wrap app-stat-icon-blue" aria-hidden="true">
        <FlaskConical size={22} strokeWidth={2} />
      </div>
      <div className="app-stat-content">
        <div className="app-stat-label">Tests today</div>
        <div className="app-stat-value">{today}</div>
        <div className="app-stat-note">
          <Calendar size={12} className="inline mr-1 shrink-0 text-slate-500" aria-hidden="true" />
          <span>IST field activity</span>
        </div>
      </div>
      <div className="app-stat-sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 56 28" fill="none" className="app-stat-sparkline">
          <path
            d="M 3 20 C 9 22, 16 11, 23 11 C 30 11, 35 19, 42 12 C 46 8, 49 5, 53 4"
            stroke="#2563EB"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
    <div className="app-card app-stat">
      <span className="app-stat-accent-bar" aria-hidden="true" />
      <div className="app-stat-icon-wrap app-stat-icon-red" aria-hidden="true">
        <TriangleAlert size={22} strokeWidth={2} />
      </div>
      <div className="app-stat-content">
        <div className="app-stat-label">Detected</div>
        <div className="app-stat-value">{detected}</div>
        <div className="app-stat-note">
          <Target size={12} className="inline mr-1 shrink-0 text-red-500" aria-hidden="true" />
          <span>Presumptive positive</span>
        </div>
      </div>
      <div className="app-stat-sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 56 28" fill="none" className="app-stat-sparkline">
          <path
            d="M 3 20 C 11 23, 17 9, 25 11 C 33 13, 36 20, 43 11 C 47 6, 50 5, 53 4"
            stroke="#DC2626"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
    <div className="app-card app-stat">
      <span className="app-stat-accent-bar" aria-hidden="true" />
      <div className="app-stat-icon-wrap app-stat-icon-green" aria-hidden="true">
        <FileText size={22} strokeWidth={2} />
      </div>
      <div className="app-stat-content">
        <div className="app-stat-label">To confirm</div>
        <div className="app-stat-value">{toConfirm}</div>
        <div className="app-stat-note">
          <FlaskConical size={12} className="inline mr-1 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>Needs lab confirmation</span>
        </div>
      </div>
      <div className="app-stat-sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 56 28" fill="none" className="app-stat-sparkline">
          <path
            d="M 3 22 C 10 24, 16 13, 24 13 C 32 13, 36 19, 43 13 C 47 9, 50 7, 53 5"
            stroke="#16A34A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  </section>
  <div className="app-section-head app-ledger-head">
    <div className="app-ledger-title-group">
      <h2 className="app-title">Recent field tests</h2>
      <span className="app-ledger-accent-bar" aria-hidden="true" />
    </div>
    <div className="app-substance-watermark-center" aria-hidden="true">
      <svg viewBox="0 0 160 80" fill="none" className="w-full h-full opacity-[0.07] text-[#C28B5E]">
        <path d="M 30 80 A 60 60 0 0 1 130 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 40 80 A 50 50 0 0 1 120 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 50 80 A 40 40 0 0 1 110 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 60 80 A 30 30 0 0 1 100 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 70 80 A 20 20 0 0 1 90 80" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
    <div className="app-ledger-badge-top">
      <Database size={15} strokeWidth={2.2} className="app-ledger-db-icon" aria-hidden="true" />
      <span className="app-ledger-divider" aria-hidden="true" />
      <span className="app-kicker app-ledger-kicker">Shared ledger</span>
    </div>
  </div>
  <section className="app-ledger-card" aria-label="Recent field tests ledger">
    {!officer.signedIn && officer.ready && (
      <div className="p-4 text-sm text-muted-foreground">
        Sign in as an officer to view the shared evidence history.{" "}
        <Link to="/auth" search={{ mode: "login", next: "/" }} className="app-link">
          Login / Signup
        </Link>
      </div>
    )}
    {officer.signedIn && recordsQ.isLoading && (
      <p className="p-4 text-sm text-muted-foreground">Loading shared evidence ledger…</p>
    )}
    {officer.signedIn && recordsQ.isError && (
      <p className="p-4 text-sm text-destructive" role="alert">
        Could not load records: {recordsQ.error.message}
      </p>
    )}
    {officer.signedIn && recordsQ.isSuccess && records.length === 0 && (
      <p className="p-4 text-sm text-muted-foreground">
        No evidence sealed yet. Start a field test to create the first record.
      </p>
    )}
    {records.slice(0, 5).map((record) => {
      const loc = splitLocation(record.location);
      const dt = splitRecordTime(record.timestamp);
      const reagentInfo = getReagentInfo(record.reagent);

      return (
        <Link
          key={record.id}
          to="/audit/$recordId"
          params={{ recordId: record.id }}
          className="app-ledger-row"
        >
          <span className="app-ledger-row-accent" aria-hidden="true" />

          {/* Col 1: Sample & Case */}
          <div className="app-ledger-col app-ledger-col-sample">
            <VialSwatch substance={record.substance} verdict={record.verdict} sealed={record.sealed} />
            <div className="app-ledger-sample-info">
              <strong className="app-ledger-sample-name">{record.substance || "Unknown sample"}</strong>
              <span className="app-ledger-case-num">Case: {record.caseNumber}</span>
            </div>
          </div>

          {/* Col 2: Location */}
          <div className="app-ledger-col app-ledger-col-loc">
            <span className="app-ledger-icon-box app-ledger-icon-loc" aria-hidden="true">
              <MapPin size={14} strokeWidth={2.2} />
            </span>
            <div className="app-ledger-text-duo">
              <span className="app-ledger-text-primary">{loc.primary}</span>
              {loc.secondary && <span className="app-ledger-text-secondary">{loc.secondary}</span>}
            </div>
          </div>

          {/* Col 3: Reagent */}
          <div className="app-ledger-col app-ledger-col-reagent">
            <span className={`app-ledger-icon-box ${reagentInfo.boxClass}`} aria-hidden="true">
              <FlaskConical size={14} strokeWidth={2.2} />
            </span>
            <span className="app-ledger-reagent-name">{reagentInfo.name}</span>
          </div>

          {/* Col 4: Date & Time */}
          <div className="app-ledger-col app-ledger-col-time">
            <span className="app-ledger-icon-box app-ledger-icon-cal" aria-hidden="true">
              <Calendar size={14} strokeWidth={2.2} />
            </span>
            <div className="app-ledger-text-duo">
              <span className="app-ledger-text-primary">{dt.date}</span>
              {dt.time && <span className="app-ledger-text-secondary">{dt.time}</span>}
            </div>
          </div>

          {/* Col 5: Status Badge */}
          <div className="app-ledger-col app-ledger-col-status">
            {renderLedgerBadge(record)}
          </div>

          {/* Col 6: Action Chevron */}
          <div className="app-ledger-col app-ledger-col-action" aria-hidden="true">
            <ArrowRight size={16} strokeWidth={2.2} className="app-ledger-arrow" />
          </div>
        </Link>
      );
    })}
  </section>
  </AppShell>;
}
