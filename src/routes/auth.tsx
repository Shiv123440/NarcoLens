import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
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

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [isSignUp, setIsSignUp] = useState(search.mode === "signup");

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
    <main className="auth-slider-page">
      <div className={`auth-slider-card ${isSignUp ? "active" : ""}`}>
        {/* Form 1: LOGIN PANEL (Left side) */}
        <div className="auth-panel-box login-box" aria-hidden={isSignUp}>
          <h2 className="auth-panel-title">Login</h2>
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

            <button type="submit" disabled={busy} className="auth-slider-btn">
              {busy ? "Signing in…" : "Login"}
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
                className={`rounded px-1.5 py-0.5 border ${
                  hasMinLength
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400"
                }`}
              >
                {hasMinLength ? "✓ 8+ chars" : "8+ chars"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border ${
                  hasUppercase
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400"
                }`}
              >
                {hasUppercase ? "✓ 1 Uppercase" : "1 Uppercase"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border ${
                  hasLowercase
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400"
                }`}
              >
                {hasLowercase ? "✓ 1 Lowercase" : "1 Lowercase"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 border ${
                  hasNumber
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-400"
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

            <button type="submit" disabled={busy} className="auth-slider-btn">
              {busy ? "Registering…" : "Register"}
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

        {/* Sliding Diagonal Overlay Shape */}
        <div className="auth-curved-overlay" aria-hidden="true">
          {/* Overlay Content in Login Mode */}
          <div className="auth-overlay-info login-info">
            <Link to="/" className="auth-overlay-brand">
              <ShieldCheck size={20} className="text-white shrink-0" />
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">DRUG-SHIELD AI</span>
                <span className="auth-overlay-brand-sub">NARCOTICS CONTROL BUREAU</span>
              </div>
            </Link>

            <h2 className="auth-overlay-title">WELCOME BACK!</h2>
            <h3 className="auth-overlay-heading">Field evidence, kept intact.</h3>
            <p className="auth-overlay-desc">
              A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.
            </p>
          </div>

          {/* Overlay Content in Sign Up Mode */}
          <div className="auth-overlay-info signup-info">
            <Link to="/" className="auth-overlay-brand">
              <ShieldCheck size={20} className="text-white shrink-0" />
              <div className="auth-overlay-brand-text">
                <span className="auth-overlay-brand-title">DRUG-SHIELD AI</span>
                <span className="auth-overlay-brand-sub">NARCOTICS CONTROL BUREAU</span>
              </div>
            </Link>

            <h2 className="auth-overlay-title">WELCOME!</h2>
            <h3 className="auth-overlay-heading">Field evidence, kept intact.</h3>
            <p className="auth-overlay-desc">
              A focused workspace for presumptive testing, evidence sealing, and chain-of-custody records in the field.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
