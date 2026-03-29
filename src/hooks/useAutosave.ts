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
  const savingRef = useRef(false);

  latestData.current = data;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    try {
      await saveFn(latestData.current);
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      savingRef.current = false;
    }
  }, [saveFn]);

  /** Immediately save pending data (call before closing a modal, etc.) */
  const flush = useCallback(async () => {
    cancel();
    if (!savingRef.current) {
      await save();
    }
  }, [cancel, save]);

  useEffect(() => {
    // Skip first render (initial data load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    // Clear previous timeout
    cancel();

    // Show pending state immediately
    setStatus("saving");

    // Debounce the actual save
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      cancel();
    };
  }, [data, delay, enabled, save, cancel]);

  return { status, flush };
}
