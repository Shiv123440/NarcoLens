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

  return (
    <main className="auth-forensic-viewport">
      {/* Background Layer: Forensic Laboratory Ambient Graphics */}
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

          <form onSubmit={(e) => void handleLoginSubmit(e)} className="auth-clean-form">
            <div className="auth-field-box">
              <label htmlFor="login-username" className="auth-field-label">Username</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-username"
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  autoComplete="username"
                  required
                />
                <User size={18} className="auth-field-icon" />
              </div>
            </div>

            <div className="auth-field-box">
              <label htmlFor="login-password" className="auth-field-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  type="password"
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
