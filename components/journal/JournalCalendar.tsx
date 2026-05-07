"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Entry {
  id: string;
  date: string;
  content: string | null;
  shared_with_partner: boolean | null;
  signed_photo_urls: string[];
}

interface Props {
  year: number;
  month: number;
  entries: Entry[];
}

export function JournalCalendar({ year, month, entries }: Props) {
  const [selected, setSelected] = useState<Entry | null>(null);

  const map = new Map<string, Entry>();
  for (const e of entries) map.set(e.date, e);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0 = Sun

  // 補空格 + 日期格
  const cells: Array<{ date: string | null; entry: Entry | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, entry: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: dateStr, entry: map.get(dateStr) ?? null });
  }

  return (
    <>
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] sm:text-xs text-zinc-400 font-medium text-center">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.date) return <div key={i} className="aspect-square" />;
            const day = Number(c.date.slice(8, 10));
            const e = c.entry;
            const intensity = e
              ? Math.min(1, ((e.content?.length ?? 0) + e.signed_photo_urls.length * 50) / 200)
              : 0;
            const bg = e
              ? `rgba(194, 24, 91, ${0.18 + intensity * 0.55})`
              : "transparent";
            const isToday = c.date === new Date().toISOString().slice(0, 10);
            return (
              <motion.button
                key={c.date}
                type="button"
                onClick={() => e && setSelected(e)}
                disabled={!e}
                layoutId={`cell-${c.date}`}
                whileHover={e ? { scale: 1.04 } : {}}
                whileTap={e ? { scale: 0.96 } : {}}
                className={`relative aspect-square rounded-md text-xs sm:text-sm flex items-start justify-start p-1.5 transition border ${
                  isToday
                    ? "border-[var(--color-rose)] border-2"
                    : e
                      ? "border-transparent cursor-pointer hover:shadow-md"
                      : "border-zinc-100"
                }`}
                style={{ background: bg, color: e ? "#fff" : "#a1a1aa" }}
              >
                <span className="tabular-nums font-medium">{day}</span>
                {e && e.signed_photo_urls.length > 0 && (
                  <span className="absolute bottom-1 right-1 text-[8px] text-white/90">
                    📷
                  </span>
                )}
                {e?.shared_with_partner && (
                  <span className="absolute top-1 right-1 text-[8px] text-white/90">
                    ★
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[var(--color-rose)]/30" />
            少寫
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[var(--color-rose)]/70" />
            多寫
          </span>
          <span className="flex items-center gap-1">📷 有照片</span>
          <span className="flex items-center gap-1">★ 已分享</span>
        </div>
      </Card>

      {/* 開啟動畫 modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              layoutId={`cell-${selected.date}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
            >
              <header className="px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">{selected.date}</p>
                  <h2 className="text-lg font-semibold mt-0.5">日記</h2>
                </div>
                <div className="flex items-center gap-2">
                  {selected.shared_with_partner && (
                    <Badge tone="rose">已分享給對方</Badge>
                  )}
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-500"
                  >
                    ✕
                  </button>
                </div>
              </header>
              <div className="px-6 py-5 overflow-y-auto flex-1">
                {selected.signed_photo_urls.length > 0 && (
                  <div
                    className={`grid gap-2 mb-4 ${
                      selected.signed_photo_urls.length === 1
                        ? "grid-cols-1"
                        : selected.signed_photo_urls.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-3"
                    }`}
                  >
                    {selected.signed_photo_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 hover:opacity-90 transition"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 33vw, 200px"
                          className="object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {selected.content || (
                    <span className="text-zinc-400">這天只有照片,沒有文字</span>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
