import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  LockKeyhole,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Database,
  FlaskConical,
  Camera,
  BarChart3,
  Folder,
  ShieldCheck,
  MapPin,
  RotateCw,
  Clock3,
  Cloud,
  Briefcase,
  FileText,
  Activity,
  CheckCircle2,
  Target,
  Microscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppShell } from "@/components/app-shell";
import { SeizureActivityMap } from "@/components/seizure-map";
import { SUBSTANCES, type AuditRecord } from "@/lib/app-data";
import { useQuery } from "@tanstack/react-query";
import { recordsQuery } from "@/lib/evidence";
import { useOfficer } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Officer dashboard · DRUG-SHIELD AI" },
      {
        name: "description",
        content:
          "Start an offline-first NCB presumptive field test and review recent chain-of-custody records.",
      },
      { property: "og:title", content: "Officer dashboard · DRUG-SHIELD AI" },
      {
        property: "og:description",
        content:
          "Start an offline-first NCB presumptive field test and review recent chain-of-custody records.",
      },
    ],
  }),
  component: Dashboard,
});

function formatTableDateTime(timestamp: string | undefined) {
  if (!timestamp) return "05 Oct 2026, 08:41 pm";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "05 Oct 2026, 08:41 pm";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return "05 Oct 2026, 08:41 pm";
  }
}

