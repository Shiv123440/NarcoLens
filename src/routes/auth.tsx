import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUpOfficer, signInOfficer, getActiveOfficer } from "@/lib/auth-service";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("login" as const),
    next: typeof search["next"] === "string" ? search["next"] : "/",
  }),
  head: () => ({
    meta: [
      { title: "Officer access · DRUG-SHIELD AI" },
      { name: "description", content: "Sign in to the DRUG-SHIELD AI NCB field forensics workspace." },
      { property: "og:title", content: "Officer access · DRUG-SHIELD AI" },
      { property: "og:description", content: "Sign in to the DRUG-SHIELD AI NCB field forensics workspace." },
    ],
  }),
  component: AuthPage,
});

interface ReagentItem {
  id: string;
  name: string;
  badge: string;
  target: string;
  colorHex: string;
  colorLabel: string;
  wavelength: string;
  deltaE: string;
  confidence: string;
  spec: string;
}

const REAGENTS: ReagentItem[] = [
  {
    id: "marquis",
    name: "Marquis",
    badge: "Opiates",
    target: "Heroin / Morphine / Codeine",
    colorHex: "#581c87",
    colorLabel: "Deep Violet / Purple",
    wavelength: "415 nm",
    deltaE: "1.12",
    confidence: "99.4%",
    spec: "NDPS Sch. I / UNODC ST/NAR/1",
  },
  {
    id: "scott",
    name: "Scott",
    badge: "Cocaine",
    target: "Cocaine HCl & Crack Cocaine",
    colorHex: "#0284c7",
    colorLabel: "Cobalt Blue Precipitate",
    wavelength: "590 nm",
    deltaE: "0.86",
    confidence: "99.8%",
    spec: "Modified Cobalt Thiocyanate",
  },
  {
    id: "duquenois",
    name: "Duquenois",
    badge: "Cannabinoids",
    target: "Charas / Ganja / Hashish Oil",
    colorHex: "#7e22ce",
    colorLabel: "Biphasic Violet Organic Layer",
    wavelength: "540 nm",
    deltaE: "1.34",
    confidence: "98.9%",
    spec: "Rapid Chloroform Extraction",
  },
  {
    id: "ehrlich",
    name: "Ehrlich",
    badge: "Indoles",
    target: "LSD / Synthetic Tryptamines",
    colorHex: "#db2777",
    colorLabel: "Deep Magenta / Blue-Violet",
    wavelength: "460 nm",
    deltaE: "1.04",
    confidence: "99.1%",
    spec: "p-DMAB Spectral Assay",
  },
];

