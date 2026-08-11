"use client";

import { useState } from "react";
import type { SavedPlace } from "@/lib/types";
import { Icon } from "./Icon";

interface HistoryPanelProps {
  entries: SavedPlace[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Full-screen list of previously explored places (text-only, from localStorage). */
export function HistoryPanel({
  entries,
  onRemove,
  onClear,
  onClose,
}: HistoryPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div
      className="animate-sheet-in absolute inset-0 z-40 flex flex-col"
      style={{
        background: "rgba(247, 248, 250, 0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          History
        </h1>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full px-3 py-1.5 text-sm"
              style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-muted)" }}
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.06)", color: "var(--text)" }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        {entries.length === 0 ? (
          <div
            className="mt-24 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            No places yet. Point at something and ask —
            <br />
            it&apos;ll show up here.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((place) => {
              const open = openId === place.id;
              return (
                <li
                  key={place.id}
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    background: "#fff",
                    borderColor: "rgba(0,0,0,0.06)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : place.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {place.title}
                      </p>
                      {place.subtitle && (
                        <p
                          className="truncate text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {place.subtitle}
                        </p>
                      )}
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatWhen(place.updatedAt)} ·{" "}
                        {place.answers.length}{" "}
                        {place.answers.length === 1 ? "note" : "notes"}
                      </p>
                    </div>
                    <span
                      className="mt-1 shrink-0 transition-transform"
                      style={{
                        color: "var(--text-muted)",
                        transform: open ? "rotate(90deg)" : "none",
                      }}
                    >
                      ›
                    </span>
                  </button>

                  {open && (
                    <div className="px-4 pb-4">
                      <div className="flex flex-col gap-3">
                        {place.answers.map((a, i) => (
                          <div key={i}>
                            <p
                              className="mb-0.5 text-xs font-semibold uppercase tracking-wide"
                              style={{ color: "var(--accent)" }}
                            >
                              {a.label}
                            </p>
                            <p
                              className="text-[14px] leading-relaxed"
                              style={{ color: "rgba(23,23,23,0.85)" }}
                            >
                              {a.body}
                            </p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onRemove(place.id);
                          setOpenId(null);
                        }}
                        className="mt-4 flex items-center gap-1.5 text-sm"
                        style={{ color: "#c0392b" }}
                      >
                        <Icon name="trash" size={15} />
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Friendly relative time: "just now", "3h ago", or a date. */
function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
