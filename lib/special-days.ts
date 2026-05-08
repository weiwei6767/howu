// 特殊日子計算 — 系統預設 + couple 自訂(milestones)
import { todayISO } from "@/lib/utils/date";

export interface SpecialDay {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  origin: "system" | "milestone";
  recurring: boolean;
}

/** 拿一年內每個系統特殊日子的「下次」日期 */
function systemDaysOfYear(year: number): SpecialDay[] {
  const list: Array<Omit<SpecialDay, "date">> = [
    { id: "valentine", name: "情人節", emoji: "💝", origin: "system", recurring: true },
    { id: "white-valentine", name: "白色情人節", emoji: "🤍", origin: "system", recurring: true },
    { id: "tw-valentine", name: "520 我愛你", emoji: "💞", origin: "system", recurring: true },
    { id: "qixi", name: "七夕", emoji: "🪐", origin: "system", recurring: true },
    { id: "christmas", name: "聖誕節", emoji: "🎄", origin: "system", recurring: true },
    { id: "new-year", name: "跨年", emoji: "🎆", origin: "system", recurring: true },
  ];
  const dateOf: Record<string, string> = {
    valentine: `${year}-02-14`,
    "white-valentine": `${year}-03-14`,
    "tw-valentine": `${year}-05-20`,
    qixi: qixi(year),
    christmas: `${year}-12-25`,
    "new-year": `${year}-12-31`,
  };
  return list.map((s) => ({ ...s, date: dateOf[s.id] }));
}

/** 七夕(農曆 7/7)— 簡化用固定查表,2024-2030 已預載,其他年回 8/22 */
function qixi(year: number): string {
  const map: Record<number, string> = {
    2024: "2024-08-10",
    2025: "2025-08-29",
    2026: "2026-08-19",
    2027: "2027-08-08",
    2028: "2028-08-26",
    2029: "2029-08-15",
    2030: "2030-08-04",
  };
  return map[year] ?? `${year}-08-15`;
}

/** 算下一個特殊日子(系統 + couple 自訂 milestones) */
export function nextSpecialDays(
  milestones: Array<{ id: string; title: string; date: string; recurring: boolean | null; type: string | null }>,
  limit = 3,
): SpecialDay[] {
  const today = new Date(`${todayISO()}T00:00:00`);
  const yyyy = today.getFullYear();

  const system = [...systemDaysOfYear(yyyy), ...systemDaysOfYear(yyyy + 1)];

  const milestoneDays: SpecialDay[] = milestones.map((m) => {
    const d = new Date(`${m.date}T00:00:00`);
    let next = new Date(d);
    if (m.recurring) {
      next.setFullYear(yyyy);
      if (next < today) next.setFullYear(yyyy + 1);
    }
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    return {
      id: `milestone-${m.id}`,
      name: m.title,
      date: iso,
      emoji: emojiForType(m.type),
      origin: "milestone",
      recurring: !!m.recurring,
    };
  });

  return [...system, ...milestoneDays]
    .filter((s) => new Date(`${s.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

function emojiForType(t: string | null): string {
  switch (t) {
    case "anniversary": return "💞";
    case "first_meet": return "✨";
    case "first_trip": return "✈️";
    case "birthday_a":
    case "birthday_b": return "🎂";
    default: return "📌";
  }
}

export function daysUntil(dateISO: string): number {
  const today = new Date(`${todayISO()}T00:00:00`);
  const target = new Date(`${dateISO}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}
