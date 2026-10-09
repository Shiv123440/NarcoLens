"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ForensicLiquidBackgroundProps {
  className?: string;
  intensity?: "full" | "subtle" | "minimal";
  showGrid?: boolean;
}

export function ForensicLiquidBackground({
  className = "",
  intensity = "full",
  showGrid = true,
}: ForensicLiquidBackgroundProps) {
  return (
    <div
      className={cn(
        "forensic-liquid-bg pointer-events-none fixed inset-0 overflow-hidden select-none z-0",
        className
      )}
      aria-hidden="true"
    >
      {/* Base Deep Obsidian / Charcoal Gradient */}
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

      {/* Subtle Scientific Measurement Reticle / Coordinate Grid */}
      {showGrid && (
        <div className="forensic-grid-overlay absolute inset-0 opacity-[0.035]" />
      )}

      {/* Glass Surface Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,11,16,0.75)_100%)]" />
    </div>
  );
}
