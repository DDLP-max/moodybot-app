import { useState, useEffect, useMemo } from 'react';

interface FreeResponsesState {
  freeLeft: number;
  isLoading: boolean;
  error: string | null;
}

export function useFreeResponses(): FreeResponsesState & {
  decrement: () => void;
  reset: () => void;
} {
  const [freeLeft, setFreeLeft] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Robust defaults so we never gate by accident
  const safeFreeLeft = useMemo(() => {
    const n = Number.isFinite(freeLeft as number) ? (freeLeft as number) : 3;
    return n < 0 ? 0 : n;
  }, [freeLeft]);

  // Load from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const raw = localStorage.getItem("mb_free_left") ?? "3";
        let n = parseInt(raw, 10);
        if (!Number.isFinite(n)) n = 3;
        setFreeLeft(Math.max(0, n));
      } catch (e) {
        console.error('Error loading free responses:', e);
        setFreeLeft(3);
      }
    };

    loadFromStorage();
  }, []);

  const decrement = () => {
    setFreeLeft(prev => {
      const next = Math.max(0, prev - 1);
      // Make sure writes never store undefined/null
      localStorage.setItem("mb_free_left", String(next));
      return next;
    });
  };

  const reset = () => {
    setFreeLeft(3);
    localStorage.setItem("mb_free_left", "3");
  };

  return {
    freeLeft: safeFreeLeft,
    isLoading,
    error,
    decrement,
    reset
  };
}
