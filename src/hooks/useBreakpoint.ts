"use client";

import { useState, useEffect } from "react";

export function useBreakpoint(minWidth: number = 1024) {
  const [isAbove, setIsAbove] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    setIsAbove(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsAbove(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [minWidth]);
  return isAbove;
}
