import { useEffect, useRef, useState } from "react";
import { matchCommand } from "@/lib/forensics";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Bot, ChevronRight, CircleHelp, FlaskConical, Mic, MicOff, Send, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { initials, useOfficer } from "@/hooks/use-auth";

function ShieldMark() {
  return <span className="app-brand-mark" aria-hidden="true"><ShieldCheck size={22} strokeWidth={2.4} /></span>;
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const officer = useOfficer();
  const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); void navigate({ to: "/auth", search: { mode: "login", next: "/" }, replace: true }); };
  const active = location.pathname === "/" ? "dashboard" : location.pathname.startsWith("/scan") ? "scan" : location.pathname.startsWith("/audit") ? "audit" : "";
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand" aria-label="DRUG-SHIELD AI dashboard">
          <ShieldMark /><span><span className="app-brand-name">DRUG-SHIELD AI</span><span className="app-brand-sub">NARCOTICS CONTROL BUREAU</span></span>
        </Link>
        <nav className="app-nav" aria-label="Primary navigation">
          <Link to="/" data-status={active === "dashboard" ? "active" : undefined}>Dashboard</Link>
          <Link to="/scan" search={{ substance: undefined }} data-status={active === "scan" ? "active" : undefined}>Scan</Link>
          <Link to="/audit" data-status={active === "audit" ? "active" : undefined}>Audit logs</Link>
        </nav>
        <div className="app-header-spacer" />
        <div className="app-header-actions">
          {officer.signedIn ? <>
            <span className="app-sync" title="Connected to the shared evidence ledger"><span className="app-sync-dot" />Cloud ledger</span>
            <span className="app-profile"><span className="app-avatar">{initials(officer.displayName)}</span><span className="app-profile-copy"><strong>{officer.displayName}</strong><span>{officer.profile?.officer_id || "Officer"}{officer.profile?.station ? ` · ${officer.profile.station}` : ""}</span></span></span>
            <Button type="button" size="sm" variant="outline" onClick={() => void signOut()} aria-label="Log out"><LogOut />Logout</Button>
          </> : officer.ready ? <Button asChild size="sm" className="app-login-button"><Link to="/auth" search={{ mode: "login", next: "/" }}>Login / Signup</Link></Button> : null}
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return <footer className="app-footer"><span>Government of India · NCB · Field Forensic Unit</span><span className="app-disclaimer">Presumptive field test. Not a substitute for laboratory confirmation.</span></footer>;
}

type SpeechRec = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };

function localReply(text: string): string {
  const t = text.toLowerCase();
  if (/sop|procedure|steps|how/.test(t)) return "Field sequence: Case → Reagents → Photo → Result. Keep the reference card in frame and seal the original image before analysis.";
  if (/result|positive|negative|unclear|mean/.test(t)) return "A presumptive result is a screening signal only. Preserve the evidence and send it for laboratory confirmation. I cannot give legal conclusions.";
  if (/light|glare|dark/.test(t)) return "Use even, diffuse light. Avoid direct sunlight or flash glare on the wells; retake if the colours look washed out.";
  if (/hash|seal|tamper|custody/.test(t)) return "Every new record hashes the original photo bytes (SHA-256) and links custody events. Open a record and press Verify custody chain to check for tampering.";
  return "I'm running in offline guidance mode. Try: \"What is the SOP?\", \"go to audit\", \"new test\", \"capture\", or \"next\".";
}

