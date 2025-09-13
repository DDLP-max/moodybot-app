"use client";
import { usePersistentState } from "@/lib/usePersistentState";

const KEY = "mb_freeReplies_v1";           // ← keep stable across deploys
const DEFAULT_LIMIT = 3;

export function useFreeReplies(limit = DEFAULT_LIMIT) {
  const [count, setCount, ready] = usePersistentState<number>(KEY, limit);

  function consume() {
    setCount((c) => Math.max(0, c - 1));
  }
  function reset(newLimit = limit) {
    setCount(newLimit);
  }

  return { ready, count, consume, reset };
}
