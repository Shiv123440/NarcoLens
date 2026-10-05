import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ mode: search["mode"] === "signup" ? ("signup" as const) : ("login" as const), next: typeof search["next"] === "string" ? search["next"] : "/" }),
  head: () => ({ meta: [
    { title: "Officer access · DRUG-SHIELD AI" },
    { name: "description", content: "Sign in to the DRUG-SHIELD AI NCB field forensics workspace." },
    { property: "og:title", content: "Officer access · DRUG-SHIELD AI" },
    { property: "og:description", content: "Sign in to the DRUG-SHIELD AI NCB field forensics workspace." },
  ] }),
  component: AuthPage,
});

function Lamp({ state, onPull }: { state: number; onPull: () => void }) {
  return <div className="auth-lamp-wrap"><svg className="auth-lamp" data-state={state} viewBox="0 0 300 450" role="img" aria-label="Interactive lamp. Pull the string to change its state.">
    <defs><linearGradient id="authCone" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="currentColor" stopOpacity=".45" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient><clipPath id="authMouth"><path d="M125 155 Q150 190 175 155Z" /></clipPath></defs>
    <polygon points="90,180 210,180 320,450 -20,450" fill="url(#authCone)" className="lamp-cone" opacity="0" />
    <ellipse cx="150" cy="400" rx="60" ry="15" fill="oklch(.07 .01 255)" /><ellipse cx="150" cy="395" rx="60" ry="15" fill="oklch(.28 .02 255)" />
    <rect x="140" y="180" width="20" height="220" fill="oklch(.2 .02 255)" /><rect x="142" y="180" width="8" height="220" fill="oklch(.35 .02 255)" />
    <ellipse cx="150" cy="175" rx="90" ry="20" className="lamp-inner" fill="oklch(.1 .01 255)" />
    <g className="auth-pull" onClick={onPull} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onPull(); } }} tabIndex={0} role="button" aria-label="Pull lamp string"><line x1="105" y1="180" x2="105" y2="280" stroke="oklch(.42 .02 255)" strokeWidth="3" /><line x1="105" y1="280" x2="105" y2="310" stroke="oklch(.58 .02 255)" strokeWidth="6" strokeLinecap="round" /></g>
    <path d="M95 60 Q150 45 205 60 L240 175 Q150 195 60 175Z" className="lamp-shade" fill="oklch(.2 .02 255)" />
    <g className="lamp-face-sleep" opacity="1"><path d="M115 130 Q125 140 135 130" stroke="oklch(.07 .01 255)" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M165 130 Q175 140 185 130" stroke="oklch(.07 .01 255)" strokeWidth="4" fill="none" strokeLinecap="round" /></g>
    <g className="lamp-face-awake" opacity="0"><path d="M115 130 Q125 115 135 130" stroke="oklch(.07 .01 255)" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M165 130 Q175 115 185 130" stroke="oklch(.07 .01 255)" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M125 155 Q150 190 175 155Z" fill="oklch(.07 .01 255)" /><path d="M140 165 Q150 190 160 165Z" fill="oklch(.7 .18 28)" clipPath="url(#authMouth)" /></g>
  </svg><p className="auth-state">{state === 0 ? "NIGHT MODE" : state === 1 ? "NCB GREEN" : state === 2 ? "SIGNAL CYAN" : "FIELD AMBER"}</p></div>;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"login" | "signup">(search.mode);
  const [lampState, setLampState] = useState(0);
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");
  const [station, setStation] = useState("Delhi Zonal Unit");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (officerId.trim().length < 3 || password.length < 4) { setError("Enter an officer ID and a password with at least 4 characters."); return; } setError(""); void navigate({ to: search.next as "/" | "/scan" | "/audit" }); };
  return <main className="auth-page"><div className="auth-layout"><section className="auth-copy"><Link to="/" className="app-brand"><span className="app-brand-mark"><ShieldCheck size={20} /></span><span><span className="app-brand-name">DRUG-SHIELD AI</span><span className="app-brand-sub">NARCOTICS CONTROL BUREAU</span></span></Link><h1>Field evidence,<br />kept intact.</h1><p>A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.</p><Lamp state={lampState} onPull={() => setLampState((value) => (value + 1) % 4)} /></section><section className="auth-card" aria-label="Officer access"><h2>{mode === "login" ? "Welcome back" : "Create officer access"}</h2><p>{mode === "login" ? "Continue to your field unit workspace." : "Set up a local demo profile for this preview."}</p><div className="auth-tabs"><button type="button" data-active={mode === "login"} onClick={() => setMode("login")}>Login</button><button type="button" data-active={mode === "signup"} onClick={() => setMode("signup")}>Signup</button></div><form onSubmit={submit}><div className="app-field"><label htmlFor="officer-id">Officer ID</label><input id="officer-id" value={officerId} onChange={(event) => setOfficerId(event.target.value)} placeholder="e.g. NCB-DEL-0142" autoComplete="username" /></div><div className="app-field"><label htmlFor="station">Station / unit</label><select id="station" value={station} onChange={(event) => setStation(event.target.value)}><option>Delhi Zonal Unit</option><option>Mumbai Zonal Unit</option><option>Kolkata Zonal Unit</option></select></div><div className="app-field"><label htmlFor="password">Passcode</label><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter passcode" autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>{error && <p className="app-form-error" role="alert">{error}</p>}<div className="app-form-actions"><Button type="submit" size="lg">{mode === "login" ? "Enter workspace" : "Create local profile"}<ArrowRight /></Button></div></form><p className="auth-note">DEV PREVIEW · local access only · no credentials are stored remotely</p></section></div></main>;
}
