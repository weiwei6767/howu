"use client";

import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  className,
}: Props) {
  const ratio = (value - min) / (max - min);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--color-ink-mid)]">{label}</span>
          <span className="font-serif text-2xl tabular-nums text-[var(--color-ink)]">
            {value}
          </span>
        </div>
      )}
      <div className="relative h-px bg-[var(--color-paper-line)]">
        <div
          className="absolute top-0 left-0 h-px bg-[var(--color-ink)]"
          style={{ width: `${ratio * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-6 -top-3 appearance-none bg-transparent cursor-pointer slider-input"
          aria-label={label}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[var(--color-ink)] pointer-events-none transition-[left] duration-150"
          style={{ left: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-ink-soft)] tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <style jsx>{`
        .slider-input::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          opacity: 0;
        }
        .slider-input::-moz-range-thumb {
          width: 24px;
          height: 24px;
          opacity: 0;
          border: 0;
        }
      `}</style>
    </div>
  );
}
