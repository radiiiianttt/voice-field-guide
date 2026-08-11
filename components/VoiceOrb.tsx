"use client";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  onClick?: () => void;
  size?: number;
  label?: string;
}

/** An animated orb that reflects the voice state (idle/listening/thinking/speaking). */
export function VoiceOrb({ state, onClick, size = 128, label }: VoiceOrbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "Voice"}
      className="orb-wrap"
      data-state={state}
      style={{ width: size, height: size }}
    >
      <span className="orb-glow" />
      <span className="orb-ring" />
      <span className="orb-core" />
    </button>
  );
}
