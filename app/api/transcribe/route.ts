import { NextResponse } from "next/server";
import { toFile } from "openai/uploads";
import { transcribe } from "@/lib/transcribe";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "No audio provided." },
        { status: 400 }
      );
    }

    // Re-wrap with a filename/type OpenAI recognizes (iOS sends mp4, others webm).
    const ext = audio.type.includes("mp4") ? "mp4" : "webm";
    const file = await toFile(audio, `speech.${ext}`, {
      type: audio.type || "audio/webm",
    });

    const text = await transcribe(file);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[transcribe] failed:", err);
    return NextResponse.json(
      { error: "Failed to transcribe." },
      { status: 500 }
    );
  }
}
