"use client";

import { forwardRef } from "react";

interface Props {
  days: number;
  togetherSince: string;
  partnerAName: string;
  partnerBName: string;
  /** 必須是 same-origin(/api/img-proxy?...)以避免 canvas taint */
  backgroundUrl: string | null;
  scale?: "preview" | "export";
}

export const DDayShareCard = forwardRef<HTMLDivElement, Props>(function DDayShareCard(
  { days, togetherSince, partnerAName, partnerBName, backgroundUrl, scale = "preview" },
  ref,
) {
  const numberSize = scale === "export" ? "8rem" : "5.5rem";

  return (
    <div
      ref={ref}
      className="relative rounded-[28px] overflow-hidden shadow-2xl"
      style={{ aspectRatio: "9 / 16", width: "100%" }}
    >
      {/* 背景 — same-origin proxy 不需 crossOrigin attribute */}
      {backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-amber-200 to-violet-300" />
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative h-full flex flex-col justify-between px-6 py-7 text-white">
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="text-[10px] tracking-[0.4em] opacity-90">HOWU</span>
          <span className="text-[10px] tracking-[0.3em] opacity-75">IN LOVE FOR</span>
        </div>

        <div className="flex flex-col items-center -mt-4">
          <div
            className="tabular-nums leading-none"
            style={{
              fontSize: numberSize,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              fontFamily: 'Georgia, "Noto Serif TC", "Times New Roman", serif',
              textShadow: "0 4px 24px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {days}
          </div>
          <p
            className="text-base mt-2 opacity-90 tracking-[0.3em]"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            DAYS
          </p>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <p
            className="text-base font-medium text-center tracking-wide"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}
          >
            {partnerAName} <span className="text-rose-200 mx-1">&</span> {partnerBName}
          </p>
          <p
            className="text-[10px] opacity-75 tracking-wider"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            since {togetherSince}
          </p>
          <p className="text-[9px] tracking-[0.3em] opacity-60 mt-3">howu.online</p>
        </div>
      </div>
    </div>
  );
});
