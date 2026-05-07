"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--color-rose)] text-white hover:opacity-90 active:scale-[0.98]",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 active:scale-[0.98]",
  ghost: "text-zinc-700 hover:bg-zinc-100 active:scale-[0.98]",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[var(--radius-button)]",
  md: "h-12 px-5 text-base rounded-[var(--radius-button)]",
  lg: "h-14 px-6 text-base rounded-[var(--radius-cta)]",
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
          try { navigator.vibrate(10); } catch {}
        }
        onClick?.(e);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rose)]/40",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
});

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}
