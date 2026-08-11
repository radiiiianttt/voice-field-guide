import { useCallback, useRef, useState } from "react";

interface Options {
  /** Called with the recorded clip when it's sent (silence auto-stop or manual). */
  onResult: (audio: Blob) => void;
  /** How long the user must pause before it auto-sends. */
  silenceMs?: number;
  /** Hard cap so a recording can't run forever. */
  maxMs?: number;
}

const SPEECH_THRESHOLD = 0.025;

/**
 * Voice-first recorder with automatic voice detection: it starts listening,
 * notices when you're speaking, and once you go quiet for `silenceMs` it stops
 * and sends the clip on its own. `speaking` drives the live waveform.
 */
export function useRecorder({
  onResult,
  silenceMs = 3000,
  maxMs = 30000,
}: Options) {
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasSpokenRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  const finish = useCallback(
    (send: boolean) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") {
        cleanup();
        setRecording(false);
        setSpeaking(false);
        return;
      }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        cleanup();
        setRecording(false);
        setSpeaking(false);
        if (send && blob.size > 0 && hasSpokenRef.current) {
          onResultRef.current(blob);
        }
      };
      rec.stop();
    },
    [cleanup]
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      hasSpokenRef.current = false;
      silenceStartRef.current = null;
      startedAtRef.current = performance.now();

      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);

      // Voice-activity detection via a live amplitude read.
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();

        if (rms > SPEECH_THRESHOLD) {
          hasSpokenRef.current = true;
          silenceStartRef.current = null;
          setSpeaking(true);
        } else {
          setSpeaking(false);
          if (hasSpokenRef.current) {
            if (silenceStartRef.current == null) silenceStartRef.current = now;
            else if (now - silenceStartRef.current >= silenceMs) {
              finish(true);
              return;
            }
          }
        }
        if (now - startedAtRef.current >= maxMs) {
          finish(true);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error("[recorder] failed:", err);
      setError("Mic unavailable — allow microphone access.");
      cleanup();
      setRecording(false);
    }
  }, [cleanup, finish, silenceMs, maxMs]);

  const stop = useCallback(() => finish(true), [finish]);
  const cancel = useCallback(() => finish(false), [finish]);

  return { recording, speaking, error, start, stop, cancel };
}
