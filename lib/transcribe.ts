import { openai } from "./openai";

const MODEL = "whisper-1";

/**
 * Transcribe recorded speech to text.
 * @param audio the recorded audio (from the browser's MediaRecorder).
 */
export async function transcribe(audio: File): Promise<string> {
  const result = await openai.audio.transcriptions.create({
    model: MODEL,
    file: audio,
  });
  return result.text.trim();
}
