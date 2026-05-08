import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "rose" | "gold" | "green" | "neutral" | "danger";

const TONE: Record<Tone, string> = {
  rose: "border border-[var(--color-accent)]/30 text-[var(--color-accent-deep)] bg-[var(--color-accent-soft)]",
  gold: "border border-amber-300/60 text-amber-800 bg-amber-50",
  green: "border border-green-300/60 text-green-800 bg-green-50",
  neutral: "border border-[var(--color-paper-line)] text-[var(--color-ink-mid)] bg-transparent",
  danger: "border border-red-300/60 text-red-700 bg-red-50",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] tracking-wide",
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
