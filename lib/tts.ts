import { openai } from "./openai";

const MODEL = "gpt-4o-mini-tts";
const DEFAULT_VOICE = "alloy";

/**
 * Convert text to spoken audio.
 * @param text the words to speak.
 * @param voice the OpenAI TTS voice (defaults to "alloy").
 * @returns the MP3 audio as an ArrayBuffer.
 */
export async function textToSpeech(
  text: string,
  voice: string = DEFAULT_VOICE
): Promise<ArrayBuffer> {
  const response = await openai.audio.speech.create({
    model: MODEL,
    voice,
    input: text,
    instructions:
      "Speak like a friendly, engaging tour guide: warm, unhurried, and curious.",
    response_format: "mp3",
  });

  return response.arrayBuffer();
}
