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
  // 本地 caption override(編輯後立刻反映,不用等 router.refresh)
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
            className="aspect-[5/6] relative bg-white p-1.5 pb-7 shadow-[0_2px_8px_-3px_rgba(40,25,30,0.18)] hover:-rotate-1 hover:scale-[1.02] active:opacity-90 transition-all cursor-zoom-in flex flex-col"
            title={p.caption ?? ""}
          >
            <div className="relative flex-1 overflow-hidden bg-[var(--color-paper-dim)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? ""}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="px-1 pt-1.5 pb-0 text-center min-h-[20px]">
              {cap ? (
                <p
                  className="text-[var(--color-ink)] leading-snug line-clamp-1"
                  style={{
                    fontFamily: "var(--font-caveat), Georgia, serif",
                    fontSize: "0.95rem",
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
