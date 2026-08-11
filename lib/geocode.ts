/**
 * Turn raw coordinates into rich, named location context — the key to naming
 * ordinary lakes, peaks, and villages that an LLM can't derive from bare numbers.
 *
 * Two free, no-key sources (queried in parallel, both best-effort):
 *  - Nominatim reverse geocode → the settlement you're standing in.
 *  - Overpass → named natural features (lakes, peaks, rivers) *around* you,
 *    which matters because on a shore your GPS point is on land, not the water.
 */

const UA = "travel-companion-prototype/1.0";

export interface ResolvedLocation {
  /** Full context handed to the AI. */
  contextLine: string;
  /** Short label shown in the UI, e.g. "Oberhofen am Thunersee". */
  label: string;
}

interface NominatimAddress {
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  state?: string;
  country?: string;
}

/** Reverse geocode a point to a "Town, Region, Country" string. */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${lat}&lon=${lng}&zoom=13&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: NominatimAddress;
    };
    const a = data.address ?? {};
    const place =
      a.village ||
      a.town ||
      a.city ||
      a.municipality ||
      a.hamlet ||
      a.suburb ||
      a.county;
    const parts = [place, a.state, a.country].filter(Boolean);
    return parts.length ? parts.join(", ") : data.display_name ?? null;
  } catch {
    return null;
  }
}

interface OverpassEl {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; natural?: string; water?: string; waterway?: string };
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Find named lakes, peaks, and rivers around a point via Overpass. */
async function nearbyFeatures(lat: number, lng: number): Promise<string[]> {
  const query = `[out:json][timeout:8];
(
  way["natural"="water"]["name"](around:2500,${lat},${lng});
  relation["natural"="water"]["name"](around:2500,${lat},${lng});
  node["natural"="peak"]["name"](around:6000,${lat},${lng});
  way["waterway"="river"]["name"](around:1500,${lat},${lng});
);
out tags center 60;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
      },
      body: "data=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { elements?: OverpassEl[] };

    const scored = (data.elements ?? [])
      .map((el) => {
        const name = el.tags?.name;
        const p = el.center ?? (el.lat != null && el.lon != null ? el : null);
        if (!name || !p || p.lat == null || p.lon == null) return null;
        const kind =
          el.tags?.natural === "peak"
            ? "a mountain"
            : el.tags?.waterway === "river"
              ? "a river"
              : "a lake";
        return { name, kind, d: haversineMeters(lat, lng, p.lat, p.lon) };
      })
      .filter((x): x is { name: string; kind: string; d: number } => x !== null);

    // Keep the closest instance of each unique name.
    const byName = new Map<string, { name: string; kind: string; d: number }>();
    for (const s of scored) {
      const ex = byName.get(s.name);
      if (!ex || s.d < ex.d) byName.set(s.name, s);
    }
    return [...byName.values()]
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map((s) => `${s.name} (${s.kind})`);
  } catch {
    return [];
  }
}

/** Resolve a point into named context for the AI + a short label for the UI. */
export async function resolveLocation(
  lat: number,
  lng: number
): Promise<ResolvedLocation | null> {
  const [settlementR, featuresR] = await Promise.allSettled([
    reverseGeocode(lat, lng),
    nearbyFeatures(lat, lng),
  ]);
  const settlement =
    settlementR.status === "fulfilled" ? settlementR.value : null;
  const features = featuresR.status === "fulfilled" ? featuresR.value : [];

  if (!settlement && features.length === 0) return null;

  let contextLine = "";
  if (settlement) contextLine += `You are in or near ${settlement}. `;
  if (features.length) {
    contextLine += `Named features nearby (closest first): ${features.join(
      ", "
    )}. `;
  }
  contextLine +=
    "Use the image to decide which of these the person is actually looking at, and name it specifically.";

  const label = settlement ?? features[0]?.replace(/ \(.*\)$/, "") ?? "";
  return { contextLine, label };
}
