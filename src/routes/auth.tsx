import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, CheckCircle2, Lock, Scale, Sparkles } from "lucide-react";
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

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid official email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
        });
        if (!res.success) {
          setError(res.error || "Could not register officer account.");
          return;
        }
        // Direct seamless access - no email verification blocker!
        void navigate({ to: next, replace: true });
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
        {/* Left Section - Clean NCB Forensic Branding (No Lamp) */}
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

          <div className="mt-8 flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5 text-foreground/80">
              <Scale size={16} className="text-primary flex-shrink-0" />
              <span>Section 63 BSA 2023 / Section 52A NDPS digital evidence certificate</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground/80">
              <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
              <span>ISO/CIE 11664-6:2014 CIEDE2000 (ΔE*00) spectral spot calibration</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground/80">
              <Sparkles size={16} className="text-primary flex-shrink-0" />
              <span>Sarvam 105B multilingual Indic forensic copilot (8 languages)</span>
            </div>
            <div className="flex items-center gap-2.5 text-foreground/80">
              <Lock size={16} className="text-primary flex-shrink-0" />
              <span>SHA-256 hashed tamper-evident ledger with offline local persistence</span>
            </div>
          </div>
        </section>

        {/* Right Section - Sleek Officer Access Card */}
        <section className="auth-card" aria-label="Officer access">
          <h2>{mode === "login" ? "Welcome back" : "Create officer access"}</h2>
          <p>
            {mode === "login"
              ? "Continue to your field unit workspace."
              : "Register your officer credentials for immediate field access."}
          </p>

          <div className="auth-tabs">
            <button type="button" data-active={mode === "login"} onClick={() => setMode("login")}>
              Login
            </button>
            <button type="button" data-active={mode === "signup"} onClick={() => setMode("signup")}>
              Signup
            </button>
          </div>

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
                placeholder="Minimum 6 characters"
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
