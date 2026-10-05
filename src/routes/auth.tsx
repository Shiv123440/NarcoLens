import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { signUpOfficer, signInOfficer, getActiveOfficer, validatePassword } from "@/lib/auth-service";

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

const SPRING = {
  mass: 0.1, // Responsive spring inertia
  damping: 10, // Fluid, realistic damping
  stiffness: 131, // Snappy recovery
};

function SpringMouseFollow({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, SPRING);
  const ySpring = useSpring(y, SPRING);
  const opacity = useMotionValue(0);
  const opacitySpring = useSpring(opacity, SPRING);
  const scale = useMotionValue(0);
  const scaleSpring = useSpring(scale, SPRING);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handlePointerMove = (e: PointerEvent) => {
      const bounds = el.getBoundingClientRect();
      x.set(e.clientX - bounds.left);
      y.set(e.clientY - bounds.top);
    };

    const handlePointerEnter = () => {
      opacity.set(1);
      scale.set(1);
    };

    const handlePointerLeave = () => {
      opacity.set(0);
      scale.set(0);
    };

    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerenter", handlePointerEnter);
    el.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerenter", handlePointerEnter);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [containerRef, x, y, opacity, scale]);

  return (
    <motion.div
      style={{
        x: xSpring,
        y: ySpring,
        opacity: opacitySpring,
        scale: scaleSpring,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="pointer-events-none absolute z-10 h-72 w-72 rounded-full bg-gradient-to-r from-[#E85D04]/22 via-[#F05A0A]/14 to-transparent blur-3xl"
    />
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [isSignUp, setIsSignUp] = useState(search.mode === "signup");
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup form state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");

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

  // Real-time password requirement checkers
  const hasMinLength = signupPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(signupPassword);
  const hasLowercase = /[a-z]/.test(signupPassword);
  const hasNumber = /[0-9]/.test(signupPassword);

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");

    if (!loginIdentifier.trim()) {
      setLoginError("Enter your username or email address.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Enter your password.");
      return;
    }

    setBusy(true);
    try {
      const res = await signInOfficer({
        email: loginIdentifier.trim(),
        password: loginPassword,
      });

      if (!res.success) {
        setLoginError(res.error || "Username/email or password is incorrect.");
        return;
      }

      void navigate({ to: next, replace: true });
    } catch (err: unknown) {
      setLoginError((err as Error)?.message || "Authentication error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSignupError("");

    if (signupUsername.trim().length < 2) {
      setSignupError("Enter your full name or officer username.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(signupEmail.trim())) {
      setSignupError("Enter a valid email address (e.g. gmail or official ID).");
      return;
    }

    const pwValidation = validatePassword(signupPassword);
    if (!pwValidation.valid) {
      setSignupError(pwValidation.error || "Password must be at least 8 characters with 1 uppercase and 1 number.");
      return;
    }

    setBusy(true);
    try {
      const res = await signUpOfficer({
        fullName: signupUsername.trim(),
        officerId: signupUsername.trim(),
        station: "Delhi Zonal Unit",
        email: signupEmail.trim(),
        password: signupPassword,
        autoSignIn: false,
      });

      if (!res.success) {
        setSignupError(res.error || "Could not register officer account.");
        return;
      }

      // Smoothly transition to Login side
      setIsSignUp(false);
      setLoginIdentifier(signupEmail.trim());
      setLoginPassword("");
      setNotice("Account registered successfully! Please enter your password to sign in.");
      setSignupError("");
    } catch (err: unknown) {
      setSignupError((err as Error)?.message || "Registration error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-forensic-viewport">
      {/* Background Layer: Forensic Laboratory Ambient Graphics */}
      <div className="auth-forensic-bg" aria-hidden="true">
        {/* Left Side: Narcotics Control Bureau Field Evidence HUD */}
        <div className="auth-hud-left">
          <div className="auth-hud-kicker">
            <span>NARCOTICS</span>
            <span>CONTROL</span>
            <span>BUREAU</span>
          </div>
          <div className="auth-hud-divider" />
          <div className="auth-hud-tags">
            <span>ANALYSE</span>
            <span>DETECT</span>
            <span>SECURE</span>
            <span>VERIFY</span>
          </div>

          {/* Evidence Bag Illustration */}
          <div className="auth-evidence-pouch">
            <div className="auth-pouch-badge">
              <span className="auth-pouch-title">EVIDENCE</span>
              <div className="auth-pouch-qr" />
            </div>
            <div className="auth-pouch-barcodes" />
            <div className="auth-pouch-id">NCB-SZ-2026-8841</div>
          </div>
        </div>

        {/* Right Side: Biometric Fingerprint Analysis HUD */}
        <div className="auth-hud-right">
          <div className="auth-hud-kicker text-right">
            <span>EVIDENCE</span>
            <span>VERIFIED</span>
            <span>CHAIN OF CUSTODY</span>
            <span>SECURED</span>
          </div>
          <div className="auth-hud-divider ml-auto" />
          <div className="auth-hud-tags text-right">
            <span>FORENSIC</span>
            <span>ANALYSIS</span>
            <span>FIELD TESTING</span>
            <span>DIGITAL RECORDS</span>
          </div>

          {/* Concentric Biometric Fingerprint Pattern */}
          <div className="auth-fingerprint-hud">
            <svg viewBox="0 0 200 240" className="auth-fingerprint-svg" fill="none" stroke="currentColor">
              <path d="M100 20 C60 20 30 50 30 100 C30 160 50 200 100 230" strokeWidth="1.5" strokeOpacity="0.35" />
              <path d="M100 35 C70 35 45 60 45 105 C45 155 60 190 100 215" strokeWidth="1.5" strokeOpacity="0.45" />
              <path d="M100 50 C80 50 60 70 60 110 C60 150 70 180 100 200" strokeWidth="1.5" strokeOpacity="0.55" />
              <path d="M100 65 C88 65 75 80 75 115 C75 145 80 170 100 185" strokeWidth="1.5" strokeOpacity="0.65" />
              <path d="M100 80 C95 80 88 90 88 120 C88 140 92 160 100 170" strokeWidth="1.5" strokeOpacity="0.75" />
              <path d="M100 20 C140 20 170 50 170 100 C170 160 150 200 100 230" strokeWidth="1.5" strokeOpacity="0.35" />
              <path d="M100 35 C130 35 155 60 155 105 C155 155 140 190 100 215" strokeWidth="1.5" strokeOpacity="0.45" />
              <path d="M100 50 C120 50 140 70 140 110 C140 150 130 180 100 200" strokeWidth="1.5" strokeOpacity="0.55" />
              <path d="M100 65 C112 65 125 80 125 115 C125 145 120 170 100 185" strokeWidth="1.5" strokeOpacity="0.65" />
              <path d="M100 80 C105 80 112 90 112 120 C112 140 108 160 100 170" strokeWidth="1.5" strokeOpacity="0.75" />
              <circle cx="100" cy="120" r="4" fill="currentColor" fillOpacity="0.8" />
            </svg>
            <div className="auth-scan-reticle" />
          </div>
        </div>

        {/* Ambient Dark Navy Forensic Lab Overlay */}
        <div className="auth-forensic-overlay" />
      </div>

      {/* Main Forensic Authentication Card */}
      <div
        ref={cardRef}
        className={`auth-forensic-card ${isSignUp ? "active" : ""}`}
      >
        {/* Spring Mouse Follow Spotlight */}
        <SpringMouseFollow containerRef={cardRef} />

        {/* Form 1: LOGIN PANEL (Left side) */}
        <div className="auth-panel-box login-box" aria-hidden={isSignUp}>
          <h2 className="auth-panel-title">Login</h2>
          <p className="auth-panel-subtitle">Enter your credentials to access DRUG-SHIELD AI</p>

          <form onSubmit={(e) => void handleLoginSubmit(e)} className="auth-clean-form">
            <div className="auth-underline-group">
              <input
                id="login-username"
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder=" "
                autoComplete="username"
                required
              />
              <label htmlFor="login-username">Username</label>
              <User size={18} className="auth-field-right-icon" />
            </div>

            <div className="auth-underline-group">
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                required
              />
              <label htmlFor="login-password">Password</label>
              <Lock size={18} className="auth-field-right-icon" />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 font-medium mb-3" role="alert">
                {loginError}
              </p>
            )}

            {notice && (
              <p className="text-xs text-emerald-400 font-medium mb-3" role="status">
                {notice}
              </p>
            )}

            <button type="submit" disabled={busy} className="auth-cta-btn">
              <span>{busy ? "Signing in…" : "Login"}</span>
              <ArrowRight size={16} />
            </button>

            <p className="auth-switch-line">
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setIsSignUp(true);
                  setLoginError("");
                  setSignupError("");
                  setNotice("");
                }}
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>

        {/* Form 2: SIGN UP PANEL (Right side) */}
        <div className="auth-panel-box signup-box" aria-hidden={!isSignUp}>
          <h2 className="auth-panel-title">Sign Up</h2>
          <p className="auth-panel-subtitle">Create your account to access DRUG-SHIELD AI</p>

          <form onSubmit={(e) => void handleSignUpSubmit(e)} className="auth-clean-form">
            <div className="auth-underline-group">
              <input
                id="signup-username"
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder=" "
                autoComplete="name"
                required
              />
              <label htmlFor="signup-username">Username</label>
              <User size={18} className="auth-field-right-icon" />
            </div>

            <div className="auth-underline-group">
              <input
                id="signup-email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder=" "
                autoComplete="email"
                required
              />
              <label htmlFor="signup-email">Email</label>
              <Mail size={18} className="auth-field-right-icon" />
            </div>

            <div className="auth-underline-group mb-2">
              <input
                id="signup-password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder=" "
                autoComplete="new-password"
                required
              />
              <label htmlFor="signup-password">Password</label>
              <Lock size={18} className="auth-field-right-icon" />
            </div>

            {/* Password Requirement Indicators */}
            <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-mono">
              <span
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  hasMinLength
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-white/10 bg-white/[0.03] text-[#A7B0C0]"
                }`}
              >
                {hasMinLength ? "✓ 8+ chars" : "8+ chars"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  hasUppercase
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-white/10 bg-white/[0.03] text-[#A7B0C0]"
                }`}
              >
                {hasUppercase ? "✓ 1 Uppercase" : "1 Uppercase"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  hasLowercase
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-white/10 bg-white/[0.03] text-[#A7B0C0]"
                }`}
              >
                {hasLowercase ? "✓ 1 Lowercase" : "1 Lowercase"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  hasNumber
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "border-white/10 bg-white/[0.03] text-[#A7B0C0]"
                }`}
              >
                {hasNumber ? "✓ 1 Number" : "1 Number"}
              </span>
            </div>

            {signupError && (
              <p className="text-xs text-rose-400 font-medium mb-3" role="alert">
                {signupError}
              </p>
            )}

            <button type="submit" disabled={busy} className="auth-cta-btn">
              <span>{busy ? "Registering…" : "Register"}</span>
              <ArrowRight size={16} />
            </button>

            <p className="auth-switch-line">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setIsSignUp(false);
                  setLoginError("");
                  setSignupError("");
                  setNotice("");
                }}
              >
                Login
              </button>
            </p>
          </form>
        </div>

        {/* Sliding Diagonal Information Overlay */}
        <div className="auth-curved-overlay" aria-hidden="true">
          {/* Inner Forensic Watermark Pattern */}
          <div className="auth-overlay-watermark" />

          {/* Overlay Content in Login Mode */}
          <div className="auth-overlay-info login-info">
            <Link to="/" className="auth-overlay-brand">
              <ShieldCheck size={18} className="text-white shrink-0" />
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">DRUG-SHIELD AI</span>
                <span className="auth-overlay-brand-sub">NARCOTICS CONTROL BUREAU</span>
              </div>
            </Link>

            <h2 className="auth-overlay-heading-hero">
              SECURE FIELD <span className="block text-[#FFC499]">EVIDENCE.</span>
            </h2>
            <p className="auth-overlay-desc">
              A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.
            </p>
          </div>

          {/* Overlay Content in Sign Up Mode */}
          <div className="auth-overlay-info signup-info">
            <Link to="/" className="auth-overlay-brand">
              <ShieldCheck size={18} className="text-white shrink-0" />
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">DRUG-SHIELD AI</span>
                <span className="auth-overlay-brand-sub">NARCOTICS CONTROL BUREAU</span>
              </div>
            </Link>

            <h2 className="auth-overlay-heading-hero">
              SECURE FIELD <span className="block text-[#FFC499]">EVIDENCE.</span>
            </h2>
            <p className="auth-overlay-desc">
              A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
