import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "rose" | "gold" | "green" | "neutral" | "danger";

const TONE: Record<Tone, string> = {
  rose: "bg-[var(--color-rose-soft)] text-[var(--color-rose)]",
  gold: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  neutral: "bg-zinc-100 text-zinc-700",
  danger: "bg-red-100 text-red-700",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