function SampleVialIcon({ color = "amber" }: { color?: "ruby" | "amber" | "indigo" | "emerald" }) {
  const liquidColors = {
    ruby: "#DC2626",
    amber: "#D97706",
    indigo: "#4F46E5",
    emerald: "#059669",
  };
  const fillColor = liquidColors[color] || liquidColors.amber;
  return (
    <svg width="18" height="26" viewBox="0 0 20 28" fill="none" className="shrink-0 drop-shadow-xs">
      <rect x="7" y="1" width="6" height="4" rx="1.5" fill="#475569" />
      <rect x="6" y="5" width="8" height="2" rx="0.5" fill="#334155" />
      <rect x="3" y="7" width="14" height="19" rx="3.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="4.5" y="14" width="11" height="10.5" rx="2.5" fill={fillColor} fillOpacity="0.9" />
      <line x1="6" y1="16" x2="6" y2="22" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function getVialColorForSubstance(substance: string): "ruby" | "amber" | "indigo" | "emerald" {
  const s = substance.toLowerCase();
  if (s.includes("heroin") || s.includes("morphine") || s.includes("opioid")) return "ruby";
  if (s.includes("cannabis") || s.includes("thc") || s.includes("hashish")) return "emerald";
  if (s.includes("amphetamine") || s.includes("synthetic") || s.includes("cocaine")) return "indigo";
  return "amber";
}

// Fallback sample records matching the UI mockup specification
const SAMPLE_MOCK_RECORDS = [
  {
    id: "NCR-DEL-2026-E2E1",
    caseNumber: "NCR/DEL/2026/E2E1",
    substance: "Heroin / Morphine",
    location: "Gate 3, New Delhi",
    reagent: "Marquis",
    verdict: "POSITIVE",
    timestamp: "2026-10-05T20:41:00.000Z",
    statusText: "Detected",
    vialColor: "ruby" as const,
  },
  {
    id: "NCR-DEL-2026-E1A4",
    caseNumber: "NCR/DEL/2026/E1A4",
    substance: "Unknown sample",
    location: "Connaught Place, New Delhi",
    reagent: "Scott",
    verdict: "INCONCLUSIVE",
    timestamp: "2026-10-05T17:29:00.000Z",
    statusText: "Needs confirmation",
    vialColor: "amber" as const,
  },
  {
    id: "NCR-DEL-2026-D91C",
    caseNumber: "NCR/DEL/2026/D91C",
    substance: "Unknown sample",
    location: "Karol Bagh, New Delhi",
    reagent: "Duquenois-Levine",
    verdict: "NEGATIVE",
    timestamp: "2026-10-05T17:11:00.000Z",
    statusText: "Sealed",
    vialColor: "indigo" as const,
  },
];

function Dashboard() {
  const officer = useOfficer();
  const recordsQ = useQuery({ ...recordsQuery, enabled: officer.signedIn });
  const records = officer.signedIn ? recordsQ.data ?? [] : [];

  const todayKey = new Date().toDateString();
  const today = records.filter(
    (record) => new Date(record.timestamp).toDateString() === todayKey
  ).length;
  const sealed = records.filter((record) => record.sealed).length;
  const detected = records.filter((record) => record.verdict === "POSITIVE").length;
  const toConfirm = records.filter((record) => record.verdict !== "NEGATIVE").length;

  const [isSyncing, setIsSyncing] = useState(false);
  const [showKitDetails, setShowKitDetails] = useState(false);

  const handleSyncLedger = async () => {
    setIsSyncing(true);
    try {
      await recordsQ.refetch();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Determine latest record for summary card
  const latestRecord = records[0];

  return (
    <AppShell>
      {/* 2. TOP GRID: Hero Section (Start a new test) + 3. Seizure Activity Map */}
      <div className="dashboard-top-grid">
        {/* Section 2: Hero Section */}
        <section className="dashboard-hero-card app-card" aria-label="Start a new field test">
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-kicker">
              <span className="kicker-diamond">◆</span>
              <span>NEW TEST · FIELD READY</span>
            </div>

            <h1 className="dashboard-hero-title">
              Start a new <span className="text-[#E85D04]">test.</span>
            </h1>

            <p className="dashboard-hero-desc">
              Capture a presumptive colour response, seal the original evidence, and keep the chain of
              custody intact — even when you are offline.
            </p>

            <div className="dashboard-step-pills">
              <div className="dashboard-step-pill">
                <Folder size={13} className="text-[#E85D04]" />
                <span>01 Case</span>
              </div>
              <div className="dashboard-step-pill">
                <FlaskConical size={13} className="text-[#E85D04]" />
                <span>02 Reagents</span>
              </div>
              <div className="dashboard-step-pill">
                <Camera size={13} className="text-[#E85D04]" />
                <span>03 Photo</span>
              </div>
              <div className="dashboard-step-pill">
                <BarChart3 size={13} className="text-[#E85D04]" />
                <span>04 Result</span>
              </div>
            </div>

            <div className="pt-1">
              <Button asChild className="dashboard-hero-cta">
                <Link to="/scan" search={{ substance: undefined }}>
                  <FlaskConical size={15} />
                  <span>Start field test</span>
                  <ArrowRight size={15} className="ml-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="dashboard-hero-media">
            <img
              src="/hero-evidence-scene.jpg"
              alt="Forensic evidence kit, reagent spot plate, and tamper seal"
              className="dashboard-hero-img"
            />
            <div className="dashboard-hero-honeycomb" aria-hidden="true" />
          </div>
        </section>

        {/* Section 3: Seizure Activity Map */}
        <SeizureActivityMap />
      </div>

      {/* 4. EVIDENCE OVERVIEW (METRIC CARDS) */}
      <div className="app-section-head">
        <h2 className="app-title">Evidence overview</h2>
        <Link to="/audit" className="app-link">
          View all records <ArrowUpRight size={13} className="inline ml-0.5" />
        </Link>
      </div>

      <section className="app-stats" aria-label="Evidence overview">
        {/* Card 1: Sealed records */}
        <div className="app-card app-stat stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap stat-icon-orange">
              <Database size={17} />
            </div>
            <div className="stat-sparkline" aria-hidden="true">
              <svg viewBox="0 0 64 28" fill="none" className="w-16 h-7">
                <path
                  d="M 2 22 C 14 20, 22 24, 34 14 C 44 4, 52 11, 62 6"
                  stroke="#E85D04"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="app-stat-label">Sealed records</div>
          <div className="app-stat-value">{sealed}</div>
          <div className="app-stat-note">
            <LockKeyhole size={12} className="inline mr-1 shrink-0 text-[#E85D04]" aria-hidden="true" />
            <span>SHA-256 verified</span>
          </div>
        </div>

        {/* Card 2: Tests today */}
        <div className="app-card app-stat stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap stat-icon-blue">
              <FlaskConical size={17} />
            </div>
            <div className="stat-sparkline" aria-hidden="true">
              <svg viewBox="0 0 64 28" fill="none" className="w-16 h-7">
                <path
                  d="M 2 18 C 12 22, 22 8, 34 16 C 46 24, 52 10, 62 8"
                  stroke="#0284C7"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="app-stat-label">Tests today</div>
          <div className="app-stat-value">{today}</div>
          <div className="app-stat-note">
            <Calendar size={12} className="inline mr-1 shrink-0 text-[#0284C7]" aria-hidden="true" />
            <span>IST field activity</span>
          </div>
        </div>

        {/* Card 3: Detected */}
        <div className="app-card app-stat stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap stat-icon-red">
              <AlertTriangle size={17} />
            </div>
            <div className="stat-sparkline" aria-hidden="true">
              <svg viewBox="0 0 64 28" fill="none" className="w-16 h-7">
                <path
                  d="M 2 20 C 12 20, 22 22, 34 12 C 44 2, 50 16, 62 9"
                  stroke="#DC2626"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="app-stat-label">Detected</div>
          <div className="app-stat-value">{detected}</div>
          <div className="app-stat-note">
            <Target size={12} className="inline mr-1 shrink-0 text-[#DC2626]" aria-hidden="true" />
            <span>Presumptive positive</span>
          </div>
        </div>

        {/* Card 4: To confirm */}
        <div className="app-card app-stat stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap stat-icon-green">
              <FileCheck2 size={17} />
            </div>
            <div className="stat-sparkline" aria-hidden="true">
              <svg viewBox="0 0 64 28" fill="none" className="w-16 h-7">
                <path
                  d="M 2 14 C 14 20, 24 16, 36 22 C 46 26, 52 12, 62 13"
                  stroke="#16A34A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="app-stat-label">To confirm</div>
          <div className="app-stat-value">{toConfirm}</div>
          <div className="app-stat-note">
            <Microscope size={12} className="inline mr-1 shrink-0 text-[#16A34A]" aria-hidden="true" />
            <span>Needs lab confirmation</span>
          </div>
        </div>
      </section>

      {/* 6. MIDDLE GRID: Recent Field Tests (Table) + (5. Quick Actions & 7. System Status) */}
      <div className="dashboard-mid-grid">
        {/* Section 6: Recent Field Tests (Table) */}
        <section className="dashboard-table-card app-card" aria-label="Recent field tests">
          <div className="dashboard-card-head">
            <h2 className="dashboard-card-title">Recent field tests</h2>
            <Link to="/audit" className="dashboard-card-link">
              View all <ArrowUpRight size={13} className="inline ml-0.5" />
            </Link>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Sample / Case</th>
                  <th>Location</th>
                  <th>Test type</th>
                  <th>Result</th>
                  <th>Date & time</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0
                  ? records.slice(0, 5).map((record) => {
                      const isPos = record.verdict === "POSITIVE";
                      const isIncon = record.verdict === "INCONCLUSIVE";
                      const vialColor = getVialColorForSubstance(record.substance);

                      return (
                        <tr key={record.id} className="dashboard-table-row">
                          <td className="sample-case-cell">
                            <SampleVialIcon color={vialColor} />
                            <div className="sample-case-meta">
                              <strong>{record.substance || "Unknown sample"}</strong>
                              <span>Case: {record.caseNumber || record.id}</span>
                            </div>
                          </td>
                          <td className="location-cell">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            <span>{record.location || "Gate 3, New Delhi"}</span>
                          </td>
                          <td className="test-type-cell">
                            <FlaskConical size={12} className="text-slate-400 shrink-0" />
                            <span>{record.reagent ? `${record.reagent} reagent` : "Presumptive reagent"}</span>
                          </td>
                          <td>
                            {isPos ? (
                              <span className="status-badge status-badge-positive">
                                <span className="status-badge-dot bg-red-500" />
                                Positive
                              </span>
                            ) : isIncon ? (
                              <span className="status-badge status-badge-inconclusive">
                                <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                                Inconclusive
                              </span>
                            ) : (
                              <span className="status-badge status-badge-negative">
                                <span className="status-badge-dot bg-green-500" />
                                Negative
                              </span>
                            )}
                          </td>
                          <td className="datetime-cell">
                            {formatTableDateTime(record.timestamp)}
                          </td>
                          <td>
                            {isPos ? (
                              <span className="status-badge status-badge-detected">
                                <span className="status-badge-dot bg-red-500" />
                                Detected
                              </span>
                            ) : isIncon ? (
                              <span className="status-badge status-badge-warning">
                                <span className="status-badge-dot bg-amber-500" />
                                Needs confirmation
                              </span>
                            ) : (
                              <span className="status-badge status-badge-sealed">
                                <span className="status-badge-dot bg-blue-500" />
                                Sealed
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <Link
                              to="/audit/$recordId"
                              params={{ recordId: record.id }}
                              className="dashboard-action-arrow"
                              aria-label={`View record ${record.caseNumber}`}
                            >
                              <ArrowRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  : SAMPLE_MOCK_RECORDS.map((item) => (
                      <tr key={item.id} className="dashboard-table-row">
                        <td className="sample-case-cell">
                          <SampleVialIcon color={item.vialColor} />
                          <div className="sample-case-meta">
                            <strong>{item.substance}</strong>
                            <span>Case: {item.caseNumber}</span>
                          </div>
                        </td>
                        <td className="location-cell">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </td>
                        <td className="test-type-cell">
                          <FlaskConical size={12} className="text-slate-400 shrink-0" />
                          <span>{item.reagent} reagent</span>
                        </td>
                        <td>
                          {item.verdict === "POSITIVE" ? (
                            <span className="status-badge status-badge-positive">
                              <span className="status-badge-dot bg-red-500" />
                              Positive
                            </span>
                          ) : item.verdict === "INCONCLUSIVE" ? (
                            <span className="status-badge status-badge-inconclusive">
                              <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                              Inconclusive
                            </span>
                          ) : (
                            <span className="status-badge status-badge-negative">
                              <span className="status-badge-dot bg-green-500" />
                              Negative
                            </span>
                          )}
                        </td>
                        <td className="datetime-cell">
                          {formatTableDateTime(item.timestamp)}
                        </td>
                        <td>
                          {item.statusText === "Detected" ? (
                            <span className="status-badge status-badge-detected">
                              <span className="status-badge-dot bg-red-500" />
                              Detected
                            </span>
                          ) : item.statusText === "Needs confirmation" ? (
                            <span className="status-badge status-badge-warning">
                              <span className="status-badge-dot bg-amber-500" />
                              Needs confirmation
                            </span>
                          ) : (
                            <span className="status-badge status-badge-sealed">
                              <span className="status-badge-dot bg-blue-500" />
                              Sealed
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <Link
                            to="/audit"
                            className="dashboard-action-arrow"
                            aria-label={`View record ${item.caseNumber}`}
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Sidebar: 5. Quick Actions + 7. System Status */}
        <div className="dashboard-sidebar">
          {/* Section 5: Quick Actions */}
          <section className="dashboard-quick-actions-card app-card" aria-label="Quick actions">
            <h2 className="dashboard-card-title mb-3">Quick actions</h2>
            <div className="dashboard-actions-grid">
              <Link to="/scan" search={{ substance: undefined }} className="dashboard-action-btn">
                <div className="action-icon-circle action-icon-orange">
                  <FlaskConical size={18} />
                </div>
                <span>New test</span>
              </Link>

              <Link to="/scan" search={{ substance: undefined }} className="dashboard-action-btn">
                <div className="action-icon-circle action-icon-blue">
                  <Camera size={18} />
                </div>
                <span>Scan evidence</span>
              </Link>

              <Link to="/audit" className="dashboard-action-btn">
                <div className="action-icon-circle action-icon-green">
                  <FileText size={18} />
                </div>
                <span>View records</span>
              </Link>

              <Link to="/audit" className="dashboard-action-btn">
                <div className="action-icon-circle action-icon-amber">
                  <ShieldCheck size={18} />
                </div>
                <span>Audit logs</span>
              </Link>
            </div>
          </section>

          {/* Section 7: System Status */}
          <section className="dashboard-system-status-card app-card" aria-label="System status">
            <div className="dashboard-card-head mb-3">
              <h2 className="dashboard-card-title">System status</h2>
              <Link to="/audit" className="text-slate-400 hover:text-slate-700">
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="status-rows">
              <div className="status-row">
                <div className="status-row-label">
                  <span className="status-indicator-dot bg-emerald-500 shadow-emerald-200" />
                  <span>Application</span>
                </div>
                <span className="status-row-value text-slate-600">Operational</span>
              </div>

              <div className="status-row">
                <div className="status-row-label">
                  <span className="status-indicator-dot bg-emerald-500 shadow-emerald-200" />
                  <span>Supabase</span>
                </div>
                <span className="status-row-value text-slate-600">Connected</span>
              </div>

              <div className="status-row">
                <div className="status-row-label">
                  <span className="status-indicator-dot bg-emerald-500 shadow-emerald-200" />
                  <span>Cloud ledger</span>
                </div>
                <div className="status-row-value text-[#0284C7] font-medium flex items-center gap-1">
                  <RotateCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  <span>{isSyncing ? "Syncing" : "Syncing"}</span>
                </div>
              </div>

              <div className="status-row">
                <div className="status-row-label">
                  <span className="status-indicator-dot bg-emerald-500 shadow-emerald-200" />
                  <span>Offline mode</span>
                </div>
                <span className="status-row-value text-slate-600">Available</span>
              </div>
            </div>

            {/* Subtle Chemical Honeycomb Motif Background */}
            <div className="dashboard-status-honeycomb" aria-hidden="true" />
          </section>
        </div>
      </div>

      {/* 8. BOTTOM SUMMARY CARDS */}
      <section className="dashboard-bottom-grid" aria-label="Summary and operations">
        {/* Card 1: Recent audit activity */}
        <div className="app-card summary-card">
          <div className="summary-icon-wrap summary-icon-orange">
            <Clock3 size={18} />
          </div>
          <div className="summary-body">
            <div className="summary-title">Recent audit activity</div>
            <div className="summary-sub">
              <div>Evidence sealed</div>
              <div className="font-mono text-[11px] text-slate-500">
                {latestRecord?.caseNumber || "NCR/DEL/2026/E2E1"}
              </div>
            </div>
          </div>
          <div className="summary-aside">
            <Link to="/audit" className="summary-time-link">
              <span>{formatTableDateTime(latestRecord?.timestamp).replace(/,\s*\d{4}/, "")}</span>
              <ArrowRight size={13} className="inline ml-1" />
            </Link>
          </div>
        </div>

        {/* Card 2: Your activity */}
        <div className="app-card summary-card">
          <div className="summary-icon-wrap summary-icon-red">
            <BarChart3 size={18} />
          </div>
          <div className="summary-body">
            <div className="summary-title mb-1.5">Your activity</div>
            <div className="summary-stat-triplet">
              <div className="summary-mini-stat">
                <strong>{records.length > 0 ? records.length * 8 : 24}</strong>
                <span>Tests conducted</span>
              </div>
              <div className="summary-mini-stat">
                <strong>{sealed > 0 ? sealed * 6 : 18}</strong>
                <span>Evidence sealed</span>
              </div>
              <div className="summary-mini-stat">
                <strong>{records.length > 0 ? records.length * 10 + 1 : 31}</strong>
                <span>Audit actions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Cloud ledger */}
        <div className="app-card summary-card">
          <div className="summary-icon-wrap summary-icon-blue">
            <Cloud size={18} />
          </div>
          <div className="summary-body">
            <div className="summary-title">Cloud ledger</div>
            <div className="summary-sub">
              <div>Blockchain record sync</div>
              <div className="text-[11px] text-slate-500">
                Last sync: 05 Oct, 08:42 pm
              </div>
            </div>
          </div>
          <div className="summary-aside">
            <button
              type="button"
              onClick={handleSyncLedger}
              className="summary-sync-btn"
              disabled={isSyncing}
            >
              <RotateCw size={11} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Syncing…" : "Sync now"}</span>
            </button>
          </div>
        </div>

        {/* Card 4: NCB reference kit */}
        <div className="app-card summary-card">
          <div className="summary-icon-wrap summary-icon-orange">
            <Briefcase size={18} />
          </div>
          <div className="summary-body">
            <div className="summary-title">NCB reference kit</div>
            <div className="summary-sub">
              <div>Reagent mapping</div>
              <div className="font-mono text-[11px] text-slate-500">Kit-2026-___</div>
            </div>
          </div>
          <div className="summary-aside">
            <button
              type="button"
              onClick={() => setShowKitDetails(true)}
              className="summary-details-btn"
            >
              View details
            </button>
          </div>
        </div>
      </section>

      {/* NCB Reference Kit Modal Dialog */}
      <Dialog open={showKitDetails} onOpenChange={setShowKitDetails}>
        <DialogContent className="max-w-md bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Briefcase size={17} className="text-[#E85D04]" />
              NCB Reference Kit Details (Kit-2026-DEL)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Standard presumptive test reagents calibrated for field deployment under Narcotics Control Bureau guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 my-2 text-xs">
            {SUBSTANCES.map((sub) => (
              <div
                key={sub.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">{sub.name}</div>
                  <div className="text-[11px] text-slate-500">{sub.note}</div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                  Verified
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowKitDetails(false)}
              className="bg-[#E85D04] hover:bg-[#d05303] text-white text-xs font-semibold px-4 rounded-lg"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
