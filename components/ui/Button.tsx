"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-mid)]",
  secondary:
    "bg-white text-[var(--color-ink)] border border-[var(--color-paper-line)] hover:border-[var(--color-ink-mid)]",
  soft:
    "bg-[var(--color-paper-dim)] text-[var(--color-ink)] hover:bg-[var(--color-paper-line)]",
  ghost:
    "text-[var(--color-ink-mid)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, className, children, disabled, onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      onClick={(e) => {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try { navigator.vibrate(6); } catch {}
        }
        onClick?.(e);
      }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium transition-colors disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)]",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        loading ? "cursor-progress" : "disabled:opacity-40",
        className,
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2 transition-opacity", loading && "opacity-0")}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Spinner />
        </span>
      )}
    </button>
  );
});

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}
