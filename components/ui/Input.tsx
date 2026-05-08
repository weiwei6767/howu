"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const baseClass =
  "w-full rounded-[var(--radius-button)] border border-[var(--color-paper-line)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/10 disabled:opacity-60 dark:bg-[#1d1916] dark:border-[#2c2722]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(baseClass, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(baseClass, "min-h-24 resize-y leading-relaxed", className)}
        {...rest}
      />
    );
  },
);
