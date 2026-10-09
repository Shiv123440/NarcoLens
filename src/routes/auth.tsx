import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { User, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { signUpOfficer, signInOfficer, signInWithGoogle, getActiveOfficer, validatePassword, getSavedCredentials, unhashPassword, type SavedCredential } from "@/lib/auth-service";
import { Vortex } from "@/components/ui/vortex";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("login" as const),
    next: typeof search["next"] === "string" ? search["next"] : "/",
  }),
  head: () => ({
    meta: [
      { title: "Officer access · NarcoLens" },
      { name: "description", content: "Sign in to the NarcoLens NCB field forensics workspace." },
      { property: "og:title", content: "Officer access · NarcoLens" },
      { property: "og:description", content: "Sign in to the NarcoLens NCB field forensics workspace." },
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
      className="pointer-events-none absolute z-10 h-64 w-64 rounded-full bg-gradient-to-r from-white/[0.04] via-[#E85D04]/[0.05] to-transparent blur-2xl"
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

  // Saved credentials state for suggesting accounts
  const [savedCreds, setSavedCreds] = useState<SavedCredential[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const creds = getSavedCredentials();
    setSavedCreds(creds);
  }, []);

  const handleSelectSuggestedAccount = (cred: SavedCredential) => {
    setLoginIdentifier(cred.email);
    if (cred.password) {
      const decoded = unhashPassword(cred.password);
      if (decoded) {
        setLoginPassword(decoded);
      }
    }
    setShowSuggestions(false);
  };

  const handleGoogleSignIn = async () => {
    setLoginError("");
    setBusy(true);
    const res = await signInWithGoogle(next);
    if (!res.success) {
      setLoginError(res.error || "Failed to initialize Google Sign In.");
      setBusy(false);
    }
  };

  const filteredSuggestions = savedCreds.filter(
    (c) =>
      !loginIdentifier.trim() ||
      c.email.toLowerCase().includes(loginIdentifier.toLowerCase()) ||
      c.username.toLowerCase().includes(loginIdentifier.toLowerCase())
  );

  return (
    <main className="auth-forensic-viewport">
      {/* Background Layer: Aceternity Vortex & Forensic Ambient Graphics */}
      <div className="app-vortex-bg fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <Vortex
          backgroundColor="transparent"
          rangeY={800}
          particleCount={350}
          baseHue={30}
          baseSpeed={0.15}
          rangeSpeed={1.4}
          baseRadius={1}
          rangeRadius={2.2}
          containerClassName="h-full w-full"
        />
      </div>
      <div className="auth-forensic-bg" aria-hidden="true" />
      <div className="auth-forensic-overlay" aria-hidden="true" />

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
          <p className="auth-panel-subtitle">Enter your credentials to access NarcoLens</p>

          {/* Social Sign-In: Google Account */}
          <div className="auth-social-wrap mb-4">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={busy}
              className="auth-google-btn"
              aria-label="Sign in with Google"
            >
              <svg className="auth-google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">OR CONTINUE WITH EMAIL</span>
              <span className="auth-divider-line" />
            </div>
          </div>

          <form onSubmit={(e) => void handleLoginSubmit(e)} className="auth-clean-form">
            <div className="auth-field-box">
              <div className="flex items-center justify-between">
                <label htmlFor="login-username" className="auth-field-label">Username / Gmail</label>
                {savedCreds.length > 0 && !showSuggestions && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(true)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono tracking-wider cursor-pointer"
                  >
                    Saved Accounts ({savedCreds.length})
                  </button>
                )}
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  onFocus={() => {
                    if (savedCreds.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Enter username or email"
                  autoComplete="username email"
                  required
                />
                <User size={18} className="auth-field-icon" />

                {/* Account Suggestion Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="auth-suggestions-dropdown">
                    <div className="auth-suggestions-header">
                      <span>Saved Officers & Accounts</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200"
                      >
                        ✕
                      </button>
                    </div>
                    {filteredSuggestions.map((cred) => (
                      <button
                        key={cred.email}
                        type="button"
                        onClick={() => handleSelectSuggestedAccount(cred)}
                        className="auth-suggestion-item"
                      >
                        <div className="auth-suggestion-avatar">
                          {cred.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="auth-suggestion-text">
                          <span className="auth-suggestion-name">{cred.username}</span>
                          <span className="auth-suggestion-email">{cred.email}</span>
                        </div>
                        {cred.password && (
                          <span className="auth-suggestion-badge">Pass Saved</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="auth-field-box">
              <label htmlFor="login-password" className="auth-field-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <Lock size={18} className="auth-field-icon" />
              </div>
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
                  setShowSuggestions(false);
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
          <p className="auth-panel-subtitle">Create your account to access NarcoLens</p>

          <form onSubmit={(e) => void handleSignUpSubmit(e)} className="auth-clean-form">
            <div className="auth-field-box">
              <label htmlFor="signup-username" className="auth-field-label">Username</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-username"
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="Enter officer username"
                  autoComplete="name"
                  required
                />
                <User size={18} className="auth-field-icon" />
              </div>
            </div>

            <div className="auth-field-box">
              <label htmlFor="signup-email" className="auth-field-label">Email</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  autoComplete="email"
                  required
                />
                <Mail size={18} className="auth-field-icon" />
              </div>
            </div>

            <div className="auth-field-box mb-2">
              <label htmlFor="signup-password" className="auth-field-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create secure password"
                  autoComplete="new-password"
                  required
                />
                <Lock size={18} className="auth-field-icon" />
              </div>
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
          {/* Overlay Content in Login Mode */}
          <div className="auth-overlay-info login-info">
            <Link to="/" className="auth-overlay-brand">
              <span className="app-brand-mark w-7 h-7 shrink-0 rounded-md overflow-hidden bg-[#111214] inline-grid place-items-center" aria-hidden="true">
                <img src="/narcolens-logo.png" alt="" className="w-full h-full object-cover rounded-[5px]" />
              </span>
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">NarcoLens</span>
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
              <span className="app-brand-mark w-7 h-7 shrink-0 rounded-md overflow-hidden bg-[#111214] inline-grid place-items-center" aria-hidden="true">
                <img src="/narcolens-logo.png" alt="" className="w-full h-full object-cover rounded-[5px]" />
              </span>
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">NarcoLens</span>
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
