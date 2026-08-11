"use client";

interface ShutterButtonProps {
  onCapture: () => void;
  disabled?: boolean;
}

/** The entry point: point the camera, then tap to analyze the place. */
export function ShutterButton({ onCapture, disabled }: ShutterButtonProps) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled}
      aria-label="Analyze this place"
      className="shutter"
    >
      <span />
    </button>
  );
}
