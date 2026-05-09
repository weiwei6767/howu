// 小型手繪裝飾 SVG —— 固定 currentColor,直接 className 控顏色

export function HeartScribble({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 9.6c0-3 2-4.7 4-4.7 1.6 0 3 .7 4.5 2.6 1.5-1.9 2.9-2.6 4.5-2.6 2 0 4 1.7 4 4.7 0 4.5-7 9.4-8.5 10.4-1.5-1-8.5-5.9-8.5-10.4z" />
    </svg>
  );
}

export function Sparkle({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c.4 4.5 1.5 5.6 6 6-4.5.4-5.6 1.5-6 6-.4-4.5-1.5-5.6-6-6 4.5-.4 5.6-1.5 6-6z" />
    </svg>
  );
}

export function ArcUnderline({ className = "w-32 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" fill="none" className={className} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 8C18 4 40 3 60 3s42 1 57 5" />
    </svg>
  );
}

export function WavyDivider({ className = "w-24 h-2" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 8" fill="none" className={className} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M2 4q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" />
    </svg>
  );
}

export function StarBurst({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={className}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
    </svg>
  );
}
