"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 螢幕內用什麼背景。預設 paper 配色 */
  background?: string;
}

/**
 * iPhone 16 Pro 風格 mockup。
 * 寬度自動跟著 container,維持比例。
 */
export function IPhoneFrame({ children, background = "var(--color-paper)" }: Props) {
  return (
    <div className="mx-auto" style={{ width: "min(340px, 100%)" }}>
      <div
        className="relative aspect-[9/19.5] rounded-[44px] p-[10px] shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
        }}
      >
        {/* 螢幕 */}
        <div
          className="relative w-full h-full rounded-[36px] overflow-hidden"
          style={{ background }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-20 pointer-events-none" />

          {/* 狀態列 */}
          <div className="absolute top-0 inset-x-0 h-12 px-7 flex items-center justify-between text-[11px] text-zinc-700 font-medium z-10 pointer-events-none">
            <span className="tabular-nums">9:41</span>
            <span className="flex items-center gap-1">
              <SignalIcon />
              <BatteryIcon />
            </span>
          </div>

          {/* 內容 */}
          <div className="absolute inset-0 pt-12 pb-1 overflow-y-auto scrollbar-hide">
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="px-5 pb-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor">
      <rect x="0" y="6" width="2" height="3" rx="0.5" />
      <rect x="4" y="4" width="2" height="5" rx="0.5" />
      <rect x="8" y="2" width="2" height="7" rx="0.5" />
      <rect x="12" y="0" width="2" height="9" rx="0.5" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="0.8">
      <rect x="0.5" y="0.5" width="18" height="9" rx="2" />
      <rect x="2" y="2" width="15" height="6" fill="currentColor" rx="1" />
      <rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}
