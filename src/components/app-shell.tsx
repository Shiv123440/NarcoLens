import { useEffect, useRef, useState } from "react";
import { matchCommand } from "@/lib/forensics";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  Bot,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  FlaskConical,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Volume2,
  VolumeX,
  X,
  Loader2,
  KeyRound,
  User,
  UserCog,
  History,
  CheckCircle2,
  Bell,
  LayoutDashboard,
  FileText,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { initials, useOfficer } from "@/hooks/use-auth";
import { signOutOfficer } from "@/lib/auth-service";
import {
  chatWithPrahari,
  synthesizeSpeechWithSarvam,
  SUPPORTED_LANGUAGES,
  DEFAULT_SARVAM_KEY,
  type IndicLanguageCode,
  type ChatMessage,
} from "@/lib/sarvam";

function ShieldMark() {
  return <span className="app-brand-mark" aria-hidden="true"><ShieldCheck size={20} strokeWidth={2.4} /></span>;
}

export function openPrahariAI() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-prahari"));
  }
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const officer = useOfficer();
  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutOfficer();
    void navigate({ to: "/auth", search: { mode: "login", next: "/" }, replace: true });
  };
  const active =
    location.pathname === "/"
      ? "dashboard"
      : location.pathname.startsWith("/scan")
      ? "scan"
      : location.pathname.startsWith("/audit")
      ? "audit"
      : location.pathname.startsWith("/profile")
      ? "profile"
      : "";

  const avatarUrl = officer.profile?.avatar_url;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand" aria-label="DRUG-SHIELD AI dashboard">
          <ShieldMark />
          <span>
            <span className="app-brand-name">DRUG-SHIELD AI</span>
            <span className="app-brand-sub">NARCOTICS CONTROL BUREAU</span>
          </span>
        </Link>
        <nav className="app-nav" aria-label="Primary navigation">
          <Link to="/" className="app-nav-pill" data-status={active === "dashboard" ? "active" : undefined}>
            <LayoutDashboard size={14} className="shrink-0" />
            <span>Dashboard</span>
          </Link>
          <Link to="/scan" search={{ substance: undefined }} className="app-nav-pill" data-status={active === "scan" ? "active" : undefined}>
            <ScanLine size={14} className="shrink-0" />
            <span>Scan</span>
          </Link>
          <Link to="/audit" className="app-nav-pill" data-status={active === "audit" ? "active" : undefined}>
            <FileText size={14} className="shrink-0" />
            <span>Audit logs</span>
          </Link>
        </nav>
        <div className="app-header-spacer" />
        <div className="app-header-actions">
          {officer.signedIn ? (
            <>
              <span className="app-sync" title="Connected to the shared evidence ledger">
                <span className="app-sync-dot" />Cloud ledger
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="app-profile app-profile-clickable"
                    aria-label="Operator Profile Menu"
                  >
                    <span className="app-avatar">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={officer.displayName}
                          className="app-avatar-img"
                        />
                      ) : (
                        initials(officer.displayName)
                      )}
                    </span>
                    <span className="app-profile-copy">
                      <strong>{officer.displayName.toLowerCase()}</strong>
                      <span>
                        {officer.profile?.officer_id || "7864555"} · {officer.profile?.station || "Delhi Zonal Unit"}
                      </span>
                    </span>
                    <ChevronDown size={13} className="app-profile-chevron" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="app-profile-dropdown w-64 p-2 bg-[#0F1626] text-[#F5F7FA] border-white/10 shadow-2xl z-50"
                >
                  <div className="px-3 py-2.5 bg-white/5 rounded-md mb-1.5 flex items-center gap-3">
                    <span className="app-avatar ring-1 ring-[#E85D04]/60">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={officer.displayName}
                          className="app-avatar-img"
                        />
                      ) : (
                        initials(officer.displayName)
                      )}
                    </span>
                    <div className="min-w-0 flex-1 leading-snug">
                      <div className="font-bold text-xs truncate text-white">{officer.displayName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono truncate">
                        ID: {officer.profile?.officer_id || "7864555"}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[9px] text-[#22c55e] font-semibold mt-0.5">
                        <CheckCircle2 size={10} /> VERIFIED OPERATOR
                      </div>
                    </div>
                  </div>

                  <DropdownMenuItem asChild className="focus:bg-[#E85D04]/20 focus:text-white cursor-pointer py-2 text-xs">
                    <Link to={"/profile" as any}>
                      <User className="h-3.5 w-3.5 mr-2 text-[#E85D04]" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="focus:bg-[#E85D04]/20 focus:text-white cursor-pointer py-2 text-xs">
                    <Link to={"/profile" as any} search={{ edit: true } as any}>
                      <UserCog className="h-3.5 w-3.5 mr-2 text-[#E85D04]" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="focus:bg-[#E85D04]/20 focus:text-white cursor-pointer py-2 text-xs">
                    <Link to={"/profile" as any} hash="security">
                      <KeyRound className="h-3.5 w-3.5 mr-2 text-[#E85D04]" />
                      Security
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="focus:bg-[#E85D04]/20 focus:text-white cursor-pointer py-2 text-xs">
                    <Link to={"/profile" as any} hash="activity">
                      <History className="h-3.5 w-3.5 mr-2 text-[#E85D04]" />
                      My Activity
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10 my-1" />

                  <DropdownMenuItem
                    onClick={() => void signOut()}
                    className="focus:bg-red-500/20 text-red-400 focus:text-red-300 cursor-pointer py-2 text-xs"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2 text-red-400" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notification Bell with Badge */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="app-header-icon-btn"
                    aria-label="1 unread notification"
                    title="Notifications"
                  >
                    <Bell size={15} />
                    <span className="app-header-badge">1</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 p-3 bg-white text-slate-800 border border-slate-200 shadow-xl rounded-xl z-50"
                >
                  <div className="font-bold text-xs text-slate-900 mb-2 flex items-center justify-between">
                    <span>Notifications</span>
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">1 new</span>
                  </div>
                  <div className="p-2.5 bg-orange-50/70 border border-orange-100 rounded-lg text-xs leading-relaxed text-slate-700">
                    <div className="font-semibold text-slate-800 text-[11px] mb-0.5">NCB Kit Calibration Notice</div>
                    Standard reference batch calibrated for Marquis, Scott, and Duquenois-Levine field tests.
                    <div className="text-[10px] text-slate-400 mt-1">10m ago · Delhi Zonal Unit</div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => void signOut()}
                className="app-header-logout-btn"
                aria-label="Log out"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </>
          ) : officer.ready ? (
            <Button asChild size="sm" className="app-login-button">
              <Link to="/auth" search={{ mode: "login", next: "/" }}>Login / Signup</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer-modern">
      <div className="app-footer-role">
        Role - NCB - Field Forensic Unit
      </div>
      <div className="app-footer-disclaimer">
        Presumptive field test. Not a substitute for laboratory confirmation.
      </div>
      <button
        type="button"
        onClick={() => openPrahariAI()}
        className="app-footer-prahari-btn"
        aria-label="Launch Prahari AI"
      >
        <ShieldCheck size={14} className="text-white fill-[#E85D04]" />
        <span>Prahari AI</span>
      </button>
    </footer>
  );
}

