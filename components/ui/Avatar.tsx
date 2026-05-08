"use client";

import { cn } from "@/lib/utils/cn";

interface Props {
  name: string | null;
  url?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-2xl",
};

export function Avatar({ name, url, size = "md", className }: Props) {
  const display = (name ?? "?").trim();
  const initial = display ? display[0].toUpperCase() : "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={display}
        className={cn(
          "rounded-full object-cover border border-[var(--color-paper-line)]",
          SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-[var(--color-ink)] border border-[var(--color-paper-line)] bg-[var(--color-paper-dim)]",
        SIZES[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}

export function CoupleAvatars({
  meName,
  meUrl,
  partnerName,
  partnerUrl,
  size = "md",
}: {
  meName: string | null;
  meUrl?: string | null;
  partnerName: string | null;
  partnerUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex items-center -space-x-1.5">
      <Avatar name={meName} url={meUrl} size={size} />
      <Avatar name={partnerName} url={partnerUrl} size={size} />
    </div>
  );
}
