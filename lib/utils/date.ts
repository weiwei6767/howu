import { differenceInCalendarDays } from "date-fns";

const TZ = "Asia/Taipei";

/**
 * 用 Asia/Taipei 算「今天」(YYYY-MM-DD)。
 * 不依賴 Date.now() / format,因為 Vercel server 在 UTC,
 * 用戶 23:30 寫日記會被當成隔天。
 */
export function todayISO(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
}

/** D-Day:從 together_since 至今的天數(含當天 = 1),按台北時區 */
export function ddayCount(togetherSince: string | Date): number {
  const sinceISO =
    typeof togetherSince === "string"
      ? togetherSince
      : todayISO(togetherSince);
  const today = todayISO();
  // 把 ISO 轉成 Date 比較天數
  const a = new Date(`${sinceISO}T00:00:00`);
  const b = new Date(`${today}T00:00:00`);
  return differenceInCalendarDays(b, a) + 1;
}

/** 找下一個還沒到的 milestone(含每年重複) */
export function nextMilestone<T extends { date: string; recurring: boolean | null }>(
  list: T[],
): T | null {
  if (!list.length) return null;
  const today = new Date(`${todayISO()}T00:00:00`);
  const candidates = list.map((m) => {
    const orig = new Date(`${m.date}T00:00:00`);
    let next = new Date(orig);
    if (m.recurring) {
      next.setFullYear(today.getFullYear());
      if (next.getTime() < today.getTime()) {
        next.setFullYear(today.getFullYear() + 1);
      }
    }
    return { m, next };
  });
  candidates.sort((a, b) => a.next.getTime() - b.next.getTime());
  const upcoming = candidates.find((c) => c.next.getTime() >= today.getTime());
  return upcoming?.m ?? null;
}
