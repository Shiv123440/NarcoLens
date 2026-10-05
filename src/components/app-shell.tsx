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
  Menu,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProfileModal } from "@/components/profile-window";
import { AuroraBackground } from "@/components/ui/aurora-background";
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
  return (
    <span className="app-brand-mark" aria-hidden="true">
      <img src="/narcolens-logo.png" alt="" className="app-brand-logo-img" />
    </span>
  );
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const officer = useOfficer();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        {/* Brand identity */}
        <Link to="/" className="app-brand" aria-label="NarcoLens dashboard">
          <ShieldMark />
          <span>
            <span className="app-brand-name">NarcoLens</span>
            <span className="app-brand-sub">NARCOTICS CONTROL BUREAU</span>
          </span>
        </Link>

        {/* Hero-34 Announcement / Status Badge */}
        <div className="hero-nav-announcement hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-[10px]">NEW TEST · FIELD READY</span>
          <span className="opacity-40">|</span>
          <span className="text-muted-foreground font-mono">v2.4 Live Ledger</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="app-nav" aria-label="Primary navigation">
          <Link to="/" data-status={active === "dashboard" ? "active" : undefined}>Dashboard</Link>
          <Link to="/scan" search={{ substance: undefined }} data-status={active === "scan" ? "active" : undefined}>Scan</Link>
          <Link to="/audit" data-status={active === "audit" ? "active" : undefined}>Audit logs</Link>
        </nav>

        <div className="app-header-spacer" />

        {/* Desktop & Tablet Actions */}
        <div className="app-header-actions">
          {officer.signedIn ? (
            <>
              <span className="app-sync hidden sm:inline-flex" title="Connected to the shared evidence ledger">
                <span className="app-sync-dot" />Cloud ledger
              </span>

              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="app-profile app-profile-clickable cursor-pointer hover:border-amber-400/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:scale-98 transition-all"
                aria-label="Open Officer Profile Window"
              >
                <span className="app-avatar bg-[#FCE8D5] text-[#7C2D12] font-bold">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={officer.displayName}
                      className="app-avatar-img"
                    />
                  ) : (
                    initials(officer.displayName || "Insp. Rajesh Kumar")
                  )}
                </span>
                <span className="app-profile-copy">
                  <strong>{officer.displayName || "Insp. Rajesh Kumar"}</strong>
                  <span>
                    {officer.profile?.badge_id || officer.profile?.officer_id || "NCB-DEL-4082"}
                    {officer.profile?.station ? ` · ${officer.profile.station}` : " · Delhi Zonal Unit"}
                  </span>
                </span>
                <ChevronDown size={13} className="app-profile-chevron text-zinc-500" />
              </button>

              <ProfileModal
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void signOut()}
                aria-label="Log out"
                className="hidden md:inline-flex"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />Logout
              </Button>
            </>
          ) : officer.ready ? (
            <Button asChild size="sm" className="app-login-button bg-[#FF8A1D] hover:bg-[#FF901F] text-black font-semibold shadow-md shadow-orange-500/20">
              <Link to="/auth" search={{ mode: "login", next: "/" }}>
                Login / Signup <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          ) : null}

          {/* Mobile Menu Sheet */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label="Open mobile navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="text-left mb-6">
                    <div className="flex items-center gap-2.5">
                      <ShieldMark />
                      <div>
                        <SheetTitle className="text-base font-bold font-sans">NarcoLens</SheetTitle>
                        <p className="text-xs text-muted-foreground font-mono">NARCOTICS CONTROL BUREAU</p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex flex-col gap-1.5 mb-6">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1 font-mono">Navigation</div>
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active === "dashboard" ? "bg-amber-500/10 text-amber-500 font-semibold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      Dashboard
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                    <Link
                      to="/scan"
                      search={{ substance: undefined }}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active === "scan" ? "bg-amber-500/10 text-amber-500 font-semibold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      Field Scan Test
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                    <Link
                      to="/audit"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active === "audit" ? "bg-amber-500/10 text-amber-500 font-semibold" : "hover:bg-muted text-foreground"
                      )}
                    >
                      Audit Ledger
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  </div>

                  {officer.signedIn && (
                    <div className="border-t border-border pt-4 mb-4">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 font-mono">Officer Profile</div>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted cursor-pointer transition-colors text-left"
                      >
                        <span className="app-avatar bg-[#FCE8D5] text-[#7C2D12] font-bold">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={officer.displayName} className="app-avatar-img" />
                          ) : (
                            initials(officer.displayName || "Insp. Rajesh Kumar")
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{officer.displayName || "Insp. Rajesh Kumar"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {officer.profile?.badge_id || officer.profile?.officer_id || "NCB-DEL-4082"} · {officer.profile?.station || "Delhi Unit"}
                          </p>
                        </div>
                        <User className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Cloud ledger synced
                    </span>
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono">v2.4</span>
                  </div>

                  {officer.signedIn ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void signOut();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-[#FF8A1D] hover:bg-[#FF901F] text-black font-semibold">
                      <Link
                        to="/auth"
                        search={{ mode: "login", next: "/" }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Officer Login <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return <footer className="app-footer"><span>Government of India · NCB · Field Forensic Unit</span><span className="app-disclaimer">Presumptive field test. Not a substitute for laboratory confirmation.</span></footer>;
}

type SpeechRec = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };

export function PrahariWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
  useEffect(() => { document.title = isAuth ? "Officer access · NarcoLens" : "NarcoLens · Narcotics Control Bureau"; }, [isAuth]);
  if (isAuth) return <>{children}</>;
  return (
    <div className="app-page">
      <div className="app-aurora-bg" aria-hidden="true">
        <AuroraBackground
          className="!h-full !min-h-screen !w-full !p-0 !bg-transparent dark:!bg-transparent"
          showRadialGradient={true}
        />
      </div>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded bg-background px-3 py-2 text-sm">Skip to content</a>
      <AppHeader />
      <main id="main" className="app-main">{children}</main>
      <AppFooter />
      <PrahariWidget />
    </div>
  );
}

export function PageBack({ to = "/" }: { to?: "/" | "/scan" | "/audit" }) { return <Link to={to} className="app-link inline-flex items-center gap-1"><ChevronRight size={13} className="rotate-180" />Back</Link>; }

export function SectionIcon({ type }: { type: string }) {
  const Icon = type === "leaf" ? FlaskConical : type === "snowflake" ? CircleHelp : type === "syringe" ? ShieldCheck : type === "pill" ? FlaskConical : FlaskConical;
  return <Icon size={18} />;
}
