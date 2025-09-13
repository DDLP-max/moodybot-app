"use client";
import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initial: T) {
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, ready, value]);

  return [value, setValue, ready] as const;
}
