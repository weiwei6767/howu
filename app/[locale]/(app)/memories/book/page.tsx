import { setRequestLocale } from "next-intl/server";
import { requireUser, requireCouple, getPartnerProfile } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, getSyncScore } from "@/lib/supabase/queries";
import { ddayCount } from "@/lib/utils/date";
import { BookControls } from "@/components/memories/BookControls";

interface MoodAgg {
  tag: string;
  count: number;
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
  const sync = await getSyncScore(couple.id);
  const dday = ddayCount(couple.together_since);

  const supabase = await createSupabaseServerClient();

  // 全期 top mood tags
  const { data: tagsRaw } = await supabase
    .from("daily_responses")
    .select("mood_tags")
    .eq("couple_id", couple.id);
  const tagCounts = new Map<string, number>();
  for (const row of (tagsRaw as Array<{ mood_tags: string[] | null }> | null) ?? []) {
    for (const t of row.mood_tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags: MoodAgg[] = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 默契成長前 5 個 best moments
  const { data: bestRaw } = await supabase
    .from("sync_score_events")
    .select("date, delta, source")
    .eq("couple_id", couple.id)
    .order("delta", { ascending: false })
    .limit(5);
  const bestMoments = (bestRaw as Array<{ date: string; delta: number; source: string }> | null) ?? [];

  // 月度趨勢 (最近 6 個月)
  const monthlyDeltas: Array<{ ym: string; delta: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yyyy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const start = new Date(yyyy, d.getMonth(), 1).toISOString().slice(0, 10);
    const end = new Date(yyyy, d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const { data: monthDelta } = await supabase
      .from("sync_score_events")
      .select("delta")
      .eq("couple_id", couple.id)
      .gte("date", start)
      .lte("date", end);
    const delta = ((monthDelta as Array<{ delta: number }> | null) ?? []).reduce(
      (s, r) => s + (r.delta ?? 0),
      0,
    );
    monthlyDeltas.push({ ym: `${yyyy}-${String(mm).padStart(2, "0")}`, delta });
  }

  // 完成天數
  const { data: daysRaw } = await supabase
    .from("daily_responses")
    .select("date, responder_id")
    .eq("couple_id", couple.id);
  const daysDoneSet = new Set<string>();
  const dayResponders = new Map<string, Set<string>>();
  for (const row of (daysRaw as Array<{ date: string; responder_id: string }> | null) ?? []) {
    const set = dayResponders.get(row.date) ?? new Set();
    set.add(row.responder_id);
    dayResponders.set(row.date, set);
  }
  for (const [date, responders] of dayResponders.entries()) {
    if (responders.size === 2) daysDoneSet.add(date);
  }
  const totalDaysDone = daysDoneSet.size;

  const maxDelta = Math.max(1, ...monthlyDeltas.map((m) => m.delta));

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

      {/* 默契等級 */}
      <section className="py-6">
        <h2 className="text-2xl font-semibold mb-4">默契值</h2>
        <div className="flex items-baseline gap-4">
          <span className="text-6xl font-semibold tabular-nums text-[var(--color-rose)]">
            {sync?.total_score ?? 0}
          </span>
          <span className="text-xl text-zinc-500">Lv. {sync?.level ?? 1}</span>
        </div>
        <p className="text-sm text-zinc-500 mt-2">
          兩人花了 <span className="font-medium">{totalDaysDone}</span> 天一起寫進這本書。
        </p>
      </section>

      {/* 月度趨勢 */}
      <section className="py-6 border-t border-zinc-200">
        <h2 className="text-2xl font-semibold mb-4">最近 6 個月默契成長</h2>
        <div className="flex items-end gap-3 h-40 px-2">
          {monthlyDeltas.map((m) => (
            <div key={m.ym} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full bg-[var(--color-rose)] rounded-t"
                style={{ height: `${(m.delta / maxDelta) * 100}%` }}
              />
              <div className="text-[10px] text-zinc-500">{m.ym.slice(5)}</div>
              <div className="text-xs tabular-nums">+{m.delta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mood tags */}
      {topTags.length > 0 && (
        <section className="py-6 border-t border-zinc-200">
          <h2 className="text-2xl font-semibold mb-4">這段時間,我們最常的心情</h2>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <span
                key={tag.tag}
                className="rounded-full bg-[var(--color-rose-soft)]/40 text-[var(--color-rose)] px-4 py-2 text-sm"
              >
                #{tag.tag} <span className="text-xs opacity-60">× {tag.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Best moments */}
      {bestMoments.length > 0 && (
        <section className="py-6 border-t border-zinc-200">
          <h2 className="text-2xl font-semibold mb-4">默契高光時刻</h2>
          <ul className="flex flex-col gap-2">
            {bestMoments.map((m, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>
                  {m.date}{" "}
                  <span className="text-zinc-400">· {sourceLabel(m.source)}</span>
                </span>
                <span className="text-[var(--color-rose)] font-semibold tabular-nums">
                  +{m.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 結語 */}
      <section className="text-center py-12 border-t border-zinc-200">
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
          兩個人的日記、一份共寫的日常。這本書屬於 {me?.display_name ?? ""} 與{" "}
          {partner?.display_name ?? ""},也屬於你們之間慢慢長大的小默契。
        </p>
        <p className="text-xs text-zinc-400 mt-4">howu.online · 列印於 {new Date().toISOString().slice(0, 10)}</p>
      </section>
    </div>
  );
}

function sourceLabel(s: string) {
  switch (s) {
    case "fixed_q":
      return "今日心情";
    case "rotating_q":
      return "兩人題";
    case "guess_partner":
      return "猜對方";
    case "four_grid":
      return "四格題";
    case "short_text":
      return "短文字";
    default:
      return s;
  }
}

