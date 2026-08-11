"use client";

import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useCompanion } from "@/hooks/useCompanion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useHistory } from "@/hooks/useHistory";
import type { Mode } from "@/lib/modes";
import { FocusReticle } from "./FocusReticle";
import { ShutterButton } from "./ShutterButton";
import { PlacePanel } from "./PlacePanel";
import { HistoryPanel } from "./HistoryPanel";
import { Icon } from "./Icon";

/** The single screen. Aim → shutter → analyze → choose a lens or ask → talk. */
export function CameraView() {
  const { videoRef, ready, error: cameraError, capture } = useCamera();
  const { coords, status: geoStatus, getFix } = useGeolocation();
  const {
    phase,
    status,
    identity,
    activeMode,
    body,
    audioUrl,
    error: flowError,
    session,
    lastQuestion,
    analyze,
    chooseMode,
    askByVoice,
    reset,
  } = useCompanion();
  const { entries, save, remove, clear } = useHistory();
  const [showHistory, setShowHistory] = useState(false);

  // Persist the session to local history whenever it gains a new answer.
  useEffect(() => {
    if (session && session.answers.length > 0) save(session);
  }, [session, save]);

  const aiming = phase === "aim";
  const analyzing = phase === "analyzing";

  const handleShutter = async () => {
    const [blob, fix] = await Promise.all([capture(), getFix()]);
    if (blob) analyze(blob, fix ?? coords);
  };
  const handleMode = (mode: Mode) => chooseMode(mode, coords);
  const handleAsk = (audio: Blob) => askByVoice(audio, coords);

  const geoReady = geoStatus === "ready";
  const geoLabel =
    geoStatus === "ready"
      ? "Location on"
      : geoStatus === "locating"
        ? "Locating…"
        : "Location off";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Top scrim + title */}
      <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 z-10 h-28 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <h1 className="text-center text-sm font-medium tracking-wide text-white/95 drop-shadow">
          {aiming ? "Point at a place" : analyzing ? "Analyzing…" : ""}
        </h1>
      </div>

      {/* Location status (top-left) */}
      <div
        className="glass absolute left-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
        style={{ color: geoReady ? "var(--text)" : "var(--text-muted)" }}
      >
        <Icon name="pin" size={13} />
        <span>{geoLabel}</span>
      </div>

      {/* History (top-right) */}
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        aria-label="History"
        className="glass absolute right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ color: "var(--text)" }}
      >
        <Icon name="clock" size={18} />
      </button>

      {/* Focus reticle while aiming/analyzing */}
      {(aiming || analyzing) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <FocusReticle active={analyzing} />
        </div>
      )}

      {/* Errors */}
      {(cameraError || flowError) && (
        <div className="absolute inset-x-4 top-24 z-30">
          <div
            className="glass-strong rounded-2xl p-4 text-center text-sm"
            style={{ color: "var(--text)" }}
          >
            {cameraError || flowError}
          </div>
        </div>
      )}

      {/* Shutter while aiming/analyzing */}
      {(aiming || analyzing) && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <div className="scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 h-40" />
          {aiming && (
            <p className="relative text-xs font-medium text-white/90 drop-shadow">
              Tap to identify
            </p>
          )}
          <div className="relative">
            <ShutterButton
              onCapture={handleShutter}
              disabled={!ready || analyzing}
            />
          </div>
        </div>
      )}

      {/* Choose + talk panel */}
      {(phase === "choosing" || phase === "answering") && identity && (
        <PlacePanel
          answering={phase === "answering"}
          identity={identity}
          activeMode={activeMode}
          body={body}
          audioUrl={audioUrl}
          status={status}
          lastQuestion={lastQuestion}
          onMode={handleMode}
          onAsk={handleAsk}
          onDismiss={reset}
        />
      )}

      {showHistory && (
        <HistoryPanel
          entries={entries}
          onRemove={remove}
          onClear={clear}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
