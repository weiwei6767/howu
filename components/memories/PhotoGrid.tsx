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

  if (!photos.length) return null;
  return (
    <>
      {photos.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setOpenIndex(i)}
          className="aspect-square relative overflow-hidden bg-[var(--color-paper-dim)] active:opacity-80 transition cursor-zoom-in"
          title={p.caption ?? ""}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt={p.caption ?? ""}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </button>
      ))}
      <Lightbox
        photos={photos}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={(i) => setOpenIndex(i)}
      />
    </>
  );
}
