import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getStreak } from "@/lib/supabase/queries";
import { ddayCount } from "@/lib/utils/date";
import { BookControls } from "@/components/memories/BookControls";

interface ResponseRow {
  date: string;
  responder_id: string;
  template_id: string | null;
  rotating_answers: unknown;
}

interface TemplateRow {
  id: string;
  name: string;
  emoji: string | null;
}

export default async function MemoryBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser();
  const couple = await requireCouple(user.id);
  const me = await getProfile(user.id);
  const partner = await getPartnerProfile(user.id, couple);
  const streak = await getStreak(couple.id);
  const dday = ddayCount(couple.together_since);

  const supabase = await createSupabaseServerClient();

  // 全期所有 daily_responses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (supabase as any)
    .from("daily_responses")
    .select("date, responder_id, template_id, rotating_answers")
    .eq("couple_id", couple.id);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  // 雙方都完成的天數
  const dayResponders = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = dayResponders.get(r.date) ?? new Set();
    set.add(r.responder_id);
    dayResponders.set(r.date, set);
  }
  const totalDaysDone = Array.from(dayResponders.values()).filter((s) => s.size === 2).length;

  // 從 rotating_answers 撈短文字當「memorable moments」(取最新 10 筆有內容的)
  type Moment = { date: string; text: string };
  const moments: Moment[] = [];
  for (const r of responses) {
    const arr = (r.rotating_answers as Array<{ type: string; value: unknown; text?: string }>) ?? [];
    for (const a of arr) {
      if (a.type === "short_text" && typeof a.value === "string" && a.value.trim()) {
        moments.push({ date: r.date, text: a.value.trim() });
      }
    }
  }
  moments.sort((a, b) => (a.date < b.date ? 1 : -1));
  const topMoments = moments.slice(0, 12);

  // 模板使用統計
  const templateCount = new Map<string, number>();
  for (const r of responses) {
    if (!r.template_id) continue;
    templateCount.set(r.template_id, (templateCount.get(r.template_id) ?? 0) + 1);
  }
  const sortedTplIds = Array.from(templateCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  let templates: Array<TemplateRow & { count: number }> = [];
  if (sortedTplIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tplsRaw } = await (supabase as any)
      .from("templates")
      .select("id, name, emoji")
      .in("id", sortedTplIds);
    const map = new Map<string, TemplateRow>(
      ((tplsRaw as TemplateRow[] | null) ?? []).map((t) => [t.id, t]),
    );
    templates = sortedTplIds
      .map((id) => {
        const t = map.get(id);
        return t ? { ...t, count: templateCount.get(id) ?? 0 } : null;
      })
      .filter((x): x is TemplateRow & { count: number } => !!x);
  }

  return (
    <div className="memory-book flex flex-col gap-8 max-w-[800px] mx-auto py-8 print:py-2">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .memory-book { padding: 0; }
        }
      `}</style>

      <BookControls />

      {/* 封面 */}
      <section className="text-center py-12 border-b border-zinc-200">
        <p className="text-sm tracking-widest text-zinc-400">howu memory book</p>
        <h1 className="text-5xl font-semibold mt-3 mb-4">
          {me?.display_name ?? "我"} <span className="text-[var(--color-rose)]">&</span>{" "}
          {partner?.display_name ?? "對方"}
        </h1>
        <div className="text-7xl font-semibold tabular-nums text-[var(--color-rose)] my-6">
          {dday}
        </div>
        <p className="text-sm text-zinc-500">
          自 {couple.together_since} 起 · 至 {new Date().toISOString().slice(0, 10)}
        </p>
      </section>

      {/* 數字摘要 */}
      <section className="py-6 grid grid-cols-3 gap-3 text-center">
        <Stat n={totalDaysDone} label="一起寫了" unit="天" />
        <Stat n={responses.length} label="總共寫了" unit="份" />
        <Stat n={streak.longest_streak} label="最長連續" unit="天" />
      </section>

      {/* 模板使用 */}
      {templates.length > 0 && (
        <section className="py-6 border-t border-zinc-200">
          <h2 className="text-2xl font-semibold mb-4">最常用的模板</h2>
          <ul className="flex flex-col gap-2">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <span className="text-2xl">{t.emoji ?? "📝"}</span>
                <span className="flex-1">{t.name}</span>
                <span className="text-zinc-500 tabular-nums">{t.count} 次</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* memorable moments */}
      {topMoments.length > 0 && (
        <section className="py-6 border-t border-zinc-200">
          <h2 className="text-2xl font-semibold mb-4">想被記得的瞬間</h2>
          <ul className="flex flex-col gap-3">
            {topMoments.map((m, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-xs text-zinc-400">{m.date}</span>
                <span className="text-sm leading-relaxed">「{m.text}」</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="text-center py-12 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
          兩個人的日記、一份共寫的日常。這本書屬於 {me?.display_name ?? ""} 與{" "}
          {partner?.display_name ?? ""},也屬於你們之間慢慢長大的小日常。
        </p>
        <p className="text-xs text-zinc-400 mt-4">
          howu.online · 列印於 {new Date().toISOString().slice(0, 10)}
        </p>
      </section>
    </div>
  );
}

function Stat({ n, label, unit }: { n: number; label: string; unit: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tabular-nums text-[var(--color-rose)]">{n}</div>
      <div className="text-xs text-zinc-500 mt-1">
        {label} <span className="text-zinc-400">{unit}</span>
      </div>
    </div>
  );
}