type SpeechRec = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };

export function PrahariWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-prahari", handler);
    return () => window.removeEventListener("open-prahari", handler);
  }, []);
  const [lang, setLang] = useState<IndicLanguageCode>("en-IN");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("sarvam_api_key") || DEFAULT_SARVAM_KEY : DEFAULT_SARVAM_KEY));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Jai Hind, Officer. I am Prahari AI, powered by Sarvam AI. Ask about the NDPS SOP, reagent validation, or speak a voice command like \"new test\" or \"capture\"." },
  ]);
  const recRef = useRef<SpeechRec | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (typeof window !== "undefined") {
      if (key.trim()) {
        localStorage.setItem("sarvam_api_key", key.trim());
      } else {
        localStorage.removeItem("sarvam_api_key");
      }
    }
  };

  const playVoiceResponse = async (text: string) => {
    if (!speak) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audioUrl = await synthesizeSpeechWithSarvam(text, lang, apiKey);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        await audio.play();
        return;
      }
    } catch {
      // Fallback to browser SpeechSynthesis
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    }
  };

  const reply = (text: string) => {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
    void playVoiceResponse(text);
  };

  const handle = async (raw: string) => {
    const text = raw.trim().slice(0, 500);
    if (!text) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);

    const cmd = matchCommand(text);
    if (cmd?.type === "NAVIGATE") {
      if (cmd.to === "audit") void navigate({ to: "/audit" });
      else if (cmd.to === "scan") void navigate({ to: "/scan", search: { substance: undefined } });
      else void navigate({ to: "/" });
      reply(`Opening ${cmd.to === "home" ? "the dashboard" : cmd.to === "scan" ? "a new field test" : "audit logs"}.`);
      return;
    } else if (cmd && cmd.type !== "READ_RESULT") {
      window.dispatchEvent(new CustomEvent("prahari-command", { detail: cmd.type }));
      reply(cmd.type === "CAPTURE" ? "Capturing evidence photo — camera active on Step 3." : cmd.type === "NEXT_STEP" ? "Advancing to the next step." : "Returning to previous step.");
      return;
    }

    // Call Sarvam AI chatbot with prompt engineering and offline fallback
    setLoading(true);
    try {
      const response = await chatWithPrahari(text, messages, lang, apiKey);
      const replyText = typeof response === "string" ? response : response.reply;
      reply(replyText);
    } catch {
      reply("Officer, I am currently relying on offline forensic instructions. Case sequence: Case ID → Reagents → Photo → CIEDE2000 verification.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      reply("Voice input isn't available in this browser. Please type your query.");
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t) void handle(t);
    };
    rec.onerror = () => {
      setListening(false);
      reply("Microphone input timed out — please type your question.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => () => {
    recRef.current?.stop();
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="app-floating print:hidden">
      {open && (
        <section className="app-card app-ai-panel shadow-2xl" aria-label="Prahari AI assistant">
          <div className="app-ai-head flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-primary-foreground" />
              <div>
                <strong>Prahari AI</strong>
                <span className="text-xs opacity-80"> · Sarvam 105B Forensics</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setShowKeyInput((v) => !v)}
                title="Configure Sarvam AI API Key"
              >
                <KeyRound size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setOpen(false)}
                aria-label="Close Prahari AI"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {showKeyInput && (
            <div className="p-2.5 bg-muted/60 border-b border-border text-xs flex flex-col gap-1.5">
              <label htmlFor="sarvam-key-input" className="font-semibold text-[.7rem] text-muted-foreground">
                Sarvam AI API Key (Optional / Direct access):
              </label>
              <div className="flex gap-1.5">
                <input
                  id="sarvam-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => saveApiKey(e.target.value)}
                  placeholder="Enter Sarvam API key or leave blank for server/offline fallback"
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-[.7rem]"
                />
                <Button size="sm" variant="secondary" onClick={() => setShowKeyInput(false)} className="text-[.7rem] h-7 px-2">
                  Done
                </Button>
              </div>
            </div>
          )}

          <div className="app-ai-body">
            <div className="flex max-h-56 flex-col gap-2 overflow-y-auto" aria-live="polite">
              {messages.slice(-8).map((m, i) => (
                <div
                  key={i}
                  className={m.role === "assistant" ? "app-ai-message" : "self-end rounded-lg bg-muted px-3 py-2 text-xs"}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="app-ai-message flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Prahari is consulting Sarvam 105B…</span>
                </div>
              )}
            </div>

            <div className="app-ai-actions">
              {["What is the NDPS SOP?", "Section 63 BSA compliance", "Explain ΔE*00 reading", "New test"].map((q) => (
                <button key={q} type="button" onClick={() => void handle(q)}>
                  {q}
                </button>
              ))}
            </div>

            <form
              className="mt-2 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                void handle(input);
                setInput("");
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === "hi-IN" ? "एनडीपीएस सवाल या आदेश लिखें…" : "Ask NDPS question or speak command…"}
                aria-label="Message Prahari"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                maxLength={500}
                disabled={loading}
              />
              <Button
                type="button"
                size="icon"
                variant={listening ? "default" : "outline"}
                onClick={toggleMic}
                aria-label={listening ? "Stop listening" : "Speak"}
              >
                {listening ? <MicOff /> : <Mic />}
              </Button>
              <Button type="submit" size="icon" aria-label="Send" disabled={loading || !input.trim()}>
                <Send />
              </Button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[.65rem] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>Lang:</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as IndicLanguageCode)}
                  className="rounded border border-input bg-background px-1 py-0.5 text-[.65rem]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setSpeak((s) => !s)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {speak ? <Volume2 size={12} className="text-primary" /> : <VolumeX size={12} />}
                Bulbul TTS: {speak ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </section>
      )}
      <Button
        type="button"
        size="lg"
        className="rounded-full shadow-lg"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Open Prahari AI"
      >
        <Bot />
        {open ? "Close" : "Prahari AI"}
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuth = location.pathname === "/auth";
  useEffect(() => { document.title = isAuth ? "Officer access · DRUG-SHIELD AI" : "DRUG-SHIELD AI · NCB Field Forensics"; }, [isAuth]);
  if (isAuth) return <>{children}</>;
  return <div className="app-page"><a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded bg-background px-3 py-2 text-sm">Skip to content</a><AppHeader /><main id="main" className="app-main">{children}</main><AppFooter /><PrahariWidget /></div>;
}

export function PageBack({ to = "/" }: { to?: "/" | "/scan" | "/audit" }) { return <Link to={to} className="app-link inline-flex items-center gap-1"><ChevronRight size={13} className="rotate-180" />Back</Link>; }

export function SectionIcon({ type }: { type: string }) {
  const Icon = type === "leaf" ? FlaskConical : type === "snowflake" ? CircleHelp : type === "syringe" ? ShieldCheck : type === "pill" ? FlaskConical : FlaskConical;
  return <Icon size={18} />;
}