function InteractiveReagentLab() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const active = REAGENTS[selectedIdx] ?? REAGENTS[0]!;

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 850);
  };

  return (
    <div className="auth-interactive-card">
      <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
        <span className="font-mono text-[11px] font-bold tracking-wider text-amber-500 uppercase">
          Presumptive Spot Simulation
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sensor Calibrated
        </span>
      </div>

      {/* Interactive Reagent Selection Pills */}
      <div className="auth-reagent-tabs">
        {REAGENTS.map((reagent, idx) => (
          <button
            key={reagent.id}
            type="button"
            className="auth-reagent-tab"
            data-active={idx === selectedIdx}
            onClick={() => setSelectedIdx(idx)}
          >
            <span>{reagent.name}</span>
            <span className="block text-[9px] opacity-75 font-normal">{reagent.badge}</span>
          </button>
        ))}
      </div>

      {/* Simulated Reaction Chamber */}
      <div className="auth-reaction-well">
        {isScanning && <div className="auth-laser-beam" />}
        <div
          className="auth-swatch-glow"
          style={{
            backgroundColor: active.colorHex,
            boxShadow: `0 0 25px 6px ${active.colorHex}66`,
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="m-0 text-sm font-bold text-foreground truncate">
              {active.target}
            </h4>
            <span className="font-mono text-[10px] font-semibold text-amber-400 shrink-0">
              {active.confidence}
            </span>
          </div>
          <p className="m-0 mt-0.5 text-xs text-muted-foreground truncate">
            {active.colorLabel} · {active.wavelength}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-foreground/75">
            <span className="rounded bg-background/70 px-1.5 py-0.5 border border-border/50">
              CIEDE2000 ΔE₀₀: {active.deltaE}
            </span>
            <span className="rounded bg-background/70 px-1.5 py-0.5 border border-border/50 truncate">
              {active.spec}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={handleScan}
        disabled={isScanning}
        className="auth-scan-btn"
      >
        <Zap size={14} className={isScanning ? "animate-spin text-amber-400" : "text-amber-500"} />
        <span>{isScanning ? "Simulating Optical Spectrometer Scan…" : "Test Optical Spot Reaction"}</span>
      </button>

      {/* Telemetry Footer */}
      <div className="auth-telemetry-row">
        <span>Sarvam 105B Indic AI</span>
        <span>SHA-256 Ledger Locked</span>
        <span>BSA 2023 § 63 Ready</span>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const [officerId, setOfficerId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [station, setStation] = useState("Delhi Zonal Unit");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const next = (["/", "/scan", "/audit"].includes(search.next) ? search.next : "/") as "/" | "/scan" | "/audit";

  useEffect(() => {
    // If officer is already authenticated, forward to destination
    const active = getActiveOfficer();
    if (active) {
      void navigate({ to: next, replace: true });
    }
  }, [navigate, next]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid official email address.");
      return;
    }
    // Allow simple passwords or numbers (e.g. 1234 or simple PIN)
    if (password.length < 4) {
      setError("Password must be at least 4 characters or numbers.");
      return;
    }

    if (mode === "signup") {
      if (fullName.trim().length < 2) {
        setError("Enter your full name and rank.");
        return;
      }
      if (officerId.trim().length < 3) {
        setError("Enter your officer ID (e.g. NCB-DEL-0142).");
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === "login") {
        const res = await signInOfficer({ email, password });
        if (!res.success) {
          setError(res.error || "Email or password is incorrect.");
          return;
        }
        void navigate({ to: next, replace: true });
      } else {
        const res = await signUpOfficer({
          fullName,
          officerId,
          station,
          email,
          password,
          autoSignIn: false,
        });
        if (!res.success) {
          setError(res.error || "Could not register officer account.");
          return;
        }
        // Switch to login tab and ask officer to sign in with password
        setNotice("Officer account created successfully! Please enter your password to sign in.");
        setMode("login");
        setPassword("");
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Authentication error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        {/* Left Section - Interactive NCB Forensic Lab Console */}
        <section className="auth-copy">
          <Link to="/" className="app-brand">
            <span className="app-brand-mark">
              <ShieldCheck size={20} />
            </span>
            <span>
              <span className="app-brand-name">DRUG-SHIELD AI</span>
              <span className="app-brand-sub">NARCOTICS CONTROL BUREAU</span>
            </span>
          </Link>

          <h1>
            Field evidence,
            <br />
            kept intact.
          </h1>
          <p>
            A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.
          </p>

          {/* Interactive Reagent Simulator Component */}
          <InteractiveReagentLab />
        </section>

        {/* Right Section - Sleek Officer Access Card */}
        <section className="auth-card" aria-label="Officer access">
          <h2>{mode === "login" ? "Welcome back" : "Create officer access"}</h2>
          <p>
            {mode === "login"
              ? "Continue to your field unit workspace."
              : "Register your officer credentials for field access."}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              data-active={mode === "login"}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              data-active={mode === "signup"}
              onClick={() => {
                setMode("signup");
                setError("");
                setNotice("");
              }}
            >
              Signup
            </button>
          </div>

          {notice && (
            <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400" role="status">
              {notice}
            </div>
          )}

          <form onSubmit={(e) => void submit(e)}>
            {mode === "signup" && (
              <>
                <div className="app-field">
                  <label htmlFor="full-name">Full name & rank</label>
                  <input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="e.g. Insp. Rajesh Kumar"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="app-field">
                  <label htmlFor="officer-id">Officer ID</label>
                  <input
                    id="officer-id"
                    value={officerId}
                    onChange={(event) => setOfficerId(event.target.value)}
                    placeholder="e.g. NCB-DEL-0142"
                    required
                  />
                </div>
                <div className="app-field">
                  <label htmlFor="station">Station / unit</label>
                  <select
                    id="station"
                    value={station}
                    onChange={(event) => setStation(event.target.value)}
                    className="rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="Delhi Zonal Unit">Delhi Zonal Unit</option>
                    <option value="Mumbai Zonal Unit">Mumbai Zonal Unit</option>
                    <option value="Kolkata Zonal Unit">Kolkata Zonal Unit</option>
                    <option value="Chennai Zonal Unit">Chennai Zonal Unit</option>
                    <option value="Bengaluru Zonal Unit">Bengaluru Zonal Unit</option>
                  </select>
                </div>
              </>
            )}

            <div className="app-field">
              <label htmlFor="email">Official email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@ncb.gov.in"
                autoComplete="email"
                required
              />
            </div>

            <div className="app-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password or PIN (min. 4 characters)"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            {error && (
              <p className="app-form-error mb-3" role="alert">
                {error}
              </p>
            )}

            <div className="app-form-actions">
              <Button type="submit" size="lg" disabled={busy} className="w-full">
                {busy ? "Please wait…" : mode === "login" ? "Enter workspace" : "Create officer account"}
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </form>

          <p className="auth-note">
            Direct field deployment mode · Instant access without email verification
          </p>
        </section>
      </div>
    </main>
  );
}
