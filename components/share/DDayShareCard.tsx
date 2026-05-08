"use client";

import { forwardRef } from "react";

interface Props {
  days: number;
  togetherSince: string;
  partnerAName: string;
  partnerBName: string;
  backgroundUrl: string | null;
  /** 用於下載到 PNG 時設更大的字 */
  scale?: "preview" | "export";
}

export const DDayShareCard = forwardRef<HTMLDivElement, Props>(function DDayShareCard(
  { days, togetherSince, partnerAName, partnerBName, backgroundUrl, scale = "preview" },
  ref,
) {
  const numberSize = scale === "export" ? "11rem" : "8rem";

  return (
    <div
      ref={ref}
      className="relative rounded-[28px] overflow-hidden shadow-2xl"
      style={{ aspectRatio: "9 / 16", width: "100%" }}
    >
      {/* 背景 */}
      {backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-amber-200 to-violet-300" />
      )}

      {/* 漸層蓋層 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* 內容 */}
      <div className="relative h-full flex flex-col justify-between px-6 py-7 text-white">
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="text-[10px] tracking-[0.4em] opacity-90">HOWU</span>
          <span className="text-[11px] tracking-[0.3em] opacity-80">IN LOVE FOR</span>
        </div>

        <div className="flex flex-col items-center -mt-6">
          <div
            className="font-bold tabular-nums leading-none"
            style={{
              fontSize: numberSize,
              textShadow: "0 4px 32px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {days}
          </div>
          <p
            className="text-xl mt-1 opacity-95"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            天
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p
            className="text-xl font-semibold text-center"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
          >
            {partnerAName} <span className="text-rose-200">&</span> {partnerBName}
          </p>
          <p
            className="text-[11px] opacity-85"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            自 {togetherSince}
          </p>
          <p className="text-[10px] tracking-[0.2em] opacity-70 mt-2">howu.online</p>
        </div>
      </div>
    </div>
  );
});
