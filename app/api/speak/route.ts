import { NextResponse } from "next/server";
import { textToSpeech } from "@/lib/tts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, voice } = (await req.json()) as {
      text?: string;
      voice?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }

    const audio = await textToSpeech(text, voice);

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[speak] failed:", err);
    return NextResponse.json(
      { error: "Failed to generate audio." },
      { status: 500 }
    );
  }
}
