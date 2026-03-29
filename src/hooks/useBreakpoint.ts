"use client";

import { useState, useEffect } from "react";

export function useBreakpoint(minWidth: number = 1024) {
  const [isAbove, setIsAbove] = useState(false);
  useEffect(() => {
    const check = () => setIsAbove(window.innerWidth >= minWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [minWidth]);
  return isAbove;
}
