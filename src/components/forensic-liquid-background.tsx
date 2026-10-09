"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ForensicLiquidBackgroundProps {
  className?: string;
  intensity?: "full" | "subtle" | "minimal";
  showGrid?: boolean;
}

interface FluidRipple {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  age: number;
  maxAge: number;
  maxRadius: number;
}

export function ForensicLiquidBackground({
  className = "",
  intensity = "full",
  showGrid = true,
}: ForensicLiquidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let ripples: FluidRipple[] = [];
    let lastPointerPos = { x: -1000, y: -1000, time: 0 };
    let dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    const resizeCanvas = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // Multiplier based on intensity
    const intensityMultiplier =
      intensity === "full" ? 1 : intensity === "subtle" ? 0.6 : 0.35;

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore touch moves to prevent unwanted performance hits on low-power devices
      if (e.pointerType === "touch") return;

      const now = performance.now();
      const currentX = e.clientX;
      const currentY = e.clientY;

      if (lastPointerPos.time > 0) {
        const dx = currentX - lastPointerPos.x;
        const dy = currentY - lastPointerPos.y;
        const dist = Math.hypot(dx, dy);
        const dt = Math.max(16, now - lastPointerPos.time);

        // Spawn a ripple disturbance if movement exceeds distance threshold (~16px)
        if (dist > 16) {
          const speed = Math.min(dist / dt, 12);
          const angle = Math.atan2(dy, dx);

          ripples.push({
            x: currentX * dpr,
            y: currentY * dpr,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            angle,
            speed,
            age: 0,
            maxAge: Math.floor(45 + speed * 4), // 45 to 80 frames (~0.8s to 1.3s)
            maxRadius: Math.floor((35 + speed * 6) * dpr),
          });

          // Prevent excessive ripples during fast continuous motion
          if (ripples.length > 28) {
            ripples.shift();
          }

          lastPointerPos = { x: currentX, y: currentY, time: now };
        }
      } else {
        lastPointerPos = { x: currentX, y: currentY, time: now };
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // Fluid render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (ripples.length > 0) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          if (!r) continue;
          r.age++;

          if (r.age >= r.maxAge) {
            ripples.splice(i, 1);
            continue;
          }

          const progress = r.age / r.maxAge;
          const currentRadius = r.maxRadius * Math.sin((progress * Math.PI) / 2);
          // Ease-out alpha
          const alpha =
            (1 - progress) * (1 - progress) * 0.45 * intensityMultiplier;

          if (alpha <= 0.005) continue;

          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.rotate(r.angle);

          // Outer amber liquid disturbance wave
          ctx.beginPath();
          // Elongate slightly along the direction of motion
          ctx.ellipse(0, 0, currentRadius * 1.15, currentRadius * 0.85, 0, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(1, (2.5 * (1 - progress)) * dpr);
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.75})`;
          ctx.stroke();

          // Subtle cyan refractive highlight on the trailing edge
          ctx.beginPath();
          ctx.ellipse(
            -currentRadius * 0.2,
            0,
            currentRadius * 0.9,
            currentRadius * 0.65,
            0,
            Math.PI * 0.6,
            Math.PI * 1.4
          );
          ctx.lineWidth = Math.max(1, (1.8 * (1 - progress)) * dpr);
          ctx.strokeStyle = `rgba(86, 217, 232, ${alpha * 0.65})`;
          ctx.stroke();

          // Soft inner amber glow center
          const glowGrad = ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            Math.max(1, currentRadius * 0.6)
          );
          glowGrad.addColorStop(0, `rgba(255, 177, 92, ${alpha * 0.25})`);
          glowGrad.addColorStop(1, "rgba(255, 177, 92, 0)");

          ctx.fillStyle = glowGrad;
          ctx.fill();

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [intensity]);

  return (
    <div
      className={cn(
        "forensic-liquid-bg pointer-events-none fixed inset-0 overflow-hidden select-none z-0",
        className
      )}
      aria-hidden="true"
    >
      {/* Base Deep Obsidian / Charcoal Base */}
      <div className="absolute inset-0 bg-[#080B10]" />

      {/* Primary Organic Flowing Amber Liquid Ribbons */}
      <div
        className={cn(
          "forensic-blob-amber absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[90px] mix-blend-screen opacity-25",
          intensity === "subtle" && "opacity-15",
          intensity === "minimal" && "opacity-10"
        )}
      />

      {/* Secondary Laboratory Cyan Refraction */}
      <div
        className={cn(
          "forensic-blob-cyan absolute top-[25%] -right-[15%] w-[60vw] h-[60vw] rounded-full filter blur-[100px] mix-blend-screen opacity-20",
          intensity === "subtle" && "opacity-10",
          intensity === "minimal" && "opacity-5"
        )}
      />

      {/* Deep Liquid Graphite Flow at Bottom Center */}
      <div
        className={cn(
          "forensic-blob-graphite absolute -bottom-[20%] left-[20%] w-[65vw] h-[65vw] rounded-full filter blur-[110px] opacity-35",
          intensity === "subtle" && "opacity-20",
          intensity === "minimal" && "opacity-15"
        )}
      />

      {/* Faint Concentric Scientific Reticle Rings & Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] text-white">
        <svg viewBox="0 0 800 800" className="w-[85vw] h-[85vw] max-w-[1100px] max-h-[1100px]" fill="none">
          <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="400" cy="400" r="280" stroke="currentColor" strokeWidth="1" />
          <circle cx="400" cy="400" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="400" cy="400" r="80" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="400" x2="780" y2="400" stroke="currentColor" strokeWidth="0.8" strokeDasharray="8 8" />
          <line x1="400" y1="20" x2="400" y2="780" stroke="currentColor" strokeWidth="0.8" strokeDasharray="8 8" />
        </svg>
      </div>

      {/* Faint Molecular Hex Lattice Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025] text-amber-500">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="forensic-molecular-hex" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
              <path
                d="M28 0 L56 16.2 L56 48.5 L28 64.7 L0 48.5 L0 16.2 Z M28 97 L56 80.8 L56 48.5 L28 64.7 L0 48.5 L0 80.8 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#forensic-molecular-hex)" />
        </svg>
      </div>

      {/* Subtle Scientific Measurement Reticle / Coordinate Grid */}
      {showGrid && (
        <div className="forensic-grid-overlay absolute inset-0 opacity-[0.035]" />
      )}

      {/* Canvas Layer for Cursor-driven Fluid Ripples & Disturbances */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full mix-blend-screen"
        aria-hidden="true"
      />

      {/* Glass Surface Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,11,16,0.75)_100%)] pointer-events-none" />
    </div>
  );
}
