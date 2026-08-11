import { useCallback, useEffect, useState } from "react";
import type { SavedPlace } from "@/lib/types";

const KEY = "tc.history.v1";
const MAX = 100;

/**
 * Persists explored places to the browser's localStorage — device-only, no
 * server, no account. Text entries are tiny, so we simply cap the list at MAX.
 */
export function useHistory() {
  const [entries, setEntries] = useState<SavedPlace[]>([]);

  // Load once on mount (kept out of initial state to avoid hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const write = useCallback((next: SavedPlace[]) => {
    setEntries(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage full or unavailable — history is best-effort
    }
  }, []);

  /** Insert or update a place (most recent first). */
  const save = useCallback(
    (entry: SavedPlace) => {
      setEntries((prev) => {
        const next = [entry, ...prev.filter((e) => e.id !== entry.id)].slice(
          0,
          MAX
        );
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const remove = useCallback(
    (id: string) => write(entries.filter((e) => e.id !== id)),
    [entries, write]
  );

  const clear = useCallback(() => write([]), [write]);

  return { entries, save, remove, clear };
}
