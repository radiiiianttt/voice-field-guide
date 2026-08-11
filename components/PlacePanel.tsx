"use client";

import { useEffect, useRef, useState } from "react";
import { MODES, type Mode } from "@/lib/modes";
import type { CompanionStatus, Identity } from "@/lib/types";
import { useRecorder } from "@/hooks/useRecorder";
import { Icon } from "./Icon";
import { VoiceOrb, type OrbState } from "./VoiceOrb";

interface PlacePanelProps {
  answering: boolean; // false = choose step, true = talking step
  identity: Identity;
  activeMode: Mode | null;
  body: string | null;
  audioUrl: string | null;
  status: CompanionStatus;
  lastQuestion: string | null;
  onMode: (mode: Mode) => void;
  onAsk: (audio: Blob) => void;
  onDismiss: () => void;
}

const WAVE_BARS = [0, 1, 2, 3, 4, 5, 6];

/** Minimal voice-first panel: place + modes + mic, with a floating orb. */
export function PlacePanel({
  answering,
  identity,
  activeMode,
  body,
  audioUrl,
  status,
  lastQuestion,
  onMode,
  onAsk,
  onDismiss,
}: PlacePanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showText, setShowText] = useState(false);
  const {
    recording,
    speaking,
    error: micError,
    start,
    stop,
  } = useRecorder({ onResult: onAsk });

  const busy =
    status === "thinking" ||
    status === "transcribing" ||
    status === "analyzing";
  const showOrb = answering || recording;

  useEffect(() => {
    if (audioUrl) audioRef.current?.play().catch(() => setPlaying(false));
  }, [audioUrl]);

  const orbState: OrbState = recording
    ? "listening"
    : busy
      ? "thinking"
      : playing
        ? "speaking"
        : "idle";

  const statusLabel = recording
    ? speaking
      ? "Listening…"
      : "Go ahead"
    : status === "transcribing"
      ? "Thinking…"
      : busy
        ? "Thinking…"
        : playing
          ? "Speaking"
          : "Tap to replay";

  const toggleAudio = () => {
    if (recording) return; // orb isn't a playback control while listening
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (a.ended) a.currentTime = 0;
      a.play();
    } else {
      a.pause();
    }
  };

  const toggleMic = () => (recording ? stop() : start());

  const shadow = { textShadow: "0 1px 8px rgba(0,0,0,0.55)" };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center">
      {/* Floating orb over the camera */}
      {showOrb && (
        <div className="flex flex-col items-center gap-2 px-6 pb-4 text-center">
          <VoiceOrb
            state={orbState}
            onClick={toggleAudio}
            size={112}
            label="Voice"
          />
          {recording ? (
            <div className="wave" data-active={speaking}>
              {WAVE_BARS.map((i) => (
                <span
                  key={i}
                  className="bar"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-white" style={shadow}>
              {statusLabel}
            </p>
          )}
          {lastQuestion && !recording && (
            <p className="max-w-[82%] text-sm italic text-white/95" style={shadow}>
              “{lastQuestion}”
            </p>
          )}
        </div>
      )}

      {/* Minimal glass panel */}
      <div className="liquid-sheet animate-sheet-in flex max-h-[60dvh] w-full flex-col">
        <div className="min-h-0 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
          {/* Identity + close */}
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="truncate text-lg font-semibold leading-tight"
                style={{ color: "var(--text)" }}
              >
                {identity.title}
              </h2>
              <p
                className="flex items-center gap-1 truncate text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <Icon name="pin" size={11} />
                {identity.place || identity.subtitle || "No location used"}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.06)", color: "var(--text)" }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Modes + mic */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="seg shrink-0"
                  data-active={activeMode?.id === m.id}
                  disabled={busy || recording}
                  onClick={() => onMode(m)}
                >
                  <Icon name={m.icon} size={14} />
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mic-btn shrink-0"
              data-recording={recording}
              disabled={busy}
              onClick={toggleMic}
              aria-label={recording ? "Stop and send" : "Ask by voice"}
            >
              <Icon name={recording ? "close" : "mic"} size={19} />
            </button>
          </div>
          {micError && (
            <p className="mt-2 text-xs" style={{ color: "#c0392b" }}>
              {micError}
            </p>
          )}

          {/* Transcript (talking step only) */}
          {answering && body && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowText((s) => !s)}
                className="text-xs underline"
                style={{ color: "var(--text-muted)" }}
              >
                {showText ? "Hide text" : "Show text"}
              </button>
              {showText && (
                <p
                  className="mt-2 text-[15px] leading-relaxed"
                  style={{ color: "rgba(23,23,23,0.85)" }}
                >
                  {body}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
