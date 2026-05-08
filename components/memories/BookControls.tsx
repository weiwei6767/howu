"use client";

import { useRouter } from "next/navigation";

export function BookControls() {
  const router = useRouter();
  return (
    <div className="no-print sticky top-2 z-10 flex justify-between items-center gap-3 mb-2">
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-500 bg-white/80 backdrop-blur px-3 py-2 rounded-full shadow-sm border border-zinc-200/60 hover:bg-white"
      >
        ← 返回
      </button>
      <button
        onClick={() => window.print()}
        className="text-sm bg-[var(--color-rose)] text-white px-5 py-2.5 rounded-full font-medium shadow-lg hover:opacity-90 active:scale-[0.97] transition"
      >
        🖨️ 列印 / 存成 PDF
      </button>
    </div>
  );
}
