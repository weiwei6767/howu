"use client";

import { useMemo, useState } from "react";

interface MoodAnswer {
  type: string;
  value: unknown;
}

interface ResponseRow {
  date: string;
  mood_tags: string[] | null;
  rotating_answers: unknown;
}

type Period = "week" | "month" | "year";

interface Props {
  responses: ResponseRow[];
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  yearStart: string;
  yearEnd: string;
}

export function MoodRanking({
  responses,
  weekStart,
  weekEnd,
  monthStart,
  monthEnd,
  yearStart,
  yearEnd,
}: Props) {
  const [period, setPeriod] = useState<Period>("week");

  const ranges: Record<Period, [string, string]> = {
    week: [weekStart, weekEnd],
    month: [monthStart, monthEnd],
    year: [yearStart, yearEnd],
  };

  const top3 = useMemo(() => {
    const [from, to] = ranges[period];
    const counts = new Map<string, number>();
    for (const r of responses) {
      if (r.date < from || r.date > to) continue;
      for (const tag of r.mood_tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
      const arr = (r.rotating_answers as MoodAnswer[] | null) ?? [];
      for (const a of arr) {
        if (a.type === "mood_tags" && Array.isArray(a.value)) {
          for (const tag of a.value as string[]) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
          }
        }
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, responses]);

  const labelMap: Record<Period, string> = {
    week: "本週",
    month: "本月",
    year: "今年",
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl">我們的心情</h2>
        <span className="text-xs text-[var(--color-ink-soft)] tabular-nums">
          Top 3
        </span>
      </header>

      {/* 時間區間切換 */}
      <div className="grid grid-cols-3 gap-px border border-[var(--color-paper-line)] rounded-[var(--radius-button)] overflow-hidden bg-[var(--color-paper-line)]">
        {(["week", "month", "year"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`py-2 text-sm transition-colors ${
              period === p
                ? "bg-[var(--color-ink)] text-white"
                : "bg-white text-[var(--color-ink-mid)]"
            }`}
          >
            {labelMap[p]}
          </button>
        ))}
      </div>

      {/* 排行 */}
      {top3.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-paper-line)] py-8 text-center text-sm text-[var(--color-ink-soft)] italic">
          {labelMap[period]}還沒留下心情標籤
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {top3.map(([tag, count], i) => {
            const max = top3[0][1];
            const pct = Math.max(8, (count / max) * 100);
            const rank = i + 1;
            return (
              <li
                key={tag}
                className="flex items-center gap-3 rounded-[14px] bg-white border border-[var(--color-paper-line)] px-4 py-3 shadow-[0_2px_8px_-4px_rgba(40,25,30,0.1)]"
              >
                <span
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-serif italic tabular-nums ${
                    rank === 1
                      ? "bg-[var(--color-accent)] text-white text-xl"
                      : rank === 2
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)] text-base"
                        : "bg-[var(--color-paper-dim)] text-[var(--color-ink-mid)] text-base"
                  }`}
                >
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`leading-tight ${
                        rank === 1
                          ? "text-[var(--color-ink)]"
                          : "text-[var(--color-ink-mid)]"
                      }`}
                      style={{
                        fontFamily: "var(--font-caveat), Georgia, serif",
                        fontSize: rank === 1 ? "1.6rem" : "1.3rem",
                      }}
                    >
                      {tag}
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)] tabular-nums shrink-0">
                      ×{count}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        rank === 1
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-accent)]/55"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
