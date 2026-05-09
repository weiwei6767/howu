"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { moodLabel } from "@/lib/moods";

interface MoodAnswer {
  type: string;
  value: unknown;
}

interface ResponseRow {
  responder_id: string;
  date: string;
  mood_tags: string[] | null;
  rotating_answers: unknown;
}

type Period = "week" | "month" | "year";

interface Props {
  responses: ResponseRow[];
  myId: string;
  partnerId: string | null;
  myName: string;
  partnerName: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEnd: string;
  yearStart: string;
  yearEnd: string;
}

export function MoodRanking({
  responses,
  myId,
  partnerId,
  myName,
  partnerName,
  weekStart,
  weekEnd,
  monthStart,
  monthEnd,
  yearStart,
  yearEnd,
}: Props) {
  const t = useTranslations();
  const [period, setPeriod] = useState<Period>("week");

  const ranges: Record<Period, [string, string]> = {
    week: [weekStart, weekEnd],
    month: [monthStart, monthEnd],
    year: [yearStart, yearEnd],
  };

  const top3FromUser = (uid: string): Array<[string, number]> => {
    const [from, to] = ranges[period];
    const counts = new Map<string, number>();
    for (const r of responses) {
      if (r.responder_id !== uid) continue;
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
  };

  const myTop = useMemo(() => top3FromUser(myId), [period, responses, myId]);
  const partnerTop = useMemo(
    () => (partnerId ? top3FromUser(partnerId) : []),
    [period, responses, partnerId],
  );

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

      {/* 我的 + 對方的兩段排行 */}
      <div className="flex flex-col gap-5">
        <PersonBoard label={myName} top={myTop} period={labelMap[period]} t={t} />
        {partnerId && (
          <PersonBoard
            label={partnerName}
            top={partnerTop}
            period={labelMap[period]}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

function PersonBoard({
  label,
  top,
  period,
  t,
}: {
  label: string;
  top: Array<[string, number]>;
  period: string;
  t: T;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-[var(--color-ink-soft)] uppercase tracking-[0.18em]">
        {label}
      </p>
      {top.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--color-paper-line)] py-5 text-center text-xs text-[var(--color-ink-soft)] italic">
          {period}還沒留下心情標籤
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {top.map(([tag, count], i) => {
            const max = top[0][1];
            const pct = Math.max(8, (count / max) * 100);
            const rank = i + 1;
            return (
              <li
                key={tag}
                className="flex items-center gap-3 rounded-[12px] bg-white border border-[var(--color-paper-line)] px-3 py-2 shadow-[0_1px_3px_-1px_rgba(40,25,30,0.08)]"
              >
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-serif italic tabular-nums text-sm ${
                    rank === 1
                      ? "bg-[var(--color-accent)] text-white"
                      : rank === 2
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)]"
                        : "bg-[var(--color-paper-dim)] text-[var(--color-ink-mid)]"
                  }`}
                >
                  {rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="leading-tight text-[var(--color-ink)] truncate"
                      style={{
                        fontFamily: "var(--font-caveat), Georgia, serif",
                        fontSize: rank === 1 ? "1.4rem" : "1.15rem",
                      }}
                    >
                      {moodLabel(tag, t)}
                    </span>
                    <span className="text-xs text-[var(--color-ink-soft)] tabular-nums shrink-0">
                      ×{count}
                    </span>
                  </div>
                  <div className="mt-1 h-1 bg-[var(--color-paper-dim)] rounded-full overflow-hidden">
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
