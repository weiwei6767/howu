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
            className="relative aspect-[5/6] overflow-hidden rounded-md bg-[var(--color-paper-dim)] shadow-[0_2px_8px_-3px_rgba(40,25,30,0.18)] active:scale-[0.97] transition-transform cursor-zoom-in"
            title={p.caption ?? ""}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={p.caption ?? ""}
              loading="eager"
              decoding="async"
              fetchPriority={i < 6 ? "high" : "auto"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 底部說明條(有寫才顯示半透明黑底白字) */}
            {cap && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent px-2 pt-4 pb-1.5 text-center">
                <p
                  className="text-white leading-snug line-clamp-1"
                  style={{
                    fontFamily: "var(--font-caveat), Georgia, serif",
                    fontSize: "0.95rem",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {cap}
                </p>
              </div>
            )}
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
