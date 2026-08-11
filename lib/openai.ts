import OpenAI from "openai";

/**
 * Single shared OpenAI client. The API key stays server-side only —
 * this module must never be imported into a client component.
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