export function PrahariWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([{ role: "assistant", text: "Hello, Officer. Ask about the SOP or say a command like \"new test\" or \"capture\"." }]);
  const recRef = useRef<SpeechRec | null>(null);
  const reply = (text: string) => {
    setMessages((m) => [...m, { role: "assistant", text }]);
    if (speak && "speechSynthesis" in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; window.speechSynthesis.speak(u); }
  };
  const handle = (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    const cmd = matchCommand(text);
    if (cmd?.type === "NAVIGATE") {
      if (cmd.to === "audit") void navigate({ to: "/audit" }); else if (cmd.to === "scan") void navigate({ to: "/scan", search: { substance: undefined } }); else void navigate({ to: "/" });
      reply(`Opening ${cmd.to === "home" ? "the dashboard" : cmd.to === "scan" ? "a new field test" : "audit logs"}.`);
    } else if (cmd && cmd.type !== "READ_RESULT") {
      window.dispatchEvent(new CustomEvent("prahari-command", { detail: cmd.type }));
      reply(cmd.type === "CAPTURE" ? "Capturing — the camera must be live on the Photo step." : cmd.type === "NEXT_STEP" ? "Moving to the next step." : "Going back a step.");
    } else reply(localReply(text));
  };
  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) { reply("Voice input isn't available in this browser. Please type instead."); return; }
    const rec = new Ctor(); rec.lang = lang; rec.interimResults = false;
    rec.onresult = (e) => { const t = e.results[0]?.[0]?.transcript ?? ""; handle(t); };
    rec.onerror = () => { setListening(false); reply("Microphone unavailable — please type your question."); };
    rec.onend = () => setListening(false);
    recRef.current = rec; setListening(true); rec.start();
  };
  useEffect(() => () => { recRef.current?.stop(); if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  return <div className="app-floating print:hidden">
    {open && <section className="app-card app-ai-panel" aria-label="Prahari AI assistant">
      <div className="app-ai-head"><div><strong>Prahari AI</strong><span> · Field guidance</span></div><Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setOpen(false)} aria-label="Close Prahari AI"><X /></Button></div>
      <div className="app-ai-body">
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto" aria-live="polite">{messages.slice(-8).map((m, i) => <div key={i} className={m.role === "assistant" ? "app-ai-message" : "self-end rounded-lg bg-muted px-3.5 py-2 text-sm"}>{m.text}</div>)}</div>
        <div className="app-ai-actions">{["What is the SOP?", "Explain a result", "Go to audit"].map((q) => <button key={q} type="button" onClick={() => handle(q)}>{q}</button>)}</div>
        <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); handle(input); setInput(""); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === "hi-IN" ? "सवाल लिखें…" : "Ask or give a command…"} aria-label="Message Prahari" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm" maxLength={500} />
          <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak"}>{listening ? <MicOff /> : <Mic />}</Button>
          <Button type="submit" size="icon" aria-label="Send"><Send /></Button>
        </form>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <button type="button" onClick={() => setLang((l) => (l === "en-IN" ? "hi-IN" : "en-IN"))}>Language: {lang === "en-IN" ? "English" : "हिन्दी"}</button>
          <button type="button" onClick={() => setSpeak((s) => !s)} className="inline-flex items-center gap-1">{speak ? <Volume2 size={14} /> : <VolumeX size={14} />}Read aloud</button>
        </div>
      </div>
    </section>}
    <Button type="button" size="lg" className="rounded-full shadow-lg" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open Prahari AI"><Bot />{open ? "Close" : "Prahari AI"}</Button>
  </div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuth = location.pathname === "/auth";
  useEffect(() => { document.title = isAuth ? "Officer access · DRUG-SHIELD AI" : "DRUG-SHIELD AI · NCB Field Forensics"; }, [isAuth]);
  if (isAuth) return <>{children}</>;
  return <div className="app-page"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded bg-background px-3 py-2 text-sm">Skip to content</a><AppHeader /><main id="main" className="app-main">{children}</main><AppFooter /><PrahariWidget /></div>;
}

export function PageBack({ to = "/" }: { to?: "/" | "/scan" | "/audit" }) { return <Link to={to} className="app-link inline-flex items-center gap-1"><ChevronRight size={15} className="rotate-180" />Back</Link>; }

export function SectionIcon({ type }: { type: string }) {
  const Icon = type === "leaf" ? FlaskConical : type === "snowflake" ? CircleHelp : type === "syringe" ? ShieldCheck : type === "pill" ? FlaskConical : FlaskConical;
  return <Icon size={20} />;
}
