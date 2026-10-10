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
  isClick?: boolean;
}

export function ForensicLiquidBackground({
  className = "",
  intensity = "full",
  // showGrid is preserved in props for backwards compatibility but not rendered
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

    // Track pointer movement for directional wake ripples
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const now = performance.now();
      const currentX = e.clientX;
      const currentY = e.clientY;

      if (lastPointerPos.time > 0) {
        const dx = currentX - lastPointerPos.x;
        const dy = currentY - lastPointerPos.y;
        const dist = Math.hypot(dx, dy);
        const dt = Math.max(16, now - lastPointerPos.time);

        // Spawn a ripple disturbance if movement exceeds distance threshold (~14px)
        if (dist > 14) {
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
            maxAge: Math.floor(50 + speed * 4), // 50 to 95 frames (~0.8s to 1.5s)
            maxRadius: Math.floor((38 + speed * 7) * dpr),
            isClick: false,
          });

          // Prevent excessive ripples during rapid continuous motion
          if (ripples.length > 32) {
            ripples.shift();
          }

          lastPointerPos = { x: currentX, y: currentY, time: now };
        }
      } else {
        lastPointerPos = { x: currentX, y: currentY, time: now };
      }
    };

    // Track clicks/taps for concentric expanding liquid ripples
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      // Primary wave crest
      ripples.push({
        x: currentX * dpr,
        y: currentY * dpr,
        vx: 0,
        vy: 0,
        angle: 0,
        speed: 4,
        age: 0,
        maxAge: 70,
        maxRadius: Math.floor(100 * dpr),
        isClick: true,
      });

      // Secondary echo wave crest
      ripples.push({
        x: currentX * dpr,
        y: currentY * dpr,
        vx: 0,
        vy: 0,
        angle: Math.PI / 4,
        speed: 3,
        age: -8, // slight delay for wave echo
        maxAge: 65,
        maxRadius: Math.floor(75 * dpr),
        isClick: true,
      });

      // Limit array size
      if (ripples.length > 32) {
        ripples.shift();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    // Fluid render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (ripples.length > 0) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          if (!r) continue;
          r.age++;

          // Skip if still in negative delay
          if (r.age < 0) continue;

          if (r.age >= r.maxAge) {
            ripples.splice(i, 1);
            continue;
          }

          const progress = r.age / r.maxAge;
          const currentRadius = r.maxRadius * Math.sin((progress * Math.PI) / 2);
          // Ease-out alpha
          const alpha =
            (1 - progress) * (1 - progress) * 0.5 * intensityMultiplier;

          if (alpha <= 0.005) continue;

          ctx.save();
          ctx.translate(r.x, r.y);
          ctx.rotate(r.angle);

          if (r.isClick) {
            // Concentric circular droplet waves for click
            ctx.beginPath();
            ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            ctx.lineWidth = Math.max(1, (2.6 * (1 - progress)) * dpr);
            ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.8})`;
            ctx.stroke();

            // Inner cyan refraction ring
            if (currentRadius > 8 * dpr) {
              ctx.beginPath();
              ctx.arc(0, 0, currentRadius * 0.78, 0, Math.PI * 2);
              ctx.lineWidth = Math.max(1, (1.6 * (1 - progress)) * dpr);
              ctx.strokeStyle = `rgba(86, 217, 232, ${alpha * 0.65})`;
              ctx.stroke();
            }

            // Subtle center droplet glow
            const centerGlow = ctx.createRadialGradient(
              0, 0, 0,
              0, 0, Math.max(1, currentRadius * 0.5)
            );
            centerGlow.addColorStop(0, `rgba(255, 177, 92, ${alpha * 0.3})`);
            centerGlow.addColorStop(1, "rgba(255, 177, 92, 0)");
            ctx.fillStyle = centerGlow;
            ctx.fill();
          } else {
            // Elongated directional wake ripple along motion angle
            ctx.beginPath();
            ctx.ellipse(0, 0, currentRadius * 1.18, currentRadius * 0.82, 0, 0, Math.PI * 2);
            ctx.lineWidth = Math.max(1, (2.4 * (1 - progress)) * dpr);
            ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.75})`;
            ctx.stroke();

            // Subtle cyan refractive highlight on the trailing edge
            ctx.beginPath();
            ctx.ellipse(
              -currentRadius * 0.22,
              0,
              currentRadius * 0.9,
              currentRadius * 0.62,
              0,
              Math.PI * 0.6,
              Math.PI * 1.4
            );
            ctx.lineWidth = Math.max(1, (1.8 * (1 - progress)) * dpr);
            ctx.strokeStyle = `rgba(86, 217, 232, ${alpha * 0.65})`;
            ctx.stroke();

            // Soft inner amber glow center
            const glowGrad = ctx.createRadialGradient(
              0, 0, 0,
              0, 0, Math.max(1, currentRadius * 0.55)
            );
            glowGrad.addColorStop(0, `rgba(255, 177, 92, ${alpha * 0.25})`);
            glowGrad.addColorStop(1, "rgba(255, 177, 92, 0)");

            ctx.fillStyle = glowGrad;
            ctx.fill();
          }

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
      window.removeEventListener("pointerdown", handlePointerDown);
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
          "forensic-blob-amber absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full filter blur-[95px] mix-blend-screen opacity-25",
          intensity === "subtle" && "opacity-15",
          intensity === "minimal" && "opacity-10"
        )}
      />

      {/* Secondary Laboratory Cyan Refraction */}
      <div
        className={cn(
          "forensic-blob-cyan absolute top-[25%] -right-[15%] w-[60vw] h-[60vw] rounded-full filter blur-[105px] mix-blend-screen opacity-20",
          intensity === "subtle" && "opacity-10",
          intensity === "minimal" && "opacity-5"
        )}
      />

      {/* Deep Liquid Graphite Flow at Bottom Center */}
      <div
        className={cn(
          "forensic-blob-graphite absolute -bottom-[20%] left-[20%] w-[65vw] h-[65vw] rounded-full filter blur-[115px] opacity-35",
          intensity === "subtle" && "opacity-20",
          intensity === "minimal" && "opacity-15"
        )}
      />

      {/* Surface Liquid Sheen Layer */}
      <div className="forensic-liquid-sheen absolute inset-0 opacity-[0.04] pointer-events-none" />

      {/* Canvas Layer for Cursor-driven Fluid Ripples & Disturbances */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full mix-blend-screen"
        aria-hidden="true"
      />

      {/* Glass Surface Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,11,16,0.78)_100%)] pointer-events-none" />
    </div>
  );
}
