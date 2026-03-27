"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  delay: number = 800,
  enabled: boolean = true
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const latestData = useRef(data);

  latestData.current = data;

  const save = useCallback(async () => {
    setStatus("saving");
    try {
      await saveFn(latestData.current);
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [saveFn]);

  useEffect(() => {
    // Skip first render (initial data load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Show pending state immediately
    setStatus("saving");

    // Debounce the actual save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay, enabled, save]);

  return status;
}
