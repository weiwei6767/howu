"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const baseClass =
  "w-full rounded-[var(--radius-button)] border border-zinc-200 bg-white px-4 py-3 text-base placeholder:text-zinc-400 focus:border-[var(--color-rose)] focus:outline-none focus:ring-2 focus:ring-[var(--color-rose)]/20 disabled:opacity-60 dark:bg-zinc-900 dark:border-zinc-700";

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
