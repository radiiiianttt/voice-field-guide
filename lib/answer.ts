import type OpenAI from "openai";
import { openai } from "./openai";
import { BASE_SYSTEM_PROMPT, type Mode } from "./modes";
import type { Answer, Coords, HistoryItem } from "./types";

const MODEL = "gpt-4o";

/** Build the location hint appended to the user message when coords are known. */
function locationHint(coords: Coords, locationContext?: string): string {
  if (locationContext) {
    return `Location context (from GPS): ${locationContext}
Only give a specific name if the location context and the image plausibly agree; if you're unsure,
describe it honestly instead of guessing.`;
  }
  return `Location: this photo was taken at approximately latitude ${coords.lat.toFixed(
    5
  )}, longitude ${coords.lng.toFixed(5)}.
Use this to name the specific lake, mountain, peak, river, or landmark in view. Only give a specific
name if the coordinates and the image plausibly agree; otherwise describe it honestly.`;
}

/**
 * Look at an image through the lens of a given mode and produce a structured answer.
 * @param imageDataUrl a base64 data URL, e.g. "data:image/jpeg;base64,...."
 * @param coords optional device location, used as a hint for naming places.
 * @param history previous answers in this place session, so the model continues
 *   the conversation instead of re-introducing or repeating itself.
 */
export async function generateAnswer(
  imageDataUrl: string,
  mode: Mode,
  coords?: Coords,
  history: HistoryItem[] = [],
  locationContext?: string,
  question?: string
): Promise<Answer> {
  const userText = coords
    ? `Here is what I'm looking at.\n\n${locationHint(coords, locationContext)}`
    : "Here is what I'm looking at.";

  const isContinuation = history.length > 0;
  const isFollowUp = Boolean(question);

  // The task: a free-form follow-up question, or the mode's angle.
  const task = isFollowUp
    ? `The user is asking a follow-up question about this exact place. Answer it directly and
conversationally, using the image and location. If you don't know, say so briefly and honestly.
Keep the "title" the same place name as before.`
    : mode.prompt;

  const continuity = isContinuation
    ? `\n\nCONTINUITY: You are still talking about the SAME place to the same person. You have already
spoken to them (see the conversation so far). Do NOT greet them, do NOT re-introduce or re-identify
the place, and do NOT repeat what you already said. Keep the "title" identical to before.`
    : "";

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: `${BASE_SYSTEM_PROMPT}\n\n${task}${continuity}` },
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];

  // Replay the conversation so far (user questions + assistant answers).
  for (const item of history) {
    if (item.question) messages.push({ role: "user", content: item.question });
    messages.push({ role: "assistant", content: item.body });
  }
  // Then the current turn.
  if (isFollowUp) {
    messages.push({ role: "user", content: question! });
  } else if (isContinuation) {
    messages.push({
      role: "user",
      content: `Now give me the "${mode.label}" angle on this same place — something new, without repeating or re-introducing it.`,
    });
  }

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<Answer>;

  return {
    title: parsed.title?.trim() || "Hmm…",
    subtitle: parsed.subtitle?.trim() || "",
    body:
      parsed.body?.trim() ||
      "I couldn't quite make that out. Try getting a bit closer or steadying the shot.",
  };
}
