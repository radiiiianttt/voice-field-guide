/** The unified result shape every mode returns. */
export interface Answer {
  /** Headline — the landmark/object name, or e.g. "Translation". */
  title: string;
  /** Optional context line — location, category, or source language. */
  subtitle: string;
  /** The spoken words. This is what gets read aloud by text-to-speech. */
  body: string;
  /** The GPS-resolved location used (e.g. "Oberhofen am Thunersee"), if any. */
  place?: string | null;
}

/** One previous answer in a place session, used to avoid repetition. */
export interface HistoryItem {
  /** The mode label that produced it, e.g. "Why here?" or "You asked". */
  label: string;
  /** What was said (the spoken body). */
  body: string;
  /** The user's spoken question, when this was a follow-up. */
  question?: string;
}

/** A location fix from the device, used as a hint for naming places. */
export interface Coords {
  lat: number;
  lng: number;
  /** Accuracy radius in metres, if known. */
  accuracy?: number;
}

/** A place the user explored, saved locally for their history. */
export interface SavedPlace {
  /** Stable id for this place session. */
  id: string;
  title: string;
  subtitle: string;
  coords?: Coords;
  /** When it was last updated (ms since epoch). */
  updatedAt: number;
  /** Every answer heard for this place, across modes. */
  answers: HistoryItem[];
}

/** Client-side state machine for the point → ask → speak → play flow. */
export type CompanionStatus =
  | "idle"
  | "analyzing" // identifying the place after the shutter
  | "transcribing" // turning a recorded question into text
  | "thinking" // vision + text generation
  | "speaking" // text-to-speech generation
  | "playing" // audio is playing
  | "error";

/** Which screen of the flow we're on. */
export type Phase = "aim" | "analyzing" | "choosing" | "answering";

/** The identified place, shown from the choose step onward. */
export interface Identity {
  title: string;
  subtitle: string;
  place?: string | null;
}
