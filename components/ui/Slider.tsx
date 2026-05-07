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
  /** 起始 → 結束 顏色,將依 value 漸變 */
  gradient?: { from: string; to: string };
  /** stress 反向 — 高 = 紅 */
  reverse?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  label,
  gradient = { from: "#ffffff", to: "#FFB300" },
  reverse,
  className,
}: Props) {
  const ratio = (value - min) / (max - min);
  const displayedRatio = reverse ? 1 - ratio : ratio;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: lerpHex(gradient.from, gradient.to, displayedRatio) }}
          >
            {value}
          </span>
        </div>
      )}
      <div
        className="relative h-3 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-white/30"
          style={{ left: `${ratio * 100}%`, right: 0 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer slider-input"
          aria-label={label}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-white shadow border border-zinc-200 pointer-events-none transition-[left] duration-150"
          style={{ left: `${ratio * 100}%` }}
        />
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

function lerpHex(a: string, b: string, t: number): string {
  const ha = hexToRgb(a);
  const hb = hexToRgb(b);
  if (!ha || !hb) return a;
  const r = Math.round(ha.r + (hb.r - ha.r) * t);
  const g = Math.round(ha.g + (hb.g - ha.g) * t);
  const bl = Math.round(ha.b + (hb.b - ha.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
