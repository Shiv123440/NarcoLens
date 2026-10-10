"use client";

import { useEffect, useRef, useState } from "react";
import "./NarcoLensSplash.css";

export interface NarcoLensSplashProps {
  onComplete: () => void;
  logoSrc?: string;
}

export function NarcoLensSplash({
  onComplete,
  logoSrc = "/narcolens-logo.png",
}: NarcoLensSplashProps) {
  const [exiting, setExiting] = useState(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      const quickTimer = window.setTimeout(() => completeRef.current(), 100);
      return () => window.clearTimeout(quickTimer);
    }

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 2550);

    const completeTimer = window.setTimeout(() => {
      completeRef.current();
    }, 3050);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div
      className={`nl-splash ${exiting ? "nl-splash--exit" : ""}`}
      role="status"
      aria-label="Loading NarcoLens"
    >
      <div className="nl-grid" />
      <div className="nl-orbit nl-orbit--outer" />
      <div className="nl-orbit nl-orbit--inner" />

      <div className="nl-logo-stage">
        <div className="nl-ring nl-ring--one" />
        <div className="nl-ring nl-ring--two" />

        <div className="nl-logo-frame">
          <img
            src={logoSrc}
            alt="NarcoLens emblem"
            className="nl-logo"
          />
          <div className="nl-scan-beam" />
        </div>
      </div>

      <div className="nl-brand">
        <h1>
          <span>Narco</span>
          <span className="nl-orange">Lens</span>
        </h1>

        <p className="nl-subtitle">
          NARCOTICS CONTROL BUREAU
        </p>

        <div className="nl-status">
          <span className="nl-status-dot" />
          INITIALIZING FORENSIC SYSTEMS
        </div>
      </div>

      <div className="nl-footer">
        <span>NL / SYSTEM INIT</span>
        <span>SECURE ENVIRONMENT</span>
      </div>
    </div>
  );
}

export default NarcoLensSplash;
