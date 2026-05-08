import Link from "next/link";
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
    <div className="surface p-3 sm:p-4">
      <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] sm:text-xs text-[var(--color-ink-soft)] text-center">
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
          const isToday = c.date === today;
          const hasContent = !!s;

          return (
            <div key={c.date} className="aspect-square">
              <Link
                href={`/journal/${c.date}`}
                className={`relative w-full h-full rounded-md text-xs sm:text-sm flex items-start justify-start p-1.5 transition-colors ${
                  isToday
                    ? "ring-1 ring-[var(--color-ink)]"
                    : ""
                }`}
                style={{
                  background: hasContent
                    ? `rgba(26, 23, 21, ${0.06 + intensity * 0.18})`
                    : "transparent",
                  color: hasContent ? "var(--color-ink)" : "var(--color-ink-soft)",
                }}
              >
                <span className="tabular-nums">{day}</span>
                {s && s.count > 1 && (
                  <span className="absolute bottom-1 right-1 text-[8px] text-[var(--color-ink-mid)] tabular-nums">
                    ×{s.count}
                  </span>
                )}
                {s?.hasPhotos && (
                  <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                )}
              </Link>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-[var(--color-ink-soft)] mt-3 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-ink)]/15" />少寫
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-ink)]/40" />多寫
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />有照片
        </span>
      </div>
    </div>
  );
}
