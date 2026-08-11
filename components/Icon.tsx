"use client";

export type IconName =
  | "pin"
  | "eye"
  | "gear"
  | "play"
  | "pause"
  | "close"
  | "clock"
  | "trash"
  | "mic";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Minimal line-icon set. Stroke uses currentColor so it inherits text color. */
export function Icon({ name, size = 18, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "pin": // "Why here?" — place in a location
      return (
        <svg {...common}>
          <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "eye": // "What people miss" — notice the overlooked
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "gear": // "How it works" — the system behind it
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.65 1.65 0 0 0 4.6 13a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 6.4l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.65 1.65 0 0 0 10 3.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.65 1.65 0 0 0 20.4 10H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
        </svg>
      );
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
  }
}
