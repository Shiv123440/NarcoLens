import { useEffect, useRef, useState } from "react";

export interface UseScrollDirectionOptions {
  /**
   * Minimum scroll delta in pixels before triggering visibility change.
   * Prevents flickering on tiny scroll jitters.
   * Default: 12px
   */
  threshold?: number;
  /**
   * Distance from the top of the viewport (in pixels) where navbar is guaranteed visible.
   * Default: 50px
   */
  topThreshold?: number;
  /**
   * Optional reset trigger (e.g. location pathname).
   */
  resetKey?: string;
}

/**
 * Direction-aware scroll hook.
 * Returns true when scrolling up or at the top of the page;
 * returns false when scrolling down beyond threshold.
 */
export function useScrollDirection({
  threshold = 12,
  topThreshold = 50,
  resetKey,
}: UseScrollDirectionOptions = {}): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Reset visibility when route changes
  useEffect(() => {
    setIsVisible(true);
    if (typeof window !== "undefined") {
      lastScrollY.current = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
    }
  }, [resetKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;

    const updateDirection = () => {
      const currentScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0);
      const diff = currentScrollY - lastScrollY.current;

      // Always visible at or near the top of page
      if (currentScrollY <= topThreshold) {
        setIsVisible(true);
      } else if (Math.abs(diff) >= threshold) {
        // If scrolling down (diff > 0), hide. If scrolling up (diff < 0), reveal.
        setIsVisible(diff < 0);
      }

      lastScrollY.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, topThreshold]);

  return isVisible;
}
