"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface Props {
  photos: Photo[];
}

export function PhotoGrid({ photos }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [captionOverride, setCaptionOverride] = useState<Record<string, string | null>>({});

  if (!photos.length) return null;

  const display: Photo[] = photos.map((p) =>
    p.id in captionOverride ? { ...p, caption: captionOverride[p.id] } : p,
  );

  return (
    <>
      {display.map((p, i) => {
        const cap = (p.caption ?? "").trim();
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-[5/6] relative bg-white p-1 pb-6 shadow-[0_2px_8px_-3px_rgba(40,25,30,0.18)] active:scale-[0.97] transition-transform cursor-zoom-in flex flex-col rounded-[6px] overflow-hidden"
            title={p.caption ?? ""}
          >
            <div className="relative flex-1 overflow-hidden bg-[var(--color-paper-dim)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ""}
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i < 6 ? "high" : "auto"}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="px-1 pt-1 text-center">
              {cap ? (
                <p
                  className="text-[var(--color-ink)] leading-snug line-clamp-1"
                  style={{
                    fontFamily: "var(--font-caveat), Georgia, serif",
                    fontSize: "0.9rem",
                  }}
                >
                  {cap}
                </p>
              ) : (
                <p
                  className="text-[var(--color-ink-soft)] italic text-[10px]"
                  style={{ fontFamily: "var(--font-caveat), Georgia, serif" }}
                >
                  ✏︎ 加說明
                </p>
              )}
            </div>
          </button>
        );
      })}
      <Lightbox
        photos={display}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={(i) => setOpenIndex(i)}
        onCaptionUpdated={(id, caption) =>
          setCaptionOverride((prev) => ({ ...prev, [id]: caption }))
        }
      />
    </>
  );
}
