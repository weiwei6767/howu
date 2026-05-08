"use client";

import Image from "next/image";

interface Props {
  photos: { id: string; url: string; caption: string | null }[];
}

export function PhotoGrid({ photos }: Props) {
  if (!photos.length) {
    return null;
  }
  return (
    <div className="grid grid-cols-3 gap-1">
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-square relative overflow-hidden bg-[var(--color-paper-dim)] hover:opacity-90 transition"
          title={p.caption ?? ""}
        >
          <Image
            src={p.url}
            alt={p.caption ?? ""}
            fill
            sizes="(max-width: 768px) 33vw, 200px"
            className="object-cover"
          />
        </a>
      ))}
    </div>
  );
}
