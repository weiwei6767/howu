import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireUser, getActiveCouple } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface ResponseRow {
  couple_id: string | null;
  date: string;
  responder_id: string;
}

interface CoupleAgg {
  coupleId: string;
  totalDays: number;          // 雙方都寫的天數
  totalEntries: number;       // 總份數
  currentStreak: number;
  longestStreak: number;
}

function computeStreak(daysBoth: string[]): { current: number; longest: number } {
  if (daysBoth.length === 0) return { current: 0, longest: 0 };
  // 排序遞增
  const sorted = [...daysBoth].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else if (diff > 1) {
      run = 1;
    }
  }
  // current streak: 從最後一天往回數,且最後一天必須是今天或昨天
  const last = sorted[sorted.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(last);
  const daysFromToday = Math.round(
    (today.getTime() - lastDate.getTime()) / 86400000,
  );
  let current = 0;
  if (daysFromToday <= 1) {
    current = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const a = new Date(sorted[i]);
      const b = new Date(sorted[i + 1]);
      const d = Math.round((b.getTime() - a.getTime()) / 86400000);
      if (d === 1) current += 1;
      else break;
    }
  }
  return { current, longest };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");

  const user = await requireUser();
  const myCouple = await getActiveCouple(user.id);

  const admin = createSupabaseAdminClient();

  // 抓所有 daily_responses(只取必要欄位)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: respRaw } = await (admin as any)
    .from("daily_responses")
    .select("couple_id, date, responder_id")
    .limit(50000);
  const responses = (respRaw as ResponseRow[] | null) ?? [];

  // 全站情侶數
  const { count: couplesCount } = await admin
    .from("couples")
    .select("id", { count: "exact", head: true });

  // 依 couple 聚合
  const byCouple = new Map<string, { entries: number; daysBoth: Set<string>; daysAny: Map<string, Set<string>> }>();
  for (const r of responses) {
    if (!r.couple_id) continue;
    const agg = byCouple.get(r.couple_id) ?? {
      entries: 0,
      daysBoth: new Set<string>(),
      daysAny: new Map<string, Set<string>>(),
    };
    agg.entries += 1;
    const set = agg.daysAny.get(r.date) ?? new Set<string>();
    set.add(r.responder_id);
    agg.daysAny.set(r.date, set);
    byCouple.set(r.couple_id, agg);
  }
  for (const [, agg] of byCouple) {
    for (const [date, responders] of agg.daysAny) {
      if (responders.size === 2) agg.daysBoth.add(date);
    }
  }

  const couples: CoupleAgg[] = Array.from(byCouple.entries()).map(([coupleId, agg]) => {
    const daysBoth = Array.from(agg.daysBoth);
    const { current, longest } = computeStreak(daysBoth);
    return {
      coupleId,
      totalDays: daysBoth.length,
      totalEntries: agg.entries,
      currentStreak: current,
      longestStreak: longest,
    };
  });

  const totalEntries = responses.length;

  // 排序兩個榜
  const byCurrent = [...couples].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 50);
  const byLongest = [...couples].sort((a, b) => b.longestStreak - a.longestStreak).slice(0, 50);

  // 找自己排名
  const myInList = myCouple ? couples.find((c) => c.coupleId === myCouple.id) : null;
  const myCurrentRank =
    myInList
      ? [...couples].sort((a, b) => b.currentStreak - a.currentStreak).findIndex(
          (c) => c.coupleId === myCouple!.id,
        ) + 1
      : null;
  const myLongestRank =
    myInList
      ? [...couples].sort((a, b) => b.longestStreak - a.longestStreak).findIndex(
          (c) => c.coupleId === myCouple!.id,
        ) + 1
      : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
          {t("code_label")}
        </p>
        <h1 className="font-serif text-3xl mt-1">{t("title")}</h1>
        <p className="text-sm text-[var(--color-ink-mid)] mt-2 leading-relaxed">
          {t("intro")}
        </p>
      </header>

      {/* 全站數據 */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-[var(--color-paper-line)] pb-5">
        <Stat label={t("global_couples")} value={couplesCount ?? 0} />
        <Stat label={t("global_days")} value={totalEntries} />
      </section>

      {/* 你們的排名 */}
      {myInList && (
        <section className="border-l-2 border-[var(--color-accent)] pl-4 py-1">
          <p className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
            {t("your_rank")}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-xs text-[var(--color-ink-mid)]">{t("current_streak")}</p>
              <p className="font-serif text-2xl tabular-nums mt-0.5">
                {myInList.currentStreak}{" "}
                <span className="text-sm text-[var(--color-ink-soft)]">
                  · {t("rank_n", { n: myCurrentRank ?? "-" })}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-mid)]">{t("longest_streak")}</p>
              <p className="font-serif text-2xl tabular-nums mt-0.5">
                {myInList.longestStreak}{" "}
                <span className="text-sm text-[var(--color-ink-soft)]">
                  · {t("rank_n", { n: myLongestRank ?? "-" })}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 目前連續榜 */}
      <RankSection
        title={t("tab_current")}
        couples={byCurrent}
        meId={myCouple?.id ?? null}
        valueOf={(c) => c.currentStreak}
        labelCouple={(n) => t("couple_label", { n })}
        labelYou={t("you")}
        emptyText={t("no_data")}
      />

      {/* 最長紀錄榜 */}
      <RankSection
        title={t("tab_longest")}
        couples={byLongest}
        meId={myCouple?.id ?? null}
        valueOf={(c) => c.longestStreak}
        labelCouple={(n) => t("couple_label", { n })}
        labelYou={t("you")}
        emptyText={t("no_data")}
      />

      <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
        {t("anonymous_note")}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-ink-soft)]">
        {label}
      </span>
      <div className="font-serif text-3xl tabular-nums mt-1 text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}

function RankSection({
  title,
  couples,
  meId,
  valueOf,
  labelCouple,
  labelYou,
  emptyText,
}: {
  title: string;
  couples: CoupleAgg[];
  meId: string | null;
  valueOf: (c: CoupleAgg) => number;
  labelCouple: (n: number) => string;
  labelYou: string;
  emptyText: string;
}) {
  const filtered = couples.filter((c) => valueOf(c) > 0);
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm uppercase tracking-[0.18em] text-[var(--color-ink-mid)]">
        {title}
      </h2>
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)] py-3">{emptyText}</p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((c, i) => {
            const isMe = c.coupleId === meId;
            return (
              <li
                key={c.coupleId}
                className={`flex items-center gap-3 py-2.5 border-b border-[var(--color-paper-line)] last:border-b-0 ${
                  isMe ? "bg-[var(--color-paper-dim)] -mx-2 px-2" : ""
                }`}
              >
                <span className="font-serif text-sm w-8 text-[var(--color-ink-soft)] tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm">
                  {isMe ? (
                    <span className="text-[var(--color-accent-deep)]">{labelYou}</span>
                  ) : (
                    <span className="text-[var(--color-ink-mid)]">
                      {labelCouple(i + 1)}
                    </span>
                  )}
                </span>
                <span className="font-serif text-base tabular-nums text-[var(--color-ink)]">
                  {valueOf(c)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
