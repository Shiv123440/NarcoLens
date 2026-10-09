import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

describe("useScrollDirection Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "pageYOffset", { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("is initially visible at top of page", () => {
    const { result } = renderHook(() => useScrollDirection({ topThreshold: 50 }));
    expect(result.current).toBe(true);
  });

  it("hides when scrolling down past topThreshold by threshold pixels", () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 10, topThreshold: 50 }));

    act(() => {
      window.pageYOffset = 100;
      window.scrollY = 100;
      window.dispatchEvent(new Event("scroll"));
      vi.runAllTimers();
    });

    expect(result.current).toBe(false);
  });

  it("reveals when scrolling up after being hidden", () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 10, topThreshold: 50 }));

    // Scroll down to 200
    act(() => {
      window.pageYOffset = 200;
      window.scrollY = 200;
      window.dispatchEvent(new Event("scroll"));
      vi.runAllTimers();
    });
    expect(result.current).toBe(false);

    // Scroll up to 150 (diff: -50 >= threshold 10)
    act(() => {
      window.pageYOffset = 150;
      window.scrollY = 150;
      window.dispatchEvent(new Event("scroll"));
      vi.runAllTimers();
    });
    expect(result.current).toBe(true);
  });

  it("always stays visible when near the top of page", () => {
    const { result } = renderHook(() => useScrollDirection({ threshold: 10, topThreshold: 50 }));

    act(() => {
      window.pageYOffset = 30;
      window.scrollY = 30;
      window.dispatchEvent(new Event("scroll"));
      vi.runAllTimers();
    });
    expect(result.current).toBe(true);
  });
});
