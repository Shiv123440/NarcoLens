"use client";

import React, { useEffect, useRef, useState } from "react";

export interface FloatingHeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxRotateX?: number;
  maxRotateY?: number;
  pushZ?: number;
  lift?: number;
}

export function FloatingHeroCard({
  children,
  className = "",
  maxRotateX = 2.0,
  maxRotateY = 2.4,
  pushZ = -8,
  lift = 0,
  ...props
}: FloatingHeroCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setIsHovered(true);
    const card = cardRef.current;
    if (card) {
      card.setAttribute("data-hover", "true");
      card.style.setProperty("--push-z", `${pushZ}px`);
      card.style.setProperty("--lift", `${lift}px`);
      card.style.setProperty("--highlight-opacity", "1");
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nx = Math.max(-1, Math.min(1, (x / rect.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (y / rect.height) * 2 - 1));

      const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

      // Push back: section under cursor tilts gently backward into the depth of the screen
      const rotX = Number((ny * maxRotateX).toFixed(2));
      const rotY = Number((-nx * maxRotateY).toFixed(2));

      // Gentle depth variation: pushes slightly deeper where the cursor presses
      const dist = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      const currentPushZ = Number((pushZ - dist * 3).toFixed(1));

      card.style.setProperty("--rotate-x", `${rotX}deg`);
      card.style.setProperty("--rotate-y", `${rotY}deg`);
      card.style.setProperty("--push-z", `${currentPushZ}px`);
      card.style.setProperty("--pointer-x", `${px.toFixed(1)}%`);
      card.style.setProperty("--pointer-y", `${py.toFixed(1)}%`);
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const card = cardRef.current;
    if (card) {
      card.setAttribute("data-hover", "false");
      card.style.setProperty("--rotate-x", "0deg");
      card.style.setProperty("--rotate-y", "0deg");
      card.style.setProperty("--push-z", "0px");
      card.style.setProperty("--lift", "0px");
      card.style.setProperty("--pointer-x", "50%");
      card.style.setProperty("--pointer-y", "50%");
      card.style.setProperty("--highlight-opacity", "0");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`app-hero-perspective-wrapper relative w-full ${className}`}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <section
        ref={cardRef}
        className="app-hero app-hero-3d"
        aria-label="Start a new test"
        data-hover="false"
      >
        <div className="app-hero-highlight" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}
