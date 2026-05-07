import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { DayStat } from "@/lib/journal/queries";

interface Props {
  year: number;
  month: number;
  stats: Map<string, DayStat>;
}

export function JournalCalendar({ year, month, stats }: Props) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: Array<{ date: string | null; stat: DayStat | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, stat: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: dateStr, stat: stats.get(dateStr) ?? null });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
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
          const s = c.stat;
          const intensity = s ? Math.min(1, (s.totalChars + s.count * 60) / 300) : 0;
          const bg = s ? `rgba(194, 24, 91, ${0.18 + intensity * 0.55})` : "transparent";
          const isToday = c.date === today;

          const inner = (
            <div
              className={`relative w-full h-full rounded-md text-xs sm:text-sm flex items-start justify-start p-1.5 transition border ${
                isToday
                  ? "border-[var(--color-rose)] border-2"
                  : s
                    ? "border-transparent hover:shadow-md hover:scale-[1.04]"
                    : "border-zinc-100"
              }`}
              style={{ background: bg, color: s ? "#fff" : "#a1a1aa" }}
            >
              <span className="tabular-nums font-medium">{day}</span>
              {s && s.count > 1 && (
                <span className="absolute bottom-1 left-1 text-[8px] bg-white/30 text-white px-1 rounded">
                  ×{s.count}
                </span>
              )}
              {s?.hasPhotos && (
                <span className="absolute bottom-1 right-1 text-[8px] text-white/90">📷</span>
              )}
              {s?.hasShared && (
                <span className="absolute top-1 right-1 text-[8px] text-white/90">★</span>
              )}
            </div>
          );

          return (
            <div key={c.date} className="aspect-square">
              {s ? (
                <Link href={`/journal/${c.date}`} className="block w-full h-full">
                  {inner}
                </Link>
              ) : (
                <Link href={`/journal/${c.date}`} className="block w-full h-full">
                  {inner}
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-3 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[var(--color-rose)]/30" />少寫
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[var(--color-rose)]/70" />多寫
        </span>
        <span>📷 有照片</span>
        <span>★ 已分享</span>
        <span>×N 寫了 N 篇</span>
      </div>
    </Card>
  );
}
