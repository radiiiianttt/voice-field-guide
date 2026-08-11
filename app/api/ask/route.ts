import { NextResponse } from "next/server";
import { generateAnswer } from "@/lib/answer";
import { resolveLocation } from "@/lib/geocode";
import { getMode } from "@/lib/modes";
import type { HistoryItem } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    const modeId = String(form.get("mode") ?? "");

    const mode = getMode(modeId);
    if (!mode) {
      return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
    }

    // Optional free-form follow-up question (voice, transcribed on the client side).
    const questionRaw = form.get("question");
    const question =
      typeof questionRaw === "string" && questionRaw.trim()
        ? questionRaw.trim()
        : undefined;
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }

    // Optional location hint — only used if both values parse as numbers.
    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));
    const coords =
      Number.isFinite(lat) && Number.isFinite(lng) && form.get("lat") !== null
        ? { lat, lng }
        : undefined;

    // Optional conversation history for a place session (best-effort parse).
    let history: HistoryItem[] = [];
    const rawHistory = form.get("history");
    if (typeof rawHistory === "string" && rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) history = parsed;
      } catch {
        // ignore malformed history — just answer without it
      }
    }

    // Resolve coordinates into named context (settlement + nearby lakes/peaks).
    // This is what makes naming work for ordinary places. Best-effort.
    const resolved = coords
      ? await resolveLocation(coords.lat, coords.lng)
      : null;

    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type || "image/jpeg"};base64,${bytes.toString(
      "base64"
    )}`;

    const answer = await generateAnswer(
      dataUrl,
      mode,
      coords,
      history,
      resolved?.contextLine,
      question
    );
    // `place` lets the UI show what location was used (or null if none).
    return NextResponse.json({ ...answer, place: resolved?.label ?? null });
  } catch (err) {
    console.error("[ask] failed:", err);
    return NextResponse.json(
      { error: "Failed to answer." },
      { status: 500 }
    );
  }
}
