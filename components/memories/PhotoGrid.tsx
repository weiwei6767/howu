"use client";

import Image from "next/image";

interface Props {
  photos: { id: string; url: string; caption: string | null }[];
}

export function PhotoGrid({ photos }: Props) {
  if (!photos.length) return null;
  return (
    <>
      {photos.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-square relative overflow-hidden bg-[var(--color-paper-dim)] active:opacity-80 transition"
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
    </>
  );
}
