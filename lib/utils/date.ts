import { differenceInCalendarDays, format } from "date-fns";

/** YYYY-MM-DD,本機時區 */
export function todayISO(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayISO(d);
}

/** D-Day:從 together_since 至今的天數(含當天 = 1) */
export function ddayCount(togetherSince: string | Date): number {
  const since = typeof togetherSince === "string" ? new Date(togetherSince) : togetherSince;
  return differenceInCalendarDays(new Date(), since) + 1;
}

/** 找下一個還沒到的 milestone(含每年重複) */
export function nextMilestone<T extends { date: string; recurring: boolean | null }>(
  list: T[],
): T | null {
  if (!list.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidates = list.map((m) => {
    const orig = new Date(m.date);
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
