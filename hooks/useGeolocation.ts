import { useCallback, useEffect, useRef, useState } from "react";
import type { Coords } from "@/lib/types";

export type GeoStatus = "locating" | "ready" | "denied" | "unavailable";

/**
 * Watches the device location and keeps the latest fix ready, so it can be
 * attached instantly when the user asks. Also reports a status (so the UI can
 * tell the user whether location is working) and exposes getFix(), a one-shot
 * fallback used at ask-time in case the watcher hasn't produced a fix yet.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("locating");
  const coordsRef = useRef<Coords | null>(null);
  const watchId = useRef<number | null>(null);

  const apply = useCallback((c: Coords) => {
    coordsRef.current = c;
    setCoords(c);
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) =>
        apply({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        console.warn("[geo] unavailable:", err.message);
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus((prev) => (prev === "ready" ? "ready" : "locating"));
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [apply]);

  /** Return the current fix, or try once more on demand (used when asking). */
  const getFix = useCallback(
    () =>
      new Promise<Coords | null>((resolve) => {
        if (coordsRef.current) return resolve(coordsRef.current);
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
          return resolve(null);
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            apply(c);
            resolve(c);
          },
          () => resolve(coordsRef.current),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
        );
      }),
    [apply]
  );

  return { coords, status, getFix };
}
