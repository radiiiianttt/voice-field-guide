import { openai } from "./openai";
import type { Answer } from "./types";

const MODEL = "gpt-4o";

/**
 * Lightweight identification only — names the place without any narration.
 * Runs at the "analyze" step so the app can show what it is before the user
 * picks a lens. Honest by design: hedges when unsure rather than inventing.
 */
export async function identifyPlace(
  imageDataUrl: string,
  locationContext?: string
): Promise<Pick<Answer, "title" | "subtitle">> {
  const system = `You identify the place, landmark, building, or natural feature in a phone photo.
Use any location context as a clue, not proof — never invent a name. If you're not sure of the exact
place, hedge in the title (e.g. "a mountain lake", "an old stone church").

Respond as JSON with exactly:
- "title": the specific name if you recognize it (e.g. "Lake Thun", "Charles Bridge"), otherwise a short
  2 to 4 word description (string)
- "subtitle": a short "what it is" line, six words or fewer, or "" (string)`;

  const userText = locationContext
    ? `Location context (a clue, not proof): ${locationContext}`
    : "No location context available.";

  const completion = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const parsed = JSON.parse(
    completion.choices[0]?.message?.content ?? "{}"
  ) as Partial<Answer>;

  return {
    title: parsed.title?.trim() || "This place",
    subtitle: parsed.subtitle?.trim() || "",
  };
}
