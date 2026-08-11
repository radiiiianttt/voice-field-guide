import { NextResponse } from "next/server";
import { identifyPlace } from "@/lib/identify";
import { resolveLocation } from "@/lib/geocode";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }

    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));
    const coords =
      Number.isFinite(lat) && Number.isFinite(lng) && form.get("lat") !== null
        ? { lat, lng }
        : undefined;

    const resolved = coords
      ? await resolveLocation(coords.lat, coords.lng)
      : null;

    const bytes = Buffer.from(await image.arrayBuffer());
    const dataUrl = `data:${image.type || "image/jpeg"};base64,${bytes.toString(
      "base64"
    )}`;

    const { title, subtitle } = await identifyPlace(
      dataUrl,
      resolved?.contextLine
    );
    return NextResponse.json({ title, subtitle, place: resolved?.label ?? null });
  } catch (err) {
    console.error("[identify] failed:", err);
    return NextResponse.json(
      { error: "Failed to identify." },
      { status: 500 }
    );
  }
}
