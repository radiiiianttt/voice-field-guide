import { useCallback, useRef, useState } from "react";
import { MODES, type Mode } from "@/lib/modes";
import type {
  Coords,
  CompanionStatus,
  HistoryItem,
  Identity,
  Phase,
  SavedPlace,
} from "@/lib/types";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Drives the flow: aim → analyze (identify the place) → choose (mode or ask) →
 * answer (orb speaks). One captured image is explored through modes and spoken
 * follow-ups; the identity stays fixed and the conversation carries so the model
 * never re-introduces or repeats itself.
 */
export function useCompanion() {
  const [phase, setPhase] = useState<Phase>("aim");
  const [status, setStatus] = useState<CompanionStatus>("idle");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SavedPlace | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const imageRef = useRef<Blob | null>(null);
  const historyRef = useRef<HistoryItem[]>([]);
  const identityRef = useRef<Identity | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionCoordsRef = useRef<Coords | null>(null);
  const lastAudioUrl = useRef<string | null>(null);
  // Kept current so callbacks can pick the right voice for a free question.
  const activeModeRef = useRef<Mode | null>(null);
  activeModeRef.current = activeMode;

  const clearAudio = useCallback(() => {
    if (lastAudioUrl.current) URL.revokeObjectURL(lastAudioUrl.current);
    lastAudioUrl.current = null;
    setAudioUrl(null);
  }, []);

  const reset = useCallback(() => {
    setPhase("aim");
    setStatus("idle");
    setIdentity(null);
    setActiveMode(null);
    setBody(null);
    setError(null);
    setSession(null);
    setLastQuestion(null);
    imageRef.current = null;
    historyRef.current = [];
    identityRef.current = null;
    sessionIdRef.current = null;
    sessionCoordsRef.current = null;
    clearAudio();
  }, [clearAudio]);

  /** Step 1: capture a frame and identify the place (no narration yet). */
  const analyze = useCallback(
    async (image: Blob, coords?: Coords | null) => {
      imageRef.current = image;
      historyRef.current = [];
      identityRef.current = null;
      sessionIdRef.current = makeId();
      sessionCoordsRef.current = coords ?? null;
      setIdentity(null);
      setBody(null);
      setActiveMode(null);
      setLastQuestion(null);
      setError(null);
      clearAudio();
      setPhase("analyzing");
      setStatus("analyzing");

      try {
        const form = new FormData();
        form.append("image", image, "capture.jpg");
        if (coords) {
          form.append("lat", String(coords.lat));
          form.append("lng", String(coords.lng));
        }
        const res = await fetch("/api/identify", { method: "POST", body: form });
        if (!res.ok) throw new Error("identify failed");
        const found = (await res.json()) as Identity;
        identityRef.current = found;
        setIdentity(found);
        setStatus("idle");
        setPhase("choosing");
      } catch (err) {
        console.error("[companion] analyze failed:", err);
        setError("Couldn't analyze that. Try again.");
        setStatus("error");
        setPhase("aim");
      }
    },
    [clearAudio]
  );

  /** Shared request that produces a spoken answer (a mode angle or a question). */
  const run = useCallback(
    async (mode: Mode, coords?: Coords | null, question?: string) => {
      const image = imageRef.current;
      if (!image) return;

      const isContinuation = historyRef.current.length > 0;
      setError(null);
      // A free question has no chosen lens, so no chip should look active.
      setActiveMode(question ? null : mode);
      setPhase("answering");
      clearAudio();
      setBody(null);
      setStatus("thinking");

      try {
        const form = new FormData();
        form.append("image", image, "capture.jpg");
        form.append("mode", mode.id);
        if (question) form.append("question", question);
        if (coords) {
          form.append("lat", String(coords.lat));
          form.append("lng", String(coords.lng));
        }
        if (isContinuation) {
          form.append("history", JSON.stringify(historyRef.current));
        }

        const res = await fetch("/api/ask", { method: "POST", body: form });
        if (!res.ok) throw new Error("ask failed");
        const result = (await res.json()) as {
          title: string;
          subtitle: string;
          body: string;
          place?: string | null;
        };

        // Keep the identity from the analyze step; only the body changes.
        if (!identityRef.current) {
          identityRef.current = {
            title: result.title,
            subtitle: result.subtitle,
            place: result.place,
          };
          setIdentity(identityRef.current);
        }
        setBody(result.body);
        historyRef.current = [
          ...historyRef.current,
          {
            label: question ? "You asked" : mode.label,
            body: result.body,
            ...(question ? { question } : {}),
          },
        ];

        setSession({
          id: sessionIdRef.current ?? makeId(),
          title: identityRef.current.title,
          subtitle: identityRef.current.subtitle,
          coords: sessionCoordsRef.current ?? undefined,
          updatedAt: Date.now(),
          answers: historyRef.current,
        });

        setStatus("speaking");
        const speakRes = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: result.body, voice: mode.voice }),
        });
        if (!speakRes.ok) throw new Error("speak failed");
        const audioBlob = await speakRes.blob();
        const url = URL.createObjectURL(audioBlob);
        lastAudioUrl.current = url;
        setAudioUrl(url);
        setStatus("playing");
      } catch (err) {
        console.error("[companion] run failed:", err);
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    },
    [clearAudio]
  );

  /** Step 2a: explore the place through a mode (also used to switch lenses). */
  const chooseMode = useCallback(
    (mode: Mode, coords?: Coords | null) => run(mode, coords),
    [run]
  );

  /** Step 2b: ask your own question by voice (transcribe, then answer). */
  const askByVoice = useCallback(
    async (audio: Blob, coords?: Coords | null) => {
      if (!imageRef.current) return;
      setError(null);
      setLastQuestion(null);
      setPhase("answering");
      setBody(null);
      setStatus("transcribing");
      try {
        const form = new FormData();
        form.append("audio", audio, "question.webm");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error("transcribe failed");
        const { text } = (await res.json()) as { text: string };
        if (!text?.trim()) {
          setError("I didn't catch that — try asking again.");
          setStatus("idle");
          return;
        }
        setLastQuestion(text.trim());
        const voiceMode = activeModeRef.current ?? MODES[0];
        await run(voiceMode, coords, text.trim());
      } catch (err) {
        console.error("[companion] askByVoice failed:", err);
        setError("Something went wrong. Please try again.");
        setStatus("error");
      }
    },
    [run]
  );

  return {
    phase,
    status,
    identity,
    activeMode,
    body,
    audioUrl,
    error,
    session,
    lastQuestion,
    analyze,
    chooseMode,
    askByVoice,
    reset,
  };
}
