"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CellRipple {
  id: number;
  x: number;
  y: number;
}

interface RippleCellProps {
  className?: string;
}

export function RippleCell({ className = "" }: RippleCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<CellRipple | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerRipple = useCallback((clientX: number, clientY: number) => {
    const cell = cellRef.current;
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const newRipple: CellRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setRipple(newRipple);

    // Ripple animation lasts 450ms; clean up state after animation completes
    timerRef.current = setTimeout(() => {
      setRipple(null);
      timerRef.current = null;
    }, 450);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = typeof (e as any).clientX === "number" && !isNaN((e as any).clientX)
      ? (e as any).clientX
      : typeof (e as any).nativeEvent?.clientX === "number" && !isNaN((e as any).nativeEvent?.clientX)
      ? (e as any).nativeEvent.clientX
      : 0;
    const clientY = typeof (e as any).clientY === "number" && !isNaN((e as any).clientY)
      ? (e as any).clientY
      : typeof (e as any).nativeEvent?.clientY === "number" && !isNaN((e as any).nativeEvent?.clientY)
      ? (e as any).nativeEvent.clientY
      : 0;
    triggerRipple(clientX, clientY);
  }, [triggerRipple]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = typeof (e as any).clientX === "number" && !isNaN((e as any).clientX)
      ? (e as any).clientX
      : typeof (e as any).nativeEvent?.clientX === "number" && !isNaN((e as any).nativeEvent?.clientX)
      ? (e as any).nativeEvent.clientX
      : 0;
    const clientY = typeof (e as any).clientY === "number" && !isNaN((e as any).clientY)
      ? (e as any).clientY
      : typeof (e as any).nativeEvent?.clientY === "number" && !isNaN((e as any).nativeEvent?.clientY)
      ? (e as any).nativeEvent.clientY
      : 0;
    triggerRipple(clientX, clientY);
  }, [triggerRipple]);

  return (
    <div
      ref={cellRef}
      className={cn("ripple-cell", className)}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      role="presentation"
    >
      {ripple && (
        <span
          key={ripple.id}
          className="cell-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
          data-x={ripple.x}
          data-y={ripple.y}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export interface InteractiveRippleGridProps {
  className?: string;
  cellSize?: number;
}

export function InteractiveRippleGrid({
  className = "",
  cellSize = 56,
}: InteractiveRippleGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    const updateGrid = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const cols = Math.ceil(clientWidth / cellSize);
      const rows = Math.ceil(clientHeight / cellSize);
      setDimensions({ cols, rows });
    };

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, [cellSize]);

  const totalCells = dimensions.cols * dimensions.rows;

  return (
    <div
      ref={containerRef}
      className={cn(
        "interactive-ripple-grid-container pointer-events-auto absolute inset-0 z-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${dimensions.cols || 1}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${dimensions.rows || 1}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => (
          <RippleCell key={i} />
        ))}
      </div>
    </div>
  );
}

export const BackgroundRippleEffect = InteractiveRippleGrid;
